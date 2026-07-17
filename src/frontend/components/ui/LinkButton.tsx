import Link from "next/link";
import type { Route } from "next";
import { cn } from "./cn";

type Variant = "primary" | "secondary" | "accent" | "outline" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

const VARIANT: Record<Variant, string> = {
  primary: "btn-primary",
  secondary: "btn-secondary",
  accent: "btn-accent",
  outline: "btn-outline",
  ghost:
    "inline-flex items-center justify-center rounded-md px-4 py-2 font-medium text-gray-700 transition-colors hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800",
  danger:
    "inline-flex items-center justify-center rounded-md bg-error-600 px-4 py-2 font-medium text-white shadow-md transition-colors hover:bg-error-700 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-error-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
};

const SIZE: Record<Size, string> = {
  sm: "text-sm px-3 py-1.5 gap-1.5",
  md: "text-sm px-4 py-2 gap-2",
  lg: "text-base px-6 py-3 gap-2"
};

interface LinkButtonProps extends Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "href"> {
  href: Route;
  variant?: Variant;
  size?: Size;
}

/** Next.js <Link> styled as a button — avoids the invalid <button> inside <a> nesting. */
export const LinkButton = ({
  href,
  variant = "primary",
  size = "md",
  className,
  children,
  ...rest
}: LinkButtonProps) => (
  <Link href={href} className={cn(VARIANT[variant], SIZE[size], className)} {...rest}>
    {children}
  </Link>
);
