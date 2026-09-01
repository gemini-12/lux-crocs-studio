import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";

import { getProducts } from "@/lib/cms.functions";
import { useBrand, type BrandId } from "@/data/brands";

/** Product shape stored in the cloud database — the single source of truth. */
export type Product = {
  id: string;
  /** Universe the product belongs to: "crocs" or "nike-mind". */
  brand: BrandId;
  name: string;
  description: string;
  price: string;
  category: string;
  sizes: string[];
  colors: string[];
  heroImage: string;
  gallery: string[];
  displayOrder: number;
  active: boolean;
  /** presentation extras */
  release?: string;
  alt?: string;
  accent?: string;
  glow?: string;
  bgFrom?: string;
  bgTo?: string;
  ink?: string;
};

/** View model consumed by the storefront components. */
export type Slide = {
  id: string;
  eyebrow: string;
  title: string;
  release: string;
  description: string;
  image: string;
  alt: string;
  price: string;
  colorName: string;
  sizes: string[];
  gallery: string[];
  accent: string;
  glow: string;
  bgFrom: string;
  bgTo: string;
  ink: string;
};

export function toSlide(p: Product): Slide {
  return {
    id: p.id,
    eyebrow: p.category || "Collection",
    title: p.name,
    release: p.release || "Limited release",
    description: p.description,
    image: p.heroImage,
    alt: p.alt || p.name,
    price: p.price,
    colorName: p.colors?.[0] ?? "",
    sizes: p.sizes?.length ? p.sizes : ["38", "39", "40", "41", "42", "43", "44"],
    gallery: p.gallery ?? [],
    accent: p.accent || "oklch(0.75 0.03 250)",
    glow: p.glow || "oklch(0.85 0.02 240 / 0.22)",
    bgFrom: p.bgFrom || "oklch(0.19 0.01 250)",
    bgTo: p.bgTo || "oklch(0.08 0.005 250)",
    ink: p.ink || "oklch(0.97 0.002 250)",
  };
}

export function productsQueryOptions(brand: BrandId) {
  return queryOptions({
    queryKey: ["products", brand],
    queryFn: () => getProducts({ data: { brand } }),
  });
}

/** Storefront hook: only active products of the current universe. */
export function useSlides(): Slide[] {
  const brand = useBrand();
  const { data } = useSuspenseQuery(productsQueryOptions(brand.id));
  return data
    .filter((p) => p.active !== false)
    .sort((a, b) => a.displayOrder - b.displayOrder)
    .map(toSlide);
}
