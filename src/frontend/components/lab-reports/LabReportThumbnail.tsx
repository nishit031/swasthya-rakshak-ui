"use client";

import { fileUrl } from "@/backend/lib/api-url";
import { useEffect, useRef, useState } from "react";
import { FlaskConical, FileText } from "lucide-react";
import { useTranslation } from "@/frontend/components/providers/LanguageContext";
import { detectFileKind } from "@/frontend/lib/file-kind";

function PdfPagePreview({ src }: { src: string }) {
  const [ready, setReady] = useState(false);

  return (
    <div className="relative h-full w-full overflow-hidden bg-white dark:bg-gray-100">
      {!ready && (
        <div className="absolute inset-0 animate-pulse bg-gray-200 dark:bg-gray-700" aria-hidden />
      )}
      <iframe
        src={`${src}#page=1&view=FitH&toolbar=0&navpanes=0&scrollbar=0`}
        className={`pointer-events-none absolute inset-0 w-full h-full border-0 transition-opacity duration-200 ${ready ? "opacity-100" : "opacity-0"}`}
        title=""
        tabIndex={-1}
        onLoad={() => setReady(true)}
      />
    </div>
  );
}

function LazyPdfPreview({ src }: { src: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "120px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className="h-full w-full">
      {visible ? (
        <PdfPagePreview src={src} />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-gray-100 dark:bg-gray-800">
          <FileText size={18} className="text-gray-400 dark:text-gray-500" aria-hidden />
        </div>
      )}
    </div>
  );
}

export function LabReportThumbnail({
  filePath,
  originalFilename,
  testName,
  onClick,
  className = "h-14 w-11"
}: {
  filePath: string;
  originalFilename?: string | null;
  testName?: string | null;
  onClick?: () => void;
  className?: string;
}) {
  const { t, formatMessage } = useTranslation();
  const resolvedUrl = fileUrl(filePath);
  const kind = detectFileKind(originalFilename, filePath);
  const [imgError, setImgError] = useState(false);

  const alt =
    testName != null && testName !== ""
      ? formatMessage("labReportsAi.thumbnailAltNamed", { name: testName })
      : t("labReportsAi.thumbnailAlt");

  const showImage = kind === "image" && !imgError;
  const showPdf = kind === "pdf";

  const inner = showImage ? (
    <img
      src={resolvedUrl}
      alt={alt}
      className="h-full w-full object-cover object-top"
      onError={() => setImgError(true)}
    />
  ) : showPdf ? (
    <LazyPdfPreview src={resolvedUrl} />
  ) : (
    <FlaskConical size={20} aria-hidden />
  );

  const shell = (
    <span
      className={`flex shrink-0 overflow-hidden items-center justify-center rounded-xl border border-gray-200 bg-secondary-100 text-secondary-600 dark:border-gray-700 dark:bg-secondary-900/40 dark:text-secondary-300 ${className} ${
        onClick
          ? "cursor-pointer transition-shadow hover:ring-2 hover:ring-primary-300 dark:hover:ring-primary-700"
          : ""
      }`}
    >
      {inner}
    </span>
  );

  if (!onClick) return shell;

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={t("labReportsAi.thumbnailViewLabel")}
      className="shrink-0 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
    >
      {shell}
    </button>
  );
}
