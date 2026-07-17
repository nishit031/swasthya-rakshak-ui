"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, FileText, Heart, ShieldCheck } from "lucide-react";
import { useTranslation } from "@/frontend/components/providers/LanguageContext";
import { Button } from "@/frontend/components/ui/Button";
import { HeartbeatHeart } from "@/frontend/components/ui/HeartbeatHeart";

const AVATARS = [
  "https://images.pexels.com/photos/5452201/pexels-photo-5452201.jpeg?auto=compress&cs=tinysrgb&w=100",
  "https://images.pexels.com/photos/5214959/pexels-photo-5214959.jpeg?auto=compress&cs=tinysrgb&w=100",
  "https://images.pexels.com/photos/5327656/pexels-photo-5327656.jpeg?auto=compress&cs=tinysrgb&w=100"
];

const container = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { delayChildren: 0.2, staggerChildren: 0.15 } }
};
const item = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { duration: 0.5 } }
};

export function HeroSection() {
  const { t } = useTranslation();

  return (
    <section
      id="top"
      className="relative overflow-hidden bg-gradient-to-b from-primary-50/60 to-white pt-28 dark:from-gray-900 dark:to-gray-950"
    >
      {/* Soft background blobs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -right-40 -top-40 h-80 w-80 rounded-full bg-primary-300/20 blur-3xl dark:bg-primary-600/10" />
        <div className="absolute -left-20 top-1/3 h-60 w-60 rounded-full bg-secondary-300/20 blur-3xl dark:bg-secondary-600/10" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 pb-24 pt-12 sm:px-6 lg:px-8 lg:pt-20">
        <motion.div
          className="flex flex-col items-center gap-12 lg:flex-row lg:justify-between"
          variants={container}
          initial="hidden"
          animate="visible"
        >
          {/* Text */}
          <motion.div className="max-w-2xl flex-1" variants={item}>
            <motion.span
              className="mb-6 inline-flex items-center rounded-full bg-primary-100 px-3 py-1 text-sm font-medium text-primary-700 dark:bg-primary-900/30 dark:text-primary-300"
              variants={item}
            >
              <Heart size={16} className="mr-2" />
              {t("hero.tagline")}
            </motion.span>

            <motion.h1
              className="text-4xl font-bold leading-tight text-gray-900 dark:text-white md:text-5xl lg:text-6xl"
              variants={item}
            >
              {t("hero.titleLead")}{" "}
              <span className="bg-gradient-to-r from-primary-600 to-secondary-500 bg-clip-text text-transparent">
                {t("hero.titleHighlight")}
              </span>
            </motion.h1>

            <motion.p
              className="mt-6 text-lg leading-relaxed text-gray-600 dark:text-gray-300"
              variants={item}
            >
              {t("hero.description")}
            </motion.p>

            <motion.div className="mt-8 flex flex-wrap gap-4" variants={item}>
              <Link href="/register">
                <Button variant="primary" size="lg">
                  {t("hero.ctaPrimary")}
                  <ArrowRight size={18} />
                </Button>
              </Link>
              <Link href="/login">
                <Button variant="outline" size="lg">
                  {t("hero.ctaSecondary")}
                </Button>
              </Link>
            </motion.div>

            <motion.div className="mt-8 flex items-center gap-4" variants={item}>
              <div className="flex -space-x-2">
                {AVATARS.map((src) => (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    key={src}
                    src={src}
                    alt="A Swasthya Rakshak user"
                    className="h-10 w-10 rounded-full border-2 border-white object-cover dark:border-gray-900"
                  />
                ))}
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                <span className="font-semibold text-gray-900 dark:text-white">5,000+</span>{" "}
                {t("hero.trustedBy")}
              </p>
            </motion.div>
          </motion.div>

          {/* Visual */}
          <motion.div className="flex flex-1 items-center justify-center" variants={item}>
            <div className="relative w-full max-w-md">
              <HeartbeatHeart />

              <motion.div
                className="glass-card animate-float absolute -left-2 top-2 max-w-[180px] p-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1, duration: 0.5 }}
              >
                <ShieldCheck size={22} className="mb-2 text-primary-600 dark:text-primary-400" />
                <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                  {t("hero.floating.private.title")}
                </h3>
                <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                  {t("hero.floating.private.description")}
                </p>
              </motion.div>

              <motion.div
                className="glass-card animate-float absolute -right-2 bottom-6 max-w-[180px] p-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.2, duration: 0.5 }}
              >
                <FileText size={22} className="mb-2 text-secondary-600 dark:text-secondary-400" />
                <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                  {t("hero.floating.records.title")}
                </h3>
                <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                  {t("hero.floating.records.description")}
                </p>
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
