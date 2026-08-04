import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSlides } from "@/data/slides-context";

export function Gallery() {
  const slides = useSlides();
  const [active, setActive] = useState(0);
  const current = slides[active]!;

  return (
    <section id="gallery" className="relative border-t border-hairline py-28 md:py-40">
      <div className="mx-auto max-w-[1600px] px-6 md:px-10">
        <p className="text-[0.65rem] uppercase tracking-[0.5em] text-muted-ink">
          Interactive gallery
        </p>

        <div className="mt-12 grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,42%)] lg:items-center">
          <ul className="divide-y divide-hairline border-y border-hairline">
            {slides.map((s, i) => (
              <li key={s.id}>
                <button
                  onMouseEnter={() => setActive(i)}
                  onFocus={() => setActive(i)}
                  onClick={() => setActive(i)}
                  aria-current={i === active}
                  className="group flex w-full items-baseline justify-between gap-6 py-7 text-left"
                >
                  <span
                    className={`font-display text-[clamp(1.6rem,4vw,3.2rem)] font-semibold leading-none tracking-[-0.03em] transition-all duration-500 ${
                      i === active
                        ? "translate-x-2 text-ink"
                        : "text-muted-ink group-hover:translate-x-2 group-hover:text-ink"
                    }`}
                  >
                    {s.title}
                  </span>
                  <span className="shrink-0 text-[0.6rem] uppercase tracking-[0.3em] text-muted-ink">
                    0{i + 1}
                  </span>
                </button>
              </li>
            ))}
          </ul>

          <div className="relative grid aspect-square place-items-center overflow-hidden rounded-[2rem] border border-hairline bg-white/[0.03]">
            <div
              aria-hidden
              className="absolute size-2/3 rounded-full blur-[100px] transition-all duration-700"
              style={{ background: current.glow }}
            />
            <AnimatePresence mode="wait">
              <motion.img
                key={current.id}
                src={current.image}
                alt={current.alt}
                loading="lazy"
                initial={{ opacity: 0, scale: 0.94, rotate: -6 }}
                animate={{ opacity: 1, scale: 1, rotate: 2 }}
                exit={{ opacity: 0, scale: 0.94, rotate: 6 }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                className="relative w-[80%] drop-shadow-[0_50px_50px_rgba(0,0,0,0.5)]"
              />
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}
