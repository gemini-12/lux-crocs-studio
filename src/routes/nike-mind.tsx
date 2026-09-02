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
import { BrandProvider } from "@/data/brands";

const title = "Nike Mind 001 — Sculpted Slip-On Mules, Released in Waves";
const description =
  "Nike Mind 001 mules in Team Red, Blackened Blue, Geode Teal, White and Black. A separate universe from the Croc.Atelier studio, released in numbered waves.";

export const Route = createFileRoute("/nike-mind")({
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
  loader: ({ context }) => context.queryClient.ensureQueryData(productsQueryOptions("nike-mind")),
  component: NikeMindPage,
});

function NikeMindPage() {
  return (
    <BrandProvider brand="nike-mind">
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
    </BrandProvider>
  );
}
