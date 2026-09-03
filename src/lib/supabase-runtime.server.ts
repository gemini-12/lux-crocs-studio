/**
 * Runtime Supabase access that works on ANY host (Lovable Cloud, Vercel, Node,
 * edge) without requiring the service-role key.
 *
 * - Public reads  -> publishable key (RLS: anon can read active products/images)
 * - Admin writes  -> a dedicated backend admin account (email + password kept
 *                    strictly server-side) whose RLS role is `admin`.
 *
 * Every variable is read INSIDE the functions so serverless platforms that
 * inject env at request time (Vercel, Cloudflare) work correctly.
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/integrations/supabase/types";

type Client = SupabaseClient<Database>;

function env(...names: string[]): string | undefined {
  const source = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process
    ?.env;
  for (const name of names) {
    const value = source?.[name];
    if (value) return value;
  }
  return undefined;
}

export function supabaseUrl(): string {
  const url = env("SUPABASE_URL", "VITE_SUPABASE_URL");
  if (!url) {
    throw new Error(
      "Missing SUPABASE_URL. Set SUPABASE_URL (or VITE_SUPABASE_URL) in your hosting environment variables.",
    );
  }
  return url;
}

export function supabasePublishableKey(): string {
  const key = env(
    "SUPABASE_PUBLISHABLE_KEY",
    "VITE_SUPABASE_PUBLISHABLE_KEY",
    "SUPABASE_ANON_KEY",
    "VITE_SUPABASE_ANON_KEY",
  );
  if (!key) {
    throw new Error(
      "Missing SUPABASE_PUBLISHABLE_KEY. Set SUPABASE_PUBLISHABLE_KEY (or VITE_SUPABASE_PUBLISHABLE_KEY) in your hosting environment variables.",
    );
  }
  return key;
}

/** Opaque `sb_*` keys are not JWTs: send them as `apikey`, never as a bearer. */
function keyFetch(key: string): typeof fetch {
  return (input, init) => {
    const headers = new Headers(
      typeof Request !== "undefined" && input instanceof Request ? input.headers : undefined,
    );
    if (init?.headers) new Headers(init.headers).forEach((v, k) => headers.set(k, v));
    if (key.startsWith("sb_") && headers.get("Authorization") === `Bearer ${key}`) {
      headers.delete("Authorization");
    }
    headers.set("apikey", key);
    return fetch(input, { ...init, headers });
  };
}

function makeClient(): Client {
  const key = supabasePublishableKey();
  return createClient<Database>(supabaseUrl(), key, {
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
    global: { fetch: keyFetch(key) },
  });
}

let _public: Client | undefined;

/** Anonymous, RLS-scoped client used for public catalogue + image reads. */
export function publicClient(): Client {
  if (!_public) _public = makeClient();
  return _public;
}

let _admin: { client: Client; expiresAt: number } | undefined;

/**
 * Client authenticated as the backend admin account. Credentials never leave
 * the server and are configured through environment variables.
 */
export async function adminClient(): Promise<Client> {
  if (_admin && _admin.expiresAt > Date.now() + 60_000) return _admin.client;

  const email = env("ADMIN_SUPABASE_EMAIL");
  const password = env("ADMIN_SUPABASE_PASSWORD");
  if (!email || !password) {
    throw new Error(
      "Missing ADMIN_SUPABASE_EMAIL / ADMIN_SUPABASE_PASSWORD. Add them to your hosting environment variables so the admin panel can write to the database.",
    );
  }

  const client = makeClient();
  const { data, error } = await client.auth.signInWithPassword({ email, password });
  if (error || !data.session) {
    console.error("[supabase] admin sign-in failed:", error);
    throw new Error("The backend admin account could not sign in. Check the admin credentials.");
  }

  _admin = { client, expiresAt: (data.session.expires_at ?? 0) * 1000 || Date.now() + 30 * 60_000 };
  return client;
}

/** Drops the cached admin session (used when a write fails with 401/403). */
export function resetAdminClient() {
  _admin = undefined;
}
