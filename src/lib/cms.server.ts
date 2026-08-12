import { createHash, randomUUID, timingSafeEqual } from "node:crypto";
import { useSession } from "@tanstack/react-start/server";

import { supabaseAdmin } from "@/integrations/supabase/client.server";
import type { Product } from "@/data/products";

export const BUCKET = "product-images";
/** Public path prefix served by src/routes/images/$.ts (streams from Storage). */
export const IMAGE_URL_PREFIX = "/images/";

/** Server-only. Never imported by client code. */
const ADMIN_PASSWORD = process.env["ADMIN_PASSWORD"] ?? "simo123";
const SESSION_PASSWORD =
  process.env["ADMIN_SESSION_SECRET"] ??
  process.env["SESSION_SECRET"] ??
  "croc-atelier-admin-session-secret-key-v1-2026";

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

/* ------------------------------------------------------------------ */
/* Row <-> Product mapping                                             */
/* ------------------------------------------------------------------ */

type Row = {
  id: string;
  slug: string;
  name: string;
  description: string;
  price: string;
  category: string;
  color_name: string;
  eyebrow: string;
  release_label: string;
  alt_text: string;
  sizes: string[];
  colors: unknown;
  hero_image: string;
  gallery_images: string[];
  accent: string;
  glow: string;
  bg_from: string;
  bg_to: string;
  ink: string;
  display_order: number;
  is_active: boolean;
};

const COLUMNS =
  "id, slug, name, description, price, category, color_name, eyebrow, release_label, alt_text, sizes, colors, hero_image, gallery_images, accent, glow, bg_from, bg_to, ink, display_order, is_active";

function toStringArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.map((v) => String(v));
  return [];
}

export function rowToProduct(r: Row): Product {
  return {
    id: r.id,
    name: r.name,
    description: r.description,
    price: r.price,
    category: r.category,
    sizes: toStringArray(r.sizes),
    colors: toStringArray(r.colors),
    heroImage: r.hero_image,
    gallery: toStringArray(r.gallery_images),
    displayOrder: r.display_order,
    active: r.is_active,
    release: r.release_label,
    alt: r.alt_text,
    accent: r.accent,
    glow: r.glow,
    bgFrom: r.bg_from,
    bgTo: r.bg_to,
    ink: r.ink,
  };
}

export function slugify(value: string, fallback = "product") {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 48) || fallback
  );
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function productToRow(p: Product, index: number) {
  const defaults = {
    accent: "oklch(0.75 0.03 250)",
    glow: "oklch(0.85 0.02 240 / 0.22)",
    bgFrom: "oklch(0.19 0.01 250)",
    bgTo: "oklch(0.08 0.005 250)",
    ink: "oklch(0.97 0.002 250)",
  };
  const row: {
    id: string;
    slug: string;
    name: string;
    [k: string]: unknown;
  } = {
    slug: slugify(p.name || String(p.id)),
    name: p.name,
    description: p.description ?? "",
    price: p.price ?? "",
    category: p.category ?? "",
    eyebrow: p.category ?? "",
    color_name: p.colors?.[0] ?? "",
    release_label: p.release ?? "",
    alt_text: p.alt ?? p.name ?? "",
    sizes: Array.isArray(p.sizes) ? p.sizes : [],
    colors: Array.isArray(p.colors) ? p.colors : [],
    hero_image: p.heroImage ?? "",
    gallery_images: Array.isArray(p.gallery) ? p.gallery : [],
    accent: p.accent || defaults.accent,
    glow: p.glow || defaults.glow,
    bg_from: p.bgFrom || defaults.bgFrom,
    bg_to: p.bgTo || defaults.bgTo,
    ink: p.ink || defaults.ink,
    display_order: index,
    is_active: p.active !== false,
    updated_at: new Date().toISOString(),
  };
  row.id = UUID_RE.test(String(p.id)) ? String(p.id) : randomUUID();
  return row;
}

/* ------------------------------------------------------------------ */
/* Reads / writes                                                      */
/* ------------------------------------------------------------------ */

export async function readProducts(): Promise<Product[]> {
  const { data, error } = await supabaseAdmin
    .from("products")
    .select(COLUMNS)
    .order("display_order", { ascending: true });
  if (error) {
    console.error("[cms] failed to read products:", error);
    throw new Error("Could not load the catalogue from the database.");
  }
  return (data as unknown as Row[]).map(rowToProduct);
}

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
 * Upserts the submitted catalogue: rows keep their id (no duplicates), rows
 * missing from the payload are deleted, display order follows the payload.
 */
