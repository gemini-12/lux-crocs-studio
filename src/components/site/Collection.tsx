import { motion } from "framer-motion";
import { FiArrowUpRight } from "react-icons/fi";
import { slides } from "@/data/products";

export function Collection() {
  return (
    <section id="collection" className="relative border-t border-hairline py-28 md:py-40">
      <div className="mx-auto max-w-[1600px] px-6 md:px-10">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="text-[0.65rem] uppercase tracking-[0.5em] text-muted-ink">
              Featured collection
            </p>
            <h2 className="mt-5 max-w-2xl font-display text-[clamp(2rem,5vw,4rem)] font-semibold leading-[0.95] tracking-[-0.03em] text-ink">
              Five objects. Numbered, archived, never repeated.
            </h2>
          </div>
          <a
            href="#gallery"
            className="link-underline inline-flex items-center gap-2 text-[0.7rem] uppercase tracking-[0.28em] text-muted-ink hover:text-ink"
          >
            Full archive <FiArrowUpRight aria-hidden />
          </a>
        </div>

        <div className="mt-16 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {slides.map((s, i) => (
            <motion.article
              key={s.id}
              initial={{ opacity: 0, y: 48 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1], delay: (i % 3) * 0.08 }}
              className="group relative overflow-hidden rounded-[1.75rem] border border-hairline bg-white/[0.03] p-8 backdrop-blur-xl transition-all duration-500 hover:-translate-y-2 hover:border-white/20 hover:shadow-[0_40px_80px_-40px_rgba(0,0,0,0.9)]"
            >
              <div
                aria-hidden
                className="absolute -top-1/4 left-1/2 size-64 -translate-x-1/2 rounded-full opacity-0 blur-[90px] transition-opacity duration-700 group-hover:opacity-100"
                style={{ background: s.glow }}
              />
              <div className="relative grid h-56 place-items-center overflow-hidden">
                <img
                  src={s.image}
                  alt={s.alt}
                  loading="lazy"
                  decoding="async"
                  className="w-[80%] transition-transform duration-700 ease-out group-hover:scale-110 group-hover:-rotate-3"
                />
              </div>
              <div className="relative mt-8 flex items-end justify-between gap-4">
                <div>
                  <p
                    className="text-[0.6rem] uppercase tracking-[0.4em]"
                    style={{ color: s.accent }}
                  >
                    {s.eyebrow}
                  </p>
                  <h3 className="mt-3 font-display text-xl text-ink">{s.title}</h3>
                  <p className="mt-1 text-xs uppercase tracking-[0.2em] text-muted-ink">
                    {s.release}
                  </p>
                </div>
                <span className="font-display text-lg text-ink">{s.price}</span>
              </div>
            </motion.article>
          ))}

          <motion.div
            initial={{ opacity: 0, y: 48 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1], delay: 0.16 }}
            className="flex flex-col justify-between rounded-[1.75rem] border border-dashed border-hairline p-8"
          >
            <p className="font-display text-2xl leading-tight text-ink">
              Next drop opens in <span className="text-muted-ink">14 days</span>
            </p>
            <a
              href="#newsletter"
              className="link-underline mt-8 inline-flex items-center gap-2 self-start text-[0.7rem] uppercase tracking-[0.28em] text-muted-ink hover:text-ink"
            >
              Join the list <FiArrowUpRight aria-hidden />
            </a>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
