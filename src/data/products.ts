import lightning from "@/assets/21326256_53153321_1000-removebg-preview.png.asset.json";
import blossom from "@/assets/23930324_54101768_1000-removebg-preview.png.asset.json";
import phantom from "@/assets/31818538_62158415_1000-removebg-preview.png.asset.json";
import rust from "@/assets/CRO209376-0DA_1200x-removebg-preview.png.asset.json";
import citrus from "@/assets/crocs_classic_clog_spongebob_schwammkopf-removebg-preview.png.asset.json";

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
  /** oklch color strings driving the slide atmosphere */
  accent: string;
  glow: string;
  bgFrom: string;
  bgTo: string;
  ink: string;
};

export const slides: Slide[] = [
  {
    id: "lightning",
    colorName: "Racing Red",
    eyebrow: "Collection 01",
    title: "Cars Classic Clog",
    release: "Limited Release — 500 pairs",
    description:
      "Racing lacquer, hand-applied decals and a silhouette built for speed on any surface.",
    image: lightning.url,
    alt: "Red Cars Classic Clog collectible Crocs with racing decals",
    price: "€240",
    accent: "oklch(0.62 0.23 27)",
    glow: "oklch(0.62 0.23 27 / 0.38)",
    bgFrom: "oklch(0.17 0.05 25)",
    bgTo: "oklch(0.09 0.02 20)",
    ink: "oklch(0.98 0.01 30)",
  },
  {
    id: "citrus",
    colorName: "High-Voltage Yellow",
    eyebrow: "Collection 02",
    title: "SpongeBob SquarePants Classic Clog",
    release: "Limited Release — 400 pairs",
    description:
      "High-voltage yellow over a tangerine midsole. Loud, precise, unmistakable.",
    image: citrus.url,
    alt: "Yellow SpongeBob SquarePants Classic Clog collectible Crocs with orange sole",
    price: "€230",
    accent: "oklch(0.85 0.18 100)",
    glow: "oklch(0.88 0.17 100 / 0.3)",
    bgFrom: "oklch(0.22 0.05 95)",
    bgTo: "oklch(0.1 0.02 90)",
    ink: "oklch(0.99 0.02 100)",
  },
  {
    id: "phantom",
    colorName: "Phantom Black",
    eyebrow: "Collection 03",
    title: "Batman Classic Clog",
    release: "Limited Release — 150 pairs",
    description:
      "Monolithic black-on-black. Matte body, gloss chassis, near-invisible detailing.",
    image: phantom.url,
    alt: "All black Batman Classic Clog collectible Crocs",
    price: "€310",
    accent: "oklch(0.75 0.03 250)",
    glow: "oklch(0.85 0.02 240 / 0.22)",
    bgFrom: "oklch(0.19 0.01 250)",
    bgTo: "oklch(0.08 0.005 250)",
    ink: "oklch(0.97 0.002 250)",
  },
  {
    id: "rust",
    colorName: "Rose Blush",
    eyebrow: "Collection 04",
    title: "Rose Blush Classic Clog",
    release: "Limited Release — 220 pairs",
    description:
      "Weathered copper patina with sculpted chrome hardware. An object with mileage.",
    image: rust.url,
    alt: "Rose Blush Classic Clog collectible Crocs with sculpted detailing",
    price: "€255",
    accent: "oklch(0.68 0.15 55)",
    glow: "oklch(0.7 0.14 60 / 0.32)",
    bgFrom: "oklch(0.21 0.04 60)",
    bgTo: "oklch(0.1 0.02 50)",
    ink: "oklch(0.98 0.01 70)",
  },
  {
    id: "blossom",
    colorName: "Pastel Pink",
    eyebrow: "Collection 05",
    title: "Patrick Star Classic Clog",
    release: "Limited Release — 300 pairs",
    description:
      "Soft pastel resin cut with acid citrus blocks. Playful proportion, couture finish.",
    image: blossom.url,
    alt: "Pink Patrick Star Classic Clog collectible Crocs with lilac and yellow sole",
    price: "€265",
    accent: "oklch(0.78 0.15 5)",
    glow: "oklch(0.8 0.14 350 / 0.35)",
    bgFrom: "oklch(0.23 0.06 340)",
    bgTo: "oklch(0.11 0.03 330)",
    ink: "oklch(0.98 0.01 340)",
  },
];

