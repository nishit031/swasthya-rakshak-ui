interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  centered?: boolean;
  className?: string;
}

/** Heading + optional subtitle, used above page and landing sections. */
export function SectionHeader({
  title,
  subtitle,
  centered = false,
  className
}: SectionHeaderProps) {
  return (
    <div className={`${centered ? "text-center" : ""} ${className ?? ""}`}>
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white sm:text-3xl">{title}</h2>
      {subtitle && (
        <p
          className={`mt-2 text-gray-600 dark:text-gray-300 ${centered ? "mx-auto max-w-2xl" : ""}`}
        >
          {subtitle}
        </p>
      )}
    </div>
  );
}
