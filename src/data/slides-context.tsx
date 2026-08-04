import { createContext, useContext } from "react";
import type { Slide } from "@/data/product-types";

const SlidesContext = createContext<Slide[]>([]);

export function SlidesProvider({
  slides,
  children,
}: {
  slides: Slide[];
  children: React.ReactNode;
}) {
  return <SlidesContext.Provider value={slides}>{children}</SlidesContext.Provider>;
}

export function useSlides() {
  return useContext(SlidesContext);
}
