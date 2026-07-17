"use client";

import { motion } from "framer-motion";
import { type LucideIcon } from "lucide-react";
import { cn } from "./cn";

type Tone = "primary" | "secondary" | "accent" | "success" | "warning" | "error";

const ICON_TONE: Record<Tone, string> = {
  primary: "bg-primary-100 text-primary-600 dark:bg-primary-900/40 dark:text-primary-300",
  secondary: "bg-secondary-100 text-secondary-600 dark:bg-secondary-900/40 dark:text-secondary-300",
  accent: "bg-accent-100 text-accent-600 dark:bg-accent-900/40 dark:text-accent-300",
  success: "bg-success-100 text-success-600 dark:bg-success-900/40 dark:text-success-300",
  warning: "bg-warning-100 text-warning-700 dark:bg-warning-900/40 dark:text-warning-300",
  error: "bg-error-100 text-error-600 dark:bg-error-900/40 dark:text-error-300"
};

interface FeatureCardProps {
  icon: LucideIcon;
  tone?: Tone;
  title: string;
  description: string;
  /** Delay (s) for the scroll-in animation, for staggering a grid. */
  delay?: number;
}

/** Icon + title + description card used on the landing feature grid. */
export function FeatureCard({
  icon: Icon,
  tone = "primary",
  title,
  description,
  delay = 0
}: FeatureCardProps) {
  return (
    <motion.div
      className="glass-card card-hover p-6"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay }}
    >
      <span
        className={cn(
          "mb-4 flex h-12 w-12 items-center justify-center rounded-xl",
          ICON_TONE[tone]
        )}
      >
        <Icon size={24} />
      </span>
      <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
      <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-300">{description}</p>
    </motion.div>
  );
}
