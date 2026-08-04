import { createClient } from "@supabase/supabase-js";
import { useSession } from "@tanstack/react-start/server";
import { createHash, timingSafeEqual } from "node:crypto";

export type AdminSession = { admin?: boolean };

export function adminSessionConfig() {
  return {
    password: process.env["ADMIN_SESSION_SECRET"]!,
    name: "atelier-admin",
    maxAge: 60 * 60 * 8,
    cookie: {
      httpOnly: true,
      secure: true,
      sameSite: "lax" as const,
      path: "/",
    },
  };
}

export function passwordMatches(input: string, expected: string) {
  const a = createHash("sha256").update(input, "utf8").digest();
  const b = createHash("sha256").update(expected, "utf8").digest();
  return timingSafeEqual(a, b);
}

export async function isAdmin() {
  const session = await useSession<AdminSession>(adminSessionConfig());
  return session.data.admin === true;
}

export async function requireAdmin() {
  if (!(await isAdmin())) throw new Error("Access Denied");
}

function supabaseFetch(key: string): typeof fetch {
  return (input, init) => {
    const headers = new Headers(init?.headers);
    if (headers.get("Authorization") === `Bearer ${key}`) {
      headers.delete("Authorization");
    }
    headers.set("apikey", key);
    return fetch(input, { ...init, headers });
  };
}

export function serviceClient() {
  const key = process.env["SUPABASE_SERVICE_ROLE_KEY"]!;
  return createClient(process.env["SUPABASE_URL"]!, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { fetch: supabaseFetch(key) },
  });
}

export function publicClient() {
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
  return createClient(process.env["SUPABASE_URL"]!, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { fetch: supabaseFetch(key) },
  });
}

export const PRODUCT_COLUMNS =
  "id, slug, name, description, price, category, color_name, eyebrow, release_label, alt_text, sizes, colors, hero_image, gallery_images, accent, glow, bg_from, bg_to, ink, display_order, is_active";
