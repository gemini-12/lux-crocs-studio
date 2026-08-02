import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiSearch, FiShoppingBag, FiUser, FiMenu, FiX } from "react-icons/fi";

const NAV = ["Collection", "Product", "Gallery", "Archive"];

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <motion.header
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
      className={`fixed inset-x-0 top-0 z-50 h-20 transition-[background-color,backdrop-filter,border-color] duration-500 ${
        scrolled
          ? "border-b border-hairline bg-shell/60 backdrop-blur-xl"
          : "border-b border-transparent bg-transparent"
      }`}
    >
      <div className="mx-auto flex h-20 max-w-[1600px] items-center justify-between px-6 md:px-10">
        <a href="#top" className="text-sm font-semibold uppercase tracking-[0.4em] text-ink">
          Croc<span className="text-muted-ink">.</span>Atelier
        </a>

        <nav aria-label="Primary" className="hidden md:block">
          <ul className="flex items-center gap-10">
            {NAV.map((item) => (
              <li key={item}>
                <a
                  href={`#${item.toLowerCase()}`}
                  className="link-underline text-[0.7rem] uppercase tracking-[0.25em] text-muted-ink transition-colors hover:text-ink"
                >
                  {item}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-1">
          <button aria-label="Search" className="icon-btn">
            <FiSearch aria-hidden />
          </button>
          <button aria-label="Cart, 2 items" className="icon-btn relative">
            <FiShoppingBag aria-hidden />
            <span className="absolute right-1.5 top-1.5 size-1.5 rounded-full bg-ink" />
          </button>
          <button aria-label="Account" className="icon-btn">
            <FiUser aria-hidden />
          </button>
          <button
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
            className="icon-btn md:hidden"
          >
            {open ? <FiX aria-hidden /> : <FiMenu aria-hidden />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.nav
            aria-label="Mobile"
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="border-b border-hairline bg-shell/90 backdrop-blur-2xl md:hidden"
          >
            <ul className="flex flex-col px-6 py-4">
              {NAV.map((item) => (
                <li key={item}>
                  <a
                    href={`#${item.toLowerCase()}`}
                    onClick={() => setOpen(false)}
                    className="block py-3 text-xs uppercase tracking-[0.3em] text-muted-ink"
                  >
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </motion.nav>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
