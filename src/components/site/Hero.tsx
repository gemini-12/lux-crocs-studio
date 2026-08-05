import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { FiArrowLeft, FiArrowRight, FiArrowUpRight } from "react-icons/fi";
import { useSlides } from "@/data/products";

const EASE = [0.16, 1, 0.3, 1] as const;
const DURATION = 6000;

function Letters({ text, delay = 0 }: { text: string; delay?: number }) {
  return (
    <span aria-label={text}>
      {text.split(" ").map((word, w) => {
        const offset = text
          .split(" ")
          .slice(0, w)
          .reduce((acc, cur) => acc + cur.length + 1, 0);
        return (
          <span key={`${word}-${w}`} className="inline-block whitespace-nowrap">
            {word.split("").map((char, i) => (
              <motion.span
                key={`${char}-${i}`}
                aria-hidden
                className="inline-block will-change-transform"
                initial={{ y: "0.6em", opacity: 0, rotateX: -60 }}
                animate={{ y: 0, opacity: 1, rotateX: 0 }}
                transition={{ duration: 0.8, ease: EASE, delay: delay + (offset + i) * 0.032 }}
              >
                {char}
              </motion.span>
            ))}
            {w < text.split(" ").length - 1 && <span aria-hidden>&nbsp;</span>}
          </span>
        );
      })}
    </span>
  );
}

