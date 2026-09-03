import { createServerFn } from "@tanstack/react-start";
import { setResponseHeader } from "@tanstack/react-start/server";

import type { Product } from "@/data/products";
import {
  getSession,
  isUnlocked,
  passwordMatches,
  pruneUnusedImages,
  readProducts,
  requireAdmin,
  writeProducts,
} from "@/lib/cms.server";

export const getProducts = createServerFn({ method: "GET" })
  .inputValidator((data: { brand?: string } | undefined) => data ?? {})
  .handler(async ({ data }) => {
    setResponseHeader("cache-control", "no-store, must-revalidate");
    // Admins see the full catalogue (including inactive products); visitors
    // only get what the public access rules expose.
    const admin = await isUnlocked();
    return readProducts(data?.brand ?? "crocs", { admin });
  });

export const getAdminSession = createServerFn({ method: "GET" }).handler(async () => {
  return { unlocked: await isUnlocked() };
});

export const adminLogin = createServerFn({ method: "POST" })
  .inputValidator((data: { password: string }) => data)
  .handler(async ({ data }) => {
    if (!passwordMatches(String(data?.password ?? ""))) {
      return { ok: false as const };
    }
    const session = await getSession();
    await session.update({ unlocked: true });
    return { ok: true as const };
  });

export const adminLogout = createServerFn({ method: "POST" }).handler(async () => {
  const session = await getSession();
  await session.clear();
  return { ok: true as const };
});

export const saveProductsFn = createServerFn({ method: "POST" })
  .inputValidator((data: { products: Product[]; brand?: string }) => data)
  .handler(async ({ data }) => {
    await requireAdmin();
    setResponseHeader("cache-control", "no-store");
    try {
      const brand = data.brand ?? "crocs";
      const saved = await writeProducts(data.products, brand);
      // Prune against the WHOLE catalogue so the other universe keeps its images.
      await pruneUnusedImages(await readProducts());
      return { ok: true as const, products: saved };
    } catch (error) {
      console.error("[cms] saving products failed:", error);
      const message = error instanceof Error ? error.message : "Unknown error";
      return { ok: false as const, error: message, products: [] as Product[] };
    }
  });
