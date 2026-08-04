import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { SmoothScroll } from "@/components/site/SmoothScroll";
import { Header } from "@/components/site/Header";
import { Hero } from "@/components/site/Hero";
import { ProductSection } from "@/components/site/ProductSection";
import { Collection } from "@/components/site/Collection";
import { Gallery } from "@/components/site/Gallery";
import { Newsletter } from "@/components/site/Newsletter";
import { Footer } from "@/components/site/Footer";
import { listPublicProducts } from "@/lib/products.functions";
import { toSlide } from "@/data/product-types";
import { SlidesProvider } from "@/data/slides-context";

const title = "Croc.Atelier — Collectible Crocs, Numbered Series";
const description =
  "Limited-edition collectible Crocs released in numbered series. Cars, SpongeBob SquarePants and Batman Classic Clogs, from the Croc.Atelier studio.";

export const productsQuery = queryOptions({
  queryKey: ["public-products"],
  queryFn: () => listPublicProducts(),
  staleTime: 5_000,
  refetchOnWindowFocus: true,
  refetchInterval: 20_000,
});

export const Route = createFileRoute("/")({
  loader: ({ context }) => context.queryClient.ensureQueryData(productsQuery),
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  errorComponent: () => (
    <main className="grid min-h-screen place-items-center px-6 text-center text-muted-ink">
      <p>The atelier is briefly unavailable. Please refresh in a moment.</p>
    </main>
  ),
  component: Index,
});

function Index() {
  const { data } = useSuspenseQuery(productsQuery);
  const slides = data.map(toSlide);

  if (slides.length === 0) {
    return (
      <main className="grid min-h-screen place-items-center px-6 text-center text-muted-ink">
        <p className="text-[0.7rem] uppercase tracking-[0.4em]">Collection coming soon</p>
      </main>
    );
  }

  return (
    <SlidesProvider slides={slides}>
      <SmoothScroll />
      <Header />
      <main>
        <Hero />
        <ProductSection />
        <Collection />
        <Gallery />
        <Newsletter />
      </main>
      <Footer />
    </SlidesProvider>
  );
}
