"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Heart, Menu, X } from "lucide-react";
import { useTranslation } from "@/frontend/components/providers/LanguageContext";
import { ThemeToggle } from "@/frontend/components/ui/ThemeToggle";
import { LanguageToggle } from "@/frontend/components/ui/LanguageToggle";
import { Button } from "@/frontend/components/ui/Button";

/** Public marketing navbar with scroll shrink and a mobile menu. */
export function Navbar() {
  const { t } = useTranslation();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const links = [
    { label: t("nav.home"), href: "#top" },
    { label: t("nav.features"), href: "#features" },
    { label: t("nav.about"), href: "#testimonials" }
  ];

  return (
    <header
      className="fixed inset-x-0 top-0 z-50 backdrop-blur-md transition-all duration-300 bg-white/70 dark:bg-gray-950/60"
      style={{
        paddingTop: scrolled ? "0.5rem" : "1rem",
        paddingBottom: scrolled ? "0.5rem" : "1rem"
      }}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Heart
              size={26}
              className="text-primary-600 dark:text-primary-400"
              fill="rgba(14,165,233,0.15)"
            />
            <span className="text-lg font-bold text-gray-900 dark:text-white">स्वास्थ्य रक्षक</span>
          </Link>

          <nav className="hidden items-center gap-8 md:flex">
            {links.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="group relative text-sm font-medium text-gray-700 transition-colors hover:text-primary-600 dark:text-gray-300 dark:hover:text-white"
              >
                {l.label}
                <span className="absolute -bottom-1 left-0 h-0.5 w-full origin-left scale-x-0 bg-primary-500 transition-transform duration-300 group-hover:scale-x-100" />
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <LanguageToggle />
            <ThemeToggle />
            <Link href="/login" className="hidden sm:inline-flex">
              <Button variant="ghost" size="sm">
                {t("nav.login")}
              </Button>
            </Link>
            <Link href="/register" className="hidden sm:inline-flex">
              <Button variant="primary" size="sm">
                {t("nav.register")}
              </Button>
            </Link>
            <button
              onClick={() => setMenuOpen((v) => !v)}
              aria-label="Toggle menu"
              className="flex h-9 w-9 items-center justify-center rounded-full text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800 md:hidden"
            >
              {menuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        <AnimatePresence>
          {menuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden md:hidden"
            >
              <div className="flex flex-col gap-2 py-4">
                {links.map((l) => (
                  <a
                    key={l.href}
                    href={l.href}
                    onClick={() => setMenuOpen(false)}
                    className="rounded-md px-4 py-2 text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                  >
                    {l.label}
                  </a>
                ))}
                <div className="flex gap-2 px-4 pt-2">
                  <Link href="/login" className="flex-1">
                    <Button variant="outline" size="sm" className="w-full">
                      {t("nav.login")}
                    </Button>
                  </Link>
                  <Link href="/register" className="flex-1">
                    <Button variant="primary" size="sm" className="w-full">
                      {t("nav.register")}
                    </Button>
                  </Link>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
}
