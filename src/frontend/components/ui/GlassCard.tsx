import { cn } from "./cn";

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
}

/** Frosted-glass surface used across the app for cards and panels. */
export function GlassCard({ hover = false, className, children, ...rest }: GlassCardProps) {
  return (
    <div className={cn("glass-card p-6", hover && "card-hover", className)} {...rest}>
      {children}
    </div>
  );
}
