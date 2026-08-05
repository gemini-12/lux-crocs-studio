import { createFileRoute } from "@tanstack/react-router";
import { SmoothScroll } from "@/components/site/SmoothScroll";
import { Header } from "@/components/site/Header";
import { Hero } from "@/components/site/Hero";
import { ProductSection } from "@/components/site/ProductSection";
import { Collection } from "@/components/site/Collection";
import { Gallery } from "@/components/site/Gallery";
import { Newsletter } from "@/components/site/Newsletter";
import { Footer } from "@/components/site/Footer";
import { HiddenAdminAccess } from "@/components/site/HiddenAdminAccess";
import { productsQueryOptions } from "@/data/products";

const title = "Croc.Atelier — Collectible Crocs, Numbered Series";
const description =
  "Limited-edition collectible Crocs released in numbered series. Cars, SpongeBob SquarePants and Batman Classic Clogs, from the Croc.Atelier studio.";

export const Route = createFileRoute("/")({
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
  loader: ({ context }) => context.queryClient.ensureQueryData(productsQueryOptions),
  component: Index,
});

function Index() {
  return (
    <>
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
      <HiddenAdminAccess />
    </>
  );
}
