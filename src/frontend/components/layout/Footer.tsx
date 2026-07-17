"use client";

import Link from "next/link";
import { Heart, Mail, MapPin, Phone } from "lucide-react";
import { useTranslation } from "@/frontend/components/providers/LanguageContext";

/** Public marketing footer. */
export function Footer() {
  const { t } = useTranslation();
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-950">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-4">
          <div className="md:col-span-2">
            <Link href="/" className="flex items-center gap-2">
              <Heart
                size={24}
                className="text-primary-600 dark:text-primary-400"
                fill="rgba(14,165,233,0.15)"
              />
              <span className="text-lg font-bold text-gray-900 dark:text-white">
                स्वास्थ्य रक्षक
              </span>
            </Link>
            <p className="mt-3 max-w-sm text-sm text-gray-600 dark:text-gray-400">
              {t("footer.tagline")}
            </p>
            <p className="mt-4 max-w-sm text-xs text-gray-500 dark:text-gray-500">
              {t("footer.disclaimer")}
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
              {t("footer.product")}
            </h3>
            <ul className="mt-3 space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <li>
                <a href="#features" className="hover:text-primary-600 dark:hover:text-primary-400">
                  {t("nav.features")}
                </a>
              </li>
              <li>
                <Link
                  href="/register"
                  className="hover:text-primary-600 dark:hover:text-primary-400"
                >
                  {t("nav.register")}
                </Link>
              </li>
              <li>
                <Link href="/login" className="hover:text-primary-600 dark:hover:text-primary-400">
                  {t("nav.login")}
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
              {t("footer.contact")}
            </h3>
            <ul className="mt-3 space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <li className="flex items-center gap-2">
                <MapPin size={15} /> India
              </li>
              <li className="flex items-center gap-2">
                <Phone size={15} /> +91 00000 00000
              </li>
              <li className="flex items-center gap-2">
                <Mail size={15} /> care@swasthyarakshak.app
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-gray-200 pt-6 text-center text-xs text-gray-500 dark:border-gray-800 dark:text-gray-500">
          © {year} स्वास्थ्य रक्षक. {t("footer.rights")}
        </div>
      </div>
    </footer>
  );
}
