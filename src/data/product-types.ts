export type ProductColor = { name: string; hex: string };

export type Product = {
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
  colors: ProductColor[];
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

export type Slide = {
  id: string;
  eyebrow: string;
  title: string;
  release: string;
  description: string;
  image: string;
  gallery: string[];
  alt: string;
  price: string;
  colorName: string;
  colors: ProductColor[];
  sizes: string[];
  accent: string;
  glow: string;
  bgFrom: string;
  bgTo: string;
  ink: string;
};

export function toSlide(p: Product): Slide {
  return {
    id: p.id,
    eyebrow: p.eyebrow,
    title: p.name,
    release: p.release_label,
    description: p.description,
    image: p.hero_image,
    gallery: p.gallery_images ?? [],
    alt: p.alt_text || p.name,
    price: p.price,
    colorName: p.color_name,
    colors: p.colors ?? [],
    sizes: p.sizes ?? [],
    accent: p.accent,
    glow: p.glow,
    bgFrom: p.bg_from,
    bgTo: p.bg_to,
    ink: p.ink,
  };
}
