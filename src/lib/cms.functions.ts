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
  saveImage,
  writeProducts,
} from "@/lib/cms.server";

export const getProducts = createServerFn({ method: "GET" }).handler(async () => {
  setResponseHeader("cache-control", "no-store, must-revalidate");
  return readProducts();
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
  .inputValidator((data: { products: Product[] }) => data)
  .handler(async ({ data }) => {
    await requireAdmin();
    setResponseHeader("cache-control", "no-store");
    try {
      const saved = await writeProducts(data.products);
      await pruneUnusedImages(saved);
      return { ok: true as const, products: saved };
    } catch (error) {
      console.error("[cms] saving products failed:", error);
      const message = error instanceof Error ? error.message : "Unknown error";
      return { ok: false as const, error: message, products: [] as Product[] };
    }
  });

export const uploadImageFn = createServerFn({ method: "POST" })
  .inputValidator((data: { dataUrl: string; name: string }) => data)
  .handler(async ({ data }) => {
    await requireAdmin();
    return { url: await saveImage(data.dataUrl, data.name) };
  });
