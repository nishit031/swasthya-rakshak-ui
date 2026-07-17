"use client";

import { motion } from "framer-motion";
import { Quote, Star } from "lucide-react";
import { useTranslation } from "@/frontend/components/providers/LanguageContext";
import { SectionHeader } from "@/frontend/components/ui/SectionHeader";

export function TestimonialSection() {
  const { t } = useTranslation();
  const items = ["one", "two", "three"] as const;

  return (
    <section id="testimonials" className="bg-white py-20 dark:bg-gray-950">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeader centered title={t("testimonials.heading")} />
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {items.map((key, i) => (
            <motion.figure
              key={key}
              className="glass-card relative p-6"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
            >
              <Quote
                size={36}
                className="absolute right-5 top-5 text-primary-200 dark:text-primary-900"
              />
              <div className="mb-3 flex gap-0.5 text-warning-500">
                {Array.from({ length: 5 }).map((_, s) => (
                  <Star key={s} size={16} fill="currentColor" />
                ))}
              </div>
              <blockquote className="text-sm leading-relaxed text-gray-700 dark:text-gray-300">
                “{t(`testimonials.items.${key}.quote`)}”
              </blockquote>
              <figcaption className="mt-4">
                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                  {t(`testimonials.items.${key}.name`)}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {t(`testimonials.items.${key}.role`)}
                </p>
              </figcaption>
            </motion.figure>
          ))}
        </div>
      </div>
    </section>
  );
}
