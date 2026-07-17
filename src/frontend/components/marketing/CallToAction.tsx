"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { useTranslation } from "@/frontend/components/providers/LanguageContext";
import { LinkButton } from "@/frontend/components/ui/LinkButton";

export function CallToAction() {
  const { t } = useTranslation();

  return (
    <section className="py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-primary-600 to-secondary-500 px-6 py-16 text-center shadow-xl sm:px-12"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <div className="pointer-events-none absolute -right-10 -top-10 h-48 w-48 rounded-full bg-white/10" />
          <div className="pointer-events-none absolute -bottom-12 -left-8 h-56 w-56 rounded-full bg-white/10" />

          <h2 className="relative mx-auto max-w-2xl text-3xl font-bold text-white sm:text-4xl">
            {t("cta.heading")}
          </h2>
          <p className="relative mx-auto mt-4 max-w-xl text-primary-50">{t("cta.description")}</p>
          <div className="relative mt-8 flex flex-wrap justify-center gap-4">
            <LinkButton
              href="/register"
              size="lg"
              className="bg-white text-primary-700 shadow-md hover:bg-primary-50 hover:shadow-lg focus:ring-white"
            >
              {t("cta.primary")}
              <ArrowRight size={18} />
            </LinkButton>
            <LinkButton
              href="/login"
              size="lg"
              variant="ghost"
              className="border border-white/60 text-white hover:bg-white/10"
            >
              {t("cta.secondary")}
            </LinkButton>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
