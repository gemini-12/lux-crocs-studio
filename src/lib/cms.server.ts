import { promises as fs } from "node:fs";
import path from "node:path";
import { createHash, timingSafeEqual } from "node:crypto";
import { useSession } from "@tanstack/react-start/server";

import seed from "../../data/products.json";
import type { Product } from "@/data/products";

const DATA_FILE = path.join(process.cwd(), "data", "products.json");
const IMAGES_DIR = path.join(process.cwd(), "public", "images");

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
  try {
    const raw = await fs.readFile(DATA_FILE, "utf8");
    return normalize(JSON.parse(raw));
  } catch {
    return normalize(seed);
  }
}

export async function writeProducts(products: Product[]): Promise<Product[]> {
  const ordered = products.map((p, i) => ({ ...p, displayOrder: i }));
  await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
  await fs.writeFile(DATA_FILE, `${JSON.stringify(ordered, null, 2)}\n`, "utf8");
  return normalize(ordered);
}

const EXT: Record<string, string> = {
  "image/png": "png",
  "image/webp": "webp",
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
};

export async function saveImage(dataUrl: string, name: string): Promise<string> {
  const match = /^data:([^;]+);base64,(.+)$/s.exec(dataUrl);
  if (!match) throw new Error("Invalid image payload");
  const [, mime, base64] = match;
  const ext = EXT[mime!.toLowerCase()];
  if (!ext) throw new Error("Unsupported format. Use PNG, WEBP or JPEG.");

  const slug =
    name
      .replace(/\.[^.]+$/, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 40) || "image";
  const filename = `${slug}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}.${ext}`;

  await fs.mkdir(IMAGES_DIR, { recursive: true });
  await fs.writeFile(path.join(IMAGES_DIR, filename), Buffer.from(base64!, "base64"));
  return `/images/${filename}`;
}

/** Removes local uploads that are no longer referenced by any product. */
export async function pruneUnusedImages(products: Product[]) {
  const used = new Set<string>();
  for (const p of products) {
    if (p.heroImage) used.add(p.heroImage);
    for (const g of p.gallery ?? []) used.add(g);
  }
  try {
    const files = await fs.readdir(IMAGES_DIR);
    await Promise.all(
      files
        .filter((f) => !used.has(`/images/${f}`))
        .map((f) => fs.rm(path.join(IMAGES_DIR, f), { force: true })),
    );
  } catch {
    /* images dir may not exist yet */
  }
}
