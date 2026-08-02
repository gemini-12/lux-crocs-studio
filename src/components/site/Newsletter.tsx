import { useState } from "react";
import { motion } from "framer-motion";
import { FiArrowRight } from "react-icons/fi";
import { FaInstagram, FaXTwitter, FaYoutube } from "react-icons/fa6";

export function Newsletter() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  return (
    <section id="newsletter" className="border-t border-hairline py-28 md:py-40">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
        className="mx-auto max-w-3xl px-6 text-center"
      >
        <p className="text-[0.65rem] uppercase tracking-[0.5em] text-muted-ink">Early access</p>
        <h2 className="mt-6 font-display text-[clamp(2rem,5vw,3.6rem)] font-semibold leading-[0.95] tracking-[-0.03em] text-ink">
          Be first in the queue.
        </h2>
        <p className="mx-auto mt-5 max-w-md leading-relaxed text-muted-ink">
          One email per drop. No noise, no resale bots, no exceptions.
        </p>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            setSent(true);
          }}
          className="mx-auto mt-10 flex max-w-lg flex-col gap-3 sm:flex-row"
        >
          <label htmlFor="email" className="sr-only">
            Email address
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@studio.com"
            className="h-14 flex-1 rounded-full border border-hairline bg-transparent px-6 text-sm text-ink outline-none transition-colors placeholder:text-muted-ink focus-visible:border-ink/50"
          />
          <button type="submit" className="cta-btn justify-center bg-ink text-shell">
            <span>{sent ? "You're in" : "Subscribe"}</span>
            <FiArrowRight aria-hidden className="cta-arrow" />
          </button>
        </form>

        <div className="mt-12 flex justify-center gap-3">
          {[
            { Icon: FaInstagram, label: "Instagram" },
            { Icon: FaXTwitter, label: "X" },
            { Icon: FaYoutube, label: "YouTube" },
          ].map(({ Icon, label }) => (
            <a key={label} href="#top" aria-label={label} className="icon-btn">
              <Icon aria-hidden />
            </a>
          ))}
        </div>
      </motion.div>
    </section>
  );
}
