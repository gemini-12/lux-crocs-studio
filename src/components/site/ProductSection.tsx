import { useState } from "react";
import { motion } from "framer-motion";
import { FiHeart, FiMinus, FiPlus, FiArrowRight } from "react-icons/fi";
import { slides } from "@/data/products";

const SIZES = ["38", "39", "40", "41", "42", "43", "44"];
const SPECS = [
  ["Material", "Croslite™ resin, hand-finished"],
  ["Hardware", "Anodised aluminium rivets"],
  ["Charms", "5 sculpted Jibbitz included"],
  ["Certificate", "Numbered, blockchain-backed"],
];

export function ProductSection() {
  const [colorIndex, setColorIndex] = useState(0);
  const [size, setSize] = useState("42");
  const [qty, setQty] = useState(1);
  const [wished, setWished] = useState(false);
  const product = slides[colorIndex]!;

  return (
    <section id="product" className="relative border-t border-hairline py-28 md:py-40">
      <div className="mx-auto grid max-w-[1600px] grid-cols-1 gap-16 px-6 md:px-10 lg:grid-cols-2 lg:gap-24">
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          className="relative grid aspect-square place-items-center overflow-hidden rounded-[2rem] border border-hairline bg-white/[0.03]"
        >
          <div
            aria-hidden
            className="absolute size-2/3 rounded-full blur-[100px] transition-all duration-700"
            style={{ background: product.glow }}
          />
          <motion.img
            key={product.id}
            initial={{ opacity: 0, y: 24, rotate: -4 }}
            animate={{ opacity: 1, y: 0, rotate: 2 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            src={product.image}
            alt={product.alt}
            loading="lazy"
            className="relative w-[78%] drop-shadow-[0_50px_50px_rgba(0,0,0,0.5)]"
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.25 }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col justify-center"
        >
          <p className="text-[0.68rem] uppercase tracking-[0.5em]" style={{ color: product.accent }}>
            {product.release}
          </p>
          <h2 className="mt-5 font-display text-[clamp(2rem,4.5vw,3.6rem)] font-semibold leading-[0.95] tracking-[-0.03em] text-ink">
            {product.title}
          </h2>
          <p className="mt-5 max-w-md leading-relaxed text-muted-ink">{product.description}</p>
          <p className="mt-6 font-display text-2xl text-ink">{product.price}</p>

          <div className="mt-10">
            <p className="text-[0.65rem] uppercase tracking-[0.35em] text-muted-ink">Colourway</p>
            <div className="mt-4 flex gap-3">
              {slides.map((s, i) => (
                <button
                  key={s.id}
                  onClick={() => setColorIndex(i)}
                  aria-label={s.title}
                  aria-pressed={i === colorIndex}
                  className={`size-8 rounded-full transition-transform duration-300 hover:scale-110 ${
                    i === colorIndex ? "ring-1 ring-offset-4 ring-offset-shell" : ""
                  }`}
                  style={{ backgroundColor: s.accent, boxShadow: `0 0 22px ${s.glow}` }}
                />
              ))}
            </div>
          </div>

          <div className="mt-8">
            <p className="text-[0.65rem] uppercase tracking-[0.35em] text-muted-ink">Size (EU)</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {SIZES.map((s) => (
                <button
                  key={s}
                  onClick={() => setSize(s)}
                  aria-pressed={s === size}
                  className={`h-11 w-14 rounded-full border text-sm transition-colors duration-300 ${
                    s === size
                      ? "border-transparent bg-ink text-shell"
                      : "border-hairline text-muted-ink hover:border-ink/40 hover:text-ink"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-10 flex flex-wrap items-center gap-4">
            <div className="flex h-14 items-center gap-5 rounded-full border border-hairline px-5">
              <button
                aria-label="Decrease quantity"
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                className="text-muted-ink transition-colors hover:text-ink"
              >
                <FiMinus aria-hidden />
              </button>
              <span aria-live="polite" className="w-4 text-center text-sm text-ink">
                {qty}
              </span>
              <button
                aria-label="Increase quantity"
                onClick={() => setQty((q) => Math.min(9, q + 1))}
                className="text-muted-ink transition-colors hover:text-ink"
              >
                <FiPlus aria-hidden />
              </button>
            </div>

            <button className="cta-btn" style={{ backgroundColor: product.accent }}>
              <span>Add to cart</span>
              <FiArrowRight aria-hidden className="cta-arrow" />
            </button>

            <button
              onClick={() => setWished((w) => !w)}
              aria-pressed={wished}
              aria-label="Add to wishlist"
              className="grid size-14 place-items-center rounded-full border border-hairline text-muted-ink transition-all duration-300 hover:border-ink/40 hover:text-ink"
            >
              <FiHeart aria-hidden className={wished ? "fill-current text-ink" : ""} />
            </button>
          </div>

          <dl className="mt-12 divide-y divide-hairline border-t border-hairline">
            {SPECS.map(([k, v]) => (
              <div key={k} className="flex justify-between gap-6 py-4 text-sm">
                <dt className="uppercase tracking-[0.2em] text-muted-ink">{k}</dt>
                <dd className="text-right text-ink">{v}</dd>
              </div>
            ))}
          </dl>
        </motion.div>
      </div>
    </section>
  );
}
