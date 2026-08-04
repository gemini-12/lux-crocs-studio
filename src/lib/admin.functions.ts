import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { Product } from "@/data/product-types";

const productSchema = z.object({
  id: z.string().uuid().optional(),
  slug: z.string().trim().min(1).max(80),
  name: z.string().trim().min(1).max(160),
  description: z.string().trim().max(2000).default(""),
  price: z.string().trim().max(40).default(""),
  category: z.string().trim().max(80).default("Classic Clog"),
  color_name: z.string().trim().max(80).default(""),
  eyebrow: z.string().trim().max(80).default(""),
  release_label: z.string().trim().max(120).default(""),
  alt_text: z.string().trim().max(240).default(""),
  sizes: z.array(z.string().trim().min(1).max(10)).max(40).default([]),
  colors: z
    .array(z.object({ name: z.string().trim().min(1).max(60), hex: z.string().trim().max(30) }))
    .max(20)
    .default([]),
  hero_image: z.string().trim().max(600).default(""),
  gallery_images: z.array(z.string().trim().max(600)).max(24).default([]),
  accent: z.string().trim().max(80),
  glow: z.string().trim().max(80),
  bg_from: z.string().trim().max(80),
  bg_to: z.string().trim().max(80),
  ink: z.string().trim().max(80),
  display_order: z.number().int().min(0).max(9999).default(0),
  is_active: z.boolean().default(true),
});

export const adminLogin = createServerFn({ method: "POST" })
  .inputValidator((d: { password: string }) => z.object({ password: z.string().max(200) }).parse(d))
  .handler(async ({ data }) => {
    const { adminSessionConfig, passwordMatches } = await import("./admin.server");
    const { useSession } = await import("@tanstack/react-start/server");
    const expected = process.env["ADMIN_PASSWORD"];
    if (!expected || !passwordMatches(data.password, expected)) {
      return { ok: false as const };
    }
    const session = await useSession<{ admin?: boolean }>(adminSessionConfig());
    await session.update({ admin: true });
    return { ok: true as const };
  });

export const adminLogout = createServerFn({ method: "POST" }).handler(async () => {
  const { adminSessionConfig } = await import("./admin.server");
  const { useSession } = await import("@tanstack/react-start/server");
  const session = await useSession<{ admin?: boolean }>(adminSessionConfig());
  await session.clear();
  return { ok: true as const };
});

export const adminStatus = createServerFn({ method: "GET" }).handler(async () => {
  const { isAdmin } = await import("./admin.server");
  return { authed: await isAdmin() };
});

export const adminListProducts = createServerFn({ method: "GET" }).handler(
  async (): Promise<Product[]> => {
    const { requireAdmin, serviceClient, PRODUCT_COLUMNS } = await import("./admin.server");
    await requireAdmin();
    const { data, error } = await serviceClient()
      .from("products")
      .select(PRODUCT_COLUMNS)
      .order("display_order", { ascending: true });
    if (error) throw new Error(error.message);
    return (data ?? []) as unknown as Product[];
  },
);

export const adminSaveProduct = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => productSchema.parse(d))
  .handler(async ({ data }) => {
    const { requireAdmin, serviceClient } = await import("./admin.server");
    await requireAdmin();
    const client = serviceClient();
    const { id, ...values } = data;
    if (id) {
      const { error } = await client.from("products").update(values).eq("id", id);
      if (error) throw new Error(error.message);
      return { ok: true as const, id };
    }
    const { data: inserted, error } = await client
      .from("products")
      .insert(values)
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { ok: true as const, id: (inserted as { id: string }).id };
  });

export const adminDeleteProduct = createServerFn({ method: "POST" })
  .inputValidator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    const { requireAdmin, serviceClient } = await import("./admin.server");
    await requireAdmin();
    const { error } = await serviceClient().from("products").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

export const adminReorderProducts = createServerFn({ method: "POST" })
  .inputValidator((d: { ids: string[] }) =>
    z.object({ ids: z.array(z.string().uuid()).max(200) }).parse(d),
  )
  .handler(async ({ data }) => {
    const { requireAdmin, serviceClient } = await import("./admin.server");
    await requireAdmin();
    const client = serviceClient();
    for (let i = 0; i < data.ids.length; i++) {
      const { error } = await client
        .from("products")
        .update({ display_order: i + 1 })
        .eq("id", data.ids[i]!);
      if (error) throw new Error(error.message);
    }
    return { ok: true as const };
  });

export const adminUploadImage = createServerFn({ method: "POST" })
  .inputValidator((d: { filename: string; contentType: string; dataBase64: string }) =>
    z
      .object({
        filename: z.string().trim().min(1).max(160),
        contentType: z.enum(["image/webp", "image/png", "image/jpeg"]),
        dataBase64: z.string().max(12_000_000),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const { requireAdmin, serviceClient } = await import("./admin.server");
    await requireAdmin();
    const safe = data.filename.replace(/[^a-zA-Z0-9._-]/g, "-").slice(-80);
    const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${safe}`;
    const bytes = Buffer.from(data.dataBase64, "base64");
    const { error } = await serviceClient()
      .storage.from("product-images")
      .upload(path, bytes, { contentType: data.contentType, upsert: false });
    if (error) throw new Error(error.message);
    return { url: `/api/public/media/${path}` };
  });

export const adminDeleteImage = createServerFn({ method: "POST" })
  .inputValidator((d: { url: string }) => z.object({ url: z.string().max(600) }).parse(d))
  .handler(async ({ data }) => {
    const { requireAdmin, serviceClient } = await import("./admin.server");
    await requireAdmin();
    const prefix = "/api/public/media/";
    if (!data.url.startsWith(prefix)) return { ok: true as const };
    const path = data.url.slice(prefix.length);
    await serviceClient().storage.from("product-images").remove([path]);
    return { ok: true as const };
  });
