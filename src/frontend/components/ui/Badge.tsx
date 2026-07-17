import { cn } from "./cn";

export type BadgeTone = "blue" | "green" | "amber" | "red" | "gray";

const TONE: Record<BadgeTone, string> = {
  blue: "bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-300",
  green: "bg-success-100 text-success-700 dark:bg-success-900/40 dark:text-success-300",
  amber: "bg-warning-100 text-warning-800 dark:bg-warning-900/40 dark:text-warning-300",
  red: "bg-error-100 text-error-700 dark:bg-error-900/40 dark:text-error-300",
  gray: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
};

interface BadgeProps {
  tone?: BadgeTone;
  children: React.ReactNode;
  className?: string;
}

/** Small pill label. Always pairs colour with text (never colour alone). */
export function Badge({ tone = "gray", children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
        TONE[tone],
        className
      )}
    >
      {children}
    </span>
  );
}
