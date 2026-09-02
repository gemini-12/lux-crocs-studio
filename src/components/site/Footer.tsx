import { useBrand } from "@/data/brands";

const COLUMNS = [
  { title: "Shop", links: ["New arrivals", "Collection", "Archive", "Gift cards"] },
  { title: "Support", links: ["Sizing", "Shipping", "Returns", "Authenticity"] },
  { title: "Studio", links: ["About", "Collaborations", "Press", "Careers"] },
];

export function Footer() {
  const brand = useBrand();
  return (
    <footer id="archive" className="border-t border-hairline bg-black">
      <div className="mx-auto max-w-[1600px] px-6 py-20 md:px-10">
        <div className="grid grid-cols-2 gap-10 md:grid-cols-4">
          <div className="col-span-2 md:col-span-1">
            <p className="text-sm font-semibold uppercase tracking-[0.4em] text-ink">
              {brand.wordmark}
              <span className="text-muted-ink">.</span>
              {brand.wordmarkAccent}
            </p>
            <p className="mt-5 max-w-xs text-sm leading-relaxed text-muted-ink">
              {brand.studioLine}
            </p>
          </div>
          {COLUMNS.map((col) => (
            <nav key={col.title} aria-label={col.title}>
              <p className="text-[0.6rem] uppercase tracking-[0.35em] text-muted-ink">
                {col.title}
              </p>
              <ul className="mt-5 space-y-3">
                {col.links.map((l) => (
                  <li key={l}>
                    <a
                      href="#top"
                      className="link-underline text-sm text-muted-ink transition-colors hover:text-ink"
                    >
                      {l}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="mt-16 flex flex-wrap items-center justify-between gap-4 border-t border-hairline pt-8">
          <p className="text-xs text-muted-ink">© {new Date().getFullYear()} {brand.wordmark}.{brand.wordmarkAccent}</p>
          <p className="text-xs text-muted-ink">Antwerp · Tokyo · Los Angeles</p>
        </div>
      </div>
    </footer>
  );
}
