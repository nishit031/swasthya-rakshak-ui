"use client";

import Link from "next/link";
import type { Route } from "next";
import { motion } from "framer-motion";
import { ArrowRight, type LucideIcon } from "lucide-react";
import { CountUp } from "./CountUp";
import { cn } from "./cn";

type Tone = "primary" | "secondary" | "accent" | "success" | "warning" | "error";

const TONE: Record<Tone, { text: string; iconBg: string }> = {
  primary: {
    text: "text-primary-600 dark:text-primary-400",
    iconBg: "bg-primary-100 dark:bg-primary-900/40 text-primary-600 dark:text-primary-300"
  },
  secondary: {
    text: "text-secondary-600 dark:text-secondary-400",
    iconBg: "bg-secondary-100 dark:bg-secondary-900/40 text-secondary-600 dark:text-secondary-300"
  },
  accent: {
    text: "text-accent-600 dark:text-accent-400",
    iconBg: "bg-accent-100 dark:bg-accent-900/40 text-accent-600 dark:text-accent-300"
  },
  success: {
    text: "text-success-600 dark:text-success-400",
    iconBg: "bg-success-100 dark:bg-success-900/40 text-success-600 dark:text-success-300"
  },
  warning: {
    text: "text-warning-700 dark:text-warning-400",
    iconBg: "bg-warning-100 dark:bg-warning-900/40 text-warning-700 dark:text-warning-300"
  },
  error: {
    text: "text-error-600 dark:text-error-400",
    iconBg: "bg-error-100 dark:bg-error-900/40 text-error-600 dark:text-error-300"
  }
};

interface StatCardProps {
  icon: LucideIcon;
  tone?: Tone;
  value: number;
  /** Append after the number, e.g. "+", "%". */
  suffix?: string;
  /** Animate the count up when scrolled into view (for marketing stats). */
  animate?: boolean;
  label: string;
  description?: string;
  /** When set, the whole card becomes a link with an arrow affordance. */
  href?: Route;
}

/** Stat tile: a big number with an icon. Optionally animated and/or a link. */
export function StatCard({
  icon: Icon,
  tone = "primary",
  value,
  suffix,
  animate = false,
  label,
  description,
  href
}: StatCardProps) {
  const t = TONE[tone];
  const inner = (
    <>
      <div className="mb-3 flex items-center justify-between">
        <span className={cn("flex h-11 w-11 items-center justify-center rounded-xl", t.iconBg)}>
          <Icon size={22} />
        </span>
        {href && <ArrowRight size={16} className="text-gray-400" />}
      </div>
      <div className={cn("text-3xl font-bold leading-none", t.text)}>
        {animate ? <CountUp end={value} /> : value}
        {suffix}
      </div>
      <p className="mt-1.5 text-sm font-semibold text-gray-700 dark:text-gray-200">{label}</p>
      {description && <p className={cn("text-xs", t.text)}>{description}</p>}
    </>
  );

  const base = "glass-card card-hover block p-5";
  return href ? (
    <Link href={href} className={base}>
      {inner}
    </Link>
  ) : (
    <motion.div
      className={base}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
    >
      {inner}
    </motion.div>
  );
}