export async function writeProducts(products: Product[]): Promise<Product[]> {
  const incoming = validate(products);
  const existing = await readProducts();

  const keepIds = new Set(incoming.map((p) => p.id).filter((id) => UUID_RE.test(id)));
  const removed = existing.filter((p) => !keepIds.has(p.id));

  if (removed.length) {
    const { error } = await supabaseAdmin
      .from("products")
      .delete()
      .in(
        "id",
        removed.map((p) => p.id),
      );
    if (error) {
      console.error("[cms] delete failed:", error);
      throw new Error("Could not remove deleted products.");
    }
  }

  const rows = incoming.map(productToRow);

  const fail = (label: string, error: { code?: string; message?: string } | null) => {
    if (!error) return;
    console.error(`[cms] ${label} failed:`, error);
    throw new Error(
      error.code === "23505"
        ? "Two products resolve to the same name — give them distinct names."
        : "Could not save the products to the database.",
    );
  };

  if (rows.length) {
    const { error } = await supabaseAdmin
      .from("products")
      .upsert(rows as never, { onConflict: "id" });
    fail("upsert", error);
  }

  return readProducts();
}

/* ------------------------------------------------------------------ */
/* Storage                                                             */
/* ------------------------------------------------------------------ */

const EXT_BY_MIME: Record<string, string> = {
  "image/png": "png",
  "image/webp": "webp",
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
};
const ALLOWED_EXT = new Set(["png", "webp", "jpg", "jpeg"]);
export const MIME_BY_EXT: Record<string, string> = {
  png: "image/png",
  webp: "image/webp",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
};

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

/** Storage object key for a public `/images/...` URL, or null. */
export function storageKeyFromUrl(url: string): string | null {
  if (!url?.startsWith(IMAGE_URL_PREFIX)) return null;
  const key = url.slice(IMAGE_URL_PREFIX.length).split("?")[0]!;
  return key.includes("..") || !key ? null : decodeURIComponent(key);
}

/** Uploads raw bytes to Supabase Storage and returns the app-served URL. */
export async function saveImageBytes(
  bytes: Uint8Array,
  mime: string,
  originalName: string,
  folder = "uploads",
): Promise<string> {
  const normalizedMime = mime.toLowerCase().split(";")[0]!.trim();
  const mimeExt = EXT_BY_MIME[normalizedMime];
  const nameExt = originalName.split(".").pop()?.toLowerCase() ?? "";
  if (!mimeExt) throw new Error(`Unsupported file type "${mime}". Use PNG, WEBP or JPEG.`);
  if (nameExt && !ALLOWED_EXT.has(nameExt)) {
    throw new Error(`Unsupported file extension ".${nameExt}". Use PNG, WEBP or JPEG.`);
  }
  if (!bytes.byteLength) throw new Error("The uploaded file is empty");

  const key = `${slugify(folder, "uploads")}/${safeFilename(originalName, mimeExt)}`;
  const { error } = await supabaseAdmin.storage
    .from(BUCKET)
    .upload(key, bytes, { contentType: normalizedMime, upsert: false });
  if (error) {
    console.error("[cms] storage upload failed:", error);
    throw new Error("Storage rejected the upload. Please try again.");
  }
  console.info(`[cms] uploaded ${key} (${bytes.byteLength} bytes)`);
  return `${IMAGE_URL_PREFIX}${key}`;
}

/** Streams a stored image back to the browser. */
export async function downloadImage(key: string) {
  const { data, error } = await supabaseAdmin.storage.from(BUCKET).download(key);
  if (error || !data) return null;
  return new Uint8Array(await data.arrayBuffer());
}

const PRUNE_GRACE_MS = 1000 * 60 * 60; // never delete very recent uploads

async function listAllKeys(prefix = ""): Promise<{ key: string; createdAt: number }[]> {
  const { data, error } = await supabaseAdmin.storage
    .from(BUCKET)
    .list(prefix, { limit: 1000, sortBy: { column: "name", order: "asc" } });
  if (error || !data) return [];
  const out: { key: string; createdAt: number }[] = [];
  for (const entry of data) {
    const full = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.id === null) {
      out.push(...(await listAllKeys(full)));
    } else {
      out.push({ key: full, createdAt: Date.parse(entry.created_at ?? "") || Date.now() });
    }
  }
  return out;
}

/** Removes stored images that are no longer referenced by any product. */
export async function pruneUnusedImages(products: Product[]) {
  const used = new Set<string>();
  for (const p of products) {
    for (const url of [p.heroImage, ...(p.gallery ?? [])]) {
      const key = url && storageKeyFromUrl(url);
      if (key) used.add(key);
    }
  }
  try {
    const all = await listAllKeys();
    const stale = all
      .filter((f) => !used.has(f.key) && Date.now() - f.createdAt > PRUNE_GRACE_MS)
      .map((f) => f.key);
    if (!stale.length) return;
    const { error } = await supabaseAdmin.storage.from(BUCKET).remove(stale);
    if (error) console.warn("[cms] prune failed:", error);
    else console.info(`[cms] pruned ${stale.length} unused image(s)`);
  } catch (error) {
    console.warn("[cms] prune skipped:", error);
  }
}