export function Hero() {
  const slides = useSlides();
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const reduce = useReducedMotion();
  const rootRef = useRef<HTMLElement | null>(null);
  const pointer = useRef({ x: 0, y: 0 });
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const touchX = useRef<number | null>(null);

  const slide = slides[Math.min(index, slides.length - 1)]!;
  const [locked, setLocked] = useState(false);
  const go = useCallback((n: number) => {
    setLocked(true);
    setIndex((i) => (n + slides.length) % slides.length);
    setProgress(0);
    setTimeout(() => setLocked(false), 1050);
  }, []);


  // autoplay with rAF-driven progress
  useEffect(() => {
    if (paused || reduce) return;
    let start = performance.now();
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min((t - start) / DURATION, 1);
      setProgress(p);
      if (p >= 1) {
        start = t;
        setIndex((i) => (i + 1) % slides.length);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [paused, reduce, index]);

  // pointer parallax, smoothed with rAF
  useEffect(() => {
    if (reduce) return;
    let raf = 0;
    const onMove = (e: PointerEvent) => {
      const r = rootRef.current?.getBoundingClientRect();
      if (!r) return;
      pointer.current = {
        x: (e.clientX - r.left) / r.width - 0.5,
        y: (e.clientY - r.top) / r.height - 0.5,
      };
    };
    const loop = () => {
      setTilt((prev) => ({
        x: prev.x + (pointer.current.x - prev.x) * 0.07,
        y: prev.y + (pointer.current.y - prev.y) * 0.07,
      }));
      raf = requestAnimationFrame(loop);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    raf = requestAnimationFrame(loop);
    return () => {
      window.removeEventListener("pointermove", onMove);
      cancelAnimationFrame(raf);
    };
  }, [reduce]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") go(index + 1);
      if (e.key === "ArrowLeft") go(index - 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [index, go]);

  useEffect(() => {
    slides.forEach((s) => {
      const img = new Image();
      img.src = s.image;
    });
  }, []);

  return (
    <section
      id="top"
      ref={rootRef}
      aria-roledescription="carousel"
      aria-label="Featured collectible Crocs"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={(e) => {
        touchX.current = e.touches[0]!.clientX;
        setPaused(true);
      }}
      onTouchEnd={(e) => {
        const dx = touchX.current === null ? 0 : e.changedTouches[0]!.clientX - touchX.current;
        if (Math.abs(dx) > 50) go(index + (dx < 0 ? 1 : -1));
        touchX.current = null;
        setPaused(false);
      }}
      className="relative isolate h-[100svh] min-h-[640px] w-full overflow-hidden"
      style={{ backgroundColor: slide.bgTo }}
    >
      {/* atmosphere */}
      <AnimatePresence mode="sync">
        <motion.div
          key={slide.id}
          aria-hidden
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.2, ease: "easeInOut" }}
          className="absolute inset-0"
          style={{
            background: `radial-gradient(120% 90% at 70% 20%, ${slide.bgFrom} 0%, ${slide.bgTo} 62%, ${slide.bgTo} 100%)`,
          }}
        >
          <div
            className="absolute -left-[12%] top-[8%] size-[46vw] rounded-full blur-[120px] will-change-transform"
            style={{
              background: slide.glow,
              transform: `translate3d(${tilt.x * -34}px, ${tilt.y * -26}px, 0)`,
            }}
          />
          <div
            className="absolute bottom-[-18%] right-[6%] size-[38vw] rounded-full blur-[140px] will-change-transform"
            style={{
              background: slide.glow,
              opacity: 0.7,
              transform: `translate3d(${tilt.x * 22}px, ${tilt.y * 18}px, 0)`,
            }}
          />
        </motion.div>
      </AnimatePresence>
      <div aria-hidden className="grain absolute inset-0" />

      <div className="relative mx-auto grid h-full max-w-[1600px] grid-cols-1 items-center gap-6 px-6 pt-24 pb-28 md:px-10 lg:grid-cols-[minmax(0,44%)_minmax(0,56%)]">
        {/* copy */}
        <div className="z-10 max-w-2xl">
          <AnimatePresence mode="wait">
            <div key={slide.id}>
              <motion.p
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, ease: EASE }}
                className="text-[0.68rem] uppercase tracking-[0.5em]"
                style={{ color: slide.accent }}
              >
                {slide.eyebrow}
              </motion.p>

              <h1
                className="mt-6 font-display text-[clamp(2.4rem,6vw,5.2rem)] font-semibold leading-[0.92] tracking-[-0.03em]"
                style={{ color: slide.ink }}
              >
                <Letters text={slide.title} delay={0.12} />
              </h1>

              <motion.p
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: EASE, delay: 0.45 }}
                className="mt-6 text-[0.7rem] uppercase tracking-[0.34em] text-muted-ink"
              >
                {slide.release}
              </motion.p>

              <motion.p
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: EASE, delay: 0.56 }}
                className="mt-5 max-w-md text-base leading-relaxed text-muted-ink"
              >
                {slide.description}
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: EASE, delay: 0.72 }}
                className="mt-10 flex flex-wrap items-center gap-6"
              >
                <a href="#product" className="cta-btn" style={{ backgroundColor: slide.accent }}>
                  <span>Reserve · {slide.price}</span>
                  <FiArrowRight aria-hidden className="cta-arrow" />
                </a>
                <a
                  href="#collection"
                  className="link-underline inline-flex items-center gap-2 text-[0.7rem] uppercase tracking-[0.28em] text-muted-ink hover:text-ink"
                >
                  View collection <FiArrowUpRight aria-hidden />
                </a>
              </motion.div>
            </div>
          </AnimatePresence>
        </div>

        {/* product */}
        <div className="relative h-[38vh] lg:h-[62vh]">
          <div
            className="absolute inset-0 will-change-transform"
            style={{
              transform: `translate3d(${tilt.x * 40}px, ${tilt.y * 26}px, 0)`,
            }}
          >
            <AnimatePresence mode="popLayout">
              <motion.div
                key={slide.id}
                initial={{ opacity: 0, x: 140, scale: 0.92, rotate: -8 }}
                animate={{ opacity: 1, x: 0, scale: 1, rotate: 0 }}
                exit={{ opacity: 0, x: -140, scale: 0.9, rotate: 8 }}
                transition={{ duration: 1.05, ease: EASE }}
                className="absolute inset-0 flex items-center justify-center will-change-transform"
              >
                <div
                  aria-hidden
                  className="absolute size-[58%] rounded-full blur-[90px]"
                  style={{ background: slide.glow }}
                />
                <img
                  src={slide.image}
                  alt={slide.alt}
                  decoding="async"
                  className="relative w-[86%] max-w-[680px] drop-shadow-[0_60px_60px_rgba(0,0,0,0.55)] will-change-transform"
                  style={{
                    transform: `perspective(1400px) rotateY(${tilt.x * 5}deg) rotateX(${-tilt.y * 4}deg) rotate(3deg)`,
                  }}
                />
                <div
                  aria-hidden
                  className="absolute bottom-[6%] h-6 w-[52%] rounded-[50%] bg-black/50 blur-2xl"
                />
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* side navigation arrows */}
      {[
        { dir: -1, label: "Previous slide", Icon: FiArrowLeft, side: "left-6 md:left-10 lg:left-14" },
        { dir: 1, label: "Next slide", Icon: FiArrowRight, side: "right-6 md:right-10 lg:right-14" },
      ].map(({ dir, label, Icon, side }) => (
        <motion.button
          key={label}
          type="button"
          onClick={() => go(index + dir)}
          disabled={locked}
          aria-label={label}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, y: reduce ? 0 : [0, -3, 0] }}
          transition={{
            opacity: { duration: 1, ease: EASE, delay: 0.6 },
            y: { duration: 4.5, repeat: Infinity, ease: "easeInOut" },
          }}
          className={`group absolute top-1/2 z-20 grid size-14 -translate-y-1/2 cursor-pointer place-items-center rounded-full border border-hairline backdrop-blur-md transition-all duration-300 ease-out hover:scale-[1.08] disabled:pointer-events-none disabled:opacity-40 md:size-16 ${side}`}
          style={{
            color: slide.ink,
            backgroundColor: "color-mix(in oklab, var(--ink) 8%, transparent)",
            boxShadow: `0 18px 40px -20px rgb(0 0 0 / 0.8)`,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.boxShadow = `0 0 34px -8px ${slide.accent}, 0 18px 40px -20px rgb(0 0 0 / 0.8)`;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow = `0 18px 40px -20px rgb(0 0 0 / 0.8)`;
          }}
        >
          <Icon
            aria-hidden
            className={`size-5 transition-transform duration-300 ${dir < 0 ? "group-hover:-translate-x-1" : "group-hover:translate-x-1"}`}
            strokeWidth={1}
          />
        </motion.button>
      ))}

      {/* progress indicator */}
      <div className="absolute inset-x-0 bottom-10 z-10 flex justify-center gap-3">
        {slides.map((s, i) => (
          <div key={s.id} className="h-px w-10 overflow-hidden bg-hairline">
            <motion.div
              className="h-px origin-left"
              style={{ backgroundColor: slide.accent }}
              animate={{ scaleX: i < index ? 1 : i === index ? Math.max(progress, 0.04) : 0 }}
              transition={{ duration: 0.15, ease: "linear" }}
            >
              <div className="h-px w-10" />
            </motion.div>
          </div>
        ))}
      </div>

    </section>
  );
}

