import { promises as fs } from "node:fs";
import path from "node:path";
import { createHash, timingSafeEqual } from "node:crypto";
import { useSession } from "@tanstack/react-start/server";

import seed from "../../data/products.json";
import type { Product } from "@/data/products";

/**
 * Resolve the project root deterministically instead of trusting process.cwd().
 * Walks up from cwd (and from this module's directory as a fallback) until it
 * finds the directory that owns package.json.
 */
let cachedRoot: string | null = null;

async function exists(p: string) {
  try {
    await fs.stat(p);
    return true;
  } catch {
    return false;
  }
}

async function walkUpForPackageJson(start: string): Promise<string | null> {
  let dir = start;
  for (let i = 0; i < 8; i += 1) {
    if (await exists(path.join(dir, "package.json"))) return dir;
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return null;
}

export async function projectRoot(): Promise<string> {
  if (cachedRoot) return cachedRoot;
  const candidates: string[] = [];
  try {
    candidates.push(process.cwd());
  } catch {
    /* cwd unavailable in some runtimes */
  }
  try {
    const here = path.dirname(new URL(import.meta.url).pathname);
    candidates.push(here);
  } catch {
    /* import.meta.url unavailable */
  }
  for (const c of candidates) {
    const found = await walkUpForPackageJson(c);
    if (found) {
      cachedRoot = found;
      return found;
    }
  }
  cachedRoot = candidates[0] ?? "/";
  return cachedRoot;
}

export async function dataFile() {
  return path.join(await projectRoot(), "data", "products.json");
}

export async function imagesDir() {
  return path.join(await projectRoot(), "public", "images");
}

/** Server-only. Never imported by client code. */
const ADMIN_PASSWORD = process.env["ADMIN_PASSWORD"] ?? "simo123";
const SESSION_PASSWORD =
  process.env["SESSION_SECRET"] ?? "croc-atelier-admin-session-secret-key-v1-2026";

const sessionConfig = {
  password: SESSION_PASSWORD,
  name: "croc-admin",
  maxAge: 60 * 60 * 12,
  cookie: { httpOnly: true, secure: true, sameSite: "lax" as const, path: "/" },
};

type AdminSession = { unlocked?: boolean };

function digest(value: string) {
  return createHash("sha256").update(value, "utf8").digest();
}

export function passwordMatches(input: string) {
  return timingSafeEqual(digest(input), digest(ADMIN_PASSWORD));
}

export async function getSession() {
  return useSession<AdminSession>(sessionConfig);
}

export async function isUnlocked() {
  const session = await getSession();
  return session.data.unlocked === true;
}

export async function requireAdmin() {
  if (!(await isUnlocked())) {
    throw new Response("Access Denied", { status: 401 });
  }
}

function normalize(list: unknown): Product[] {
  if (!Array.isArray(list)) return [];
  return (list as Product[])
    .map((p, i) => ({
      ...p,
      sizes: Array.isArray(p.sizes) ? p.sizes : [],
      colors: Array.isArray(p.colors) ? p.colors : [],
      gallery: Array.isArray(p.gallery) ? p.gallery : [],
      displayOrder: typeof p.displayOrder === "number" ? p.displayOrder : i,
      active: p.active !== false,
    }))
    .sort((a, b) => a.displayOrder - b.displayOrder);
}

export async function readProducts(): Promise<Product[]> {
  const file = await dataFile();
  try {
    const raw = await fs.readFile(file, "utf8");
    return normalize(JSON.parse(raw));
  } catch (error) {
    console.warn(`[cms] falling back to seed products (${file}):`, error);
    return normalize(seed);
  }
}

/** Rejects payloads that would corrupt the catalogue. */
function validate(products: unknown): Product[] {
  if (!Array.isArray(products)) throw new Error("Payload must be an array of products");
  const seen = new Set<string>();
  return products.map((raw, i) => {
    const p = raw as Partial<Product>;
    if (!p || typeof p !== "object") throw new Error(`Product #${i + 1} is not an object`);
    const id = String(p.id ?? "").trim();
    if (!id) throw new Error(`Product #${i + 1} is missing an id`);
    if (seen.has(id)) throw new Error(`Duplicate product id "${id}"`);
    seen.add(id);
    if (!String(p.name ?? "").trim()) throw new Error(`Product "${id}" is missing a name`);
    return { ...(p as Product), id };
  });
}

/**
 * Merge-writes the catalogue: existing entries keep every field the admin did
 * not send, entries absent from the payload are removed (explicit deletion),
 * and display order follows the submitted order.
 */
export async function writeProducts(products: Product[]): Promise<Product[]> {
  const incoming = validate(products);
  const existing = await readProducts();
  const byId = new Map(existing.map((p) => [p.id, p]));

  const merged = incoming.map((p, i) => ({
    ...(byId.get(p.id) ?? {}),
    ...p,
    displayOrder: i,
  })) as Product[];

  const file = await dataFile();
  const tmp = `${file}.tmp`;
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(tmp, `${JSON.stringify(merged, null, 2)}\n`, "utf8");
  await fs.rename(tmp, file);
  console.info(`[cms] wrote ${merged.length} products to ${file}`);
  return normalize(merged);
}

const EXT_BY_MIME: Record<string, string> = {
  "image/png": "png",
  "image/webp": "webp",
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
};
const ALLOWED_EXT = new Set(["png", "webp", "jpg", "jpeg"]);

export function safeFilename(name: string, ext: string) {
  const slug =
    name
      .replace(/\.[^.]+$/, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 40) || "image";
  return `${slug}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}.${ext}`;
}

/** Writes raw bytes to /public/images and returns the public URL. */
export async function saveImageBytes(
  bytes: Uint8Array,
  mime: string,
  originalName: string,
): Promise<string> {
  const normalizedMime = mime.toLowerCase().split(";")[0]!.trim();
  const mimeExt = EXT_BY_MIME[normalizedMime];
  const nameExt = originalName.split(".").pop()?.toLowerCase() ?? "";
  if (!mimeExt) throw new Error(`Unsupported file type "${mime}". Use PNG, WEBP or JPEG.`);
  if (nameExt && !ALLOWED_EXT.has(nameExt)) {
    throw new Error(`Unsupported file extension ".${nameExt}". Use PNG, WEBP or JPEG.`);
  }
  if (!bytes.byteLength) throw new Error("The uploaded file is empty");

  const dir = await imagesDir();
  await fs.mkdir(dir, { recursive: true });
  const filename = safeFilename(originalName, mimeExt);
  const target = path.join(dir, filename);
  await fs.writeFile(target, bytes);
  console.info(`[cms] saved image ${target} (${bytes.byteLength} bytes)`);
  return `/images/${filename}`;
}

/** Legacy data-URL path, kept for compatibility. */
export async function saveImage(dataUrl: string, name: string): Promise<string> {
  const match = /^data:([^;]+);base64,(.+)$/s.exec(dataUrl);
  if (!match) throw new Error("Invalid image payload");
  const [, mime, base64] = match;
  return saveImageBytes(new Uint8Array(Buffer.from(base64!, "base64")), mime!, name);
}

const PRUNE_GRACE_MS = 1000 * 60 * 60; // never delete very recent uploads

/** Removes local uploads that are no longer referenced by any product. */
export async function pruneUnusedImages(products: Product[]) {
  const used = new Set<string>();
  for (const p of products) {
    if (p.heroImage) used.add(p.heroImage);
    for (const g of p.gallery ?? []) used.add(g);
  }
  const dir = await imagesDir();
  try {
    const files = await fs.readdir(dir);
    await Promise.all(
      files.map(async (f) => {
        if (used.has(`/images/${f}`)) return;
        const full = path.join(dir, f);
        try {
          const stat = await fs.stat(full);
          if (Date.now() - stat.mtimeMs < PRUNE_GRACE_MS) return;
          await fs.rm(full, { force: true });
          console.info(`[cms] pruned unused image ${full}`);
        } catch (error) {
          console.warn(`[cms] could not prune ${full}:`, error);
        }
      }),
    );
  } catch {
    /* images dir may not exist yet */
  }
}
