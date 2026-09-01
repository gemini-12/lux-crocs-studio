import { createContext, useContext, type ReactNode } from "react";

/** The two independent universes of the store. */
export type BrandId = "crocs" | "nike-mind";

export type BrandConfig = {
  id: BrandId;
  /** Wordmark shown in the header / footer */
  wordmark: string;
  wordmarkAccent: string;
  /** Short label used in the universe switcher */
  short: string;
  /** Base path of the universe */
  path: string;
  studioLine: string;
  orderNoun: string;
};

export const BRANDS: Record<BrandId, BrandConfig> = {
  crocs: {
    id: "crocs",
    wordmark: "Croc",
    wordmarkAccent: "Atelier",
    short: "Crocs",
    path: "/",
    studioLine: "Collectible footwear, produced in numbered series from a studio in Antwerp.",
    orderNoun: "Crocs",
  },
  "nike-mind": {
    id: "nike-mind",
    wordmark: "Nike",
    wordmarkAccent: "Mind 001",
    short: "Nike Mind 001",
    path: "/nike-mind",
    studioLine: "Sculpted slip-on mules engineered for motion. Mind 001, released in waves.",
    orderNoun: "Nike Mind 001 mules",
  },
};

export const BRAND_LIST = [BRANDS.crocs, BRANDS["nike-mind"]];

const BrandContext = createContext<BrandId>("crocs");

export function BrandProvider({ brand, children }: { brand: BrandId; children: ReactNode }) {
  return <BrandContext.Provider value={brand}>{children}</BrandContext.Provider>;
}

export function useBrand(): BrandConfig {
  return BRANDS[useContext(BrandContext)];
}
