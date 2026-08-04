import { createServerFn } from "@tanstack/react-start";
import type { Product } from "@/data/product-types";

export const listPublicProducts = createServerFn({ method: "GET" }).handler(
  async (): Promise<Product[]> => {
    const { publicClient, PRODUCT_COLUMNS } = await import("./admin.server");
    const { data, error } = await publicClient()
      .from("products")
      .select(PRODUCT_COLUMNS)
      .eq("is_active", true)
      .order("display_order", { ascending: true });
    if (error) throw new Error(error.message);
    return (data ?? []) as unknown as Product[];
  },
);
