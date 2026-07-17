"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslation } from "@/frontend/components/providers/LanguageContext";
import { Modal } from "@/frontend/components/ui/Modal";
import { ExternalLink, FileText, ZoomIn, ZoomOut, RotateCcw } from "lucide-react";
import { StagedLoader } from "@/frontend/components/lab-reports/StagedLoader";
import { detectFileKind } from "@/frontend/lib/file-kind";

interface DocumentViewerModalProps {
  open: boolean;
  onClose: () => void;
  fileUrl: string;
  originalFilename?: string | null;
  testName?: string | null;
  /** Optional scrollable panel shown beside the document on wide screens. */
  sidePanel?: { title: string; content: React.ReactNode };
}

function ImageZoomViewer({ src, alt }: { src: string; alt: string }) {
  const { t } = useTranslation();
  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [loading, setLoading] = useState(true);
  const dragging = useRef(false);
  const dragOrigin = useRef({ x: 0, y: 0, panX: 0, panY: 0 });

  useEffect(() => {
    setScale(1);
    setPan({ x: 0, y: 0 });
    setLoading(true);
  }, [src]);

  function resetView() {
    setScale(1);
    setPan({ x: 0, y: 0 });
  }

  function onPointerDown(e: React.PointerEvent) {
    if (scale <= 1) return;
    dragging.current = true;
    dragOrigin.current = { x: e.clientX, y: e.clientY, panX: pan.x, panY: pan.y };
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!dragging.current) return;
    setPan({
      x: dragOrigin.current.panX + (e.clientX - dragOrigin.current.x),
      y: dragOrigin.current.panY + (e.clientY - dragOrigin.current.y)
    });
  }

  function onPointerUp() {
    dragging.current = false;
  }

  return (
    <div className="flex h-full min-h-[400px] flex-col">
      <div className="mb-2 flex items-center justify-end gap-1">
        <ZoomControl
          icon={ZoomOut}
          label={t("labReportsAi.viewerZoomOut")}
          onClick={() => setScale((s) => Math.max(s - 0.25, 0.5))}
        />
        <ZoomControl
          icon={ZoomIn}
          label={t("labReportsAi.viewerZoomIn")}
          onClick={() => setScale((s) => Math.min(s + 0.25, 4))}
        />
        <ZoomControl
          icon={RotateCcw}
          label={t("labReportsAi.viewerZoomReset")}
          onClick={resetView}
        />
      </div>
      <div
        className={`relative flex flex-1 items-center justify-center overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-800 ${
          scale > 1 ? "cursor-grab active:cursor-grabbing" : ""
        }`}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
      >
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <StagedLoader stages={[t("common.loading")]} />
          </div>
        )}
        <img
          src={src}
          alt={alt}
          draggable={false}
          className="max-h-[65vh] w-auto max-w-full select-none object-contain transition-transform duration-150"
          style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})` }}
          onLoad={() => setLoading(false)}
        />
      </div>
    </div>
  );
}

function ZoomControl({
  icon: Icon,
  label,
  onClick
}: {
  icon: typeof ZoomIn;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="flex h-9 w-9 items-center justify-center rounded-md text-gray-600 transition-colors hover:bg-gray-200 dark:text-gray-300 dark:hover:bg-gray-700"
    >
      <Icon size={18} />
    </button>
  );
}

export function DocumentViewerModal({
  open,
  onClose,
  fileUrl,
  originalFilename,
  testName,
  sidePanel
}: DocumentViewerModalProps) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);

  const kind = detectFileKind(originalFilename, fileUrl);
  const fallbackTitle = originalFilename || t("medicalRecordsAi.notClassified");
  const title = testName ? `${testName} - ${fallbackTitle}` : fallbackTitle;

  useEffect(() => {
    if (open) setLoading(kind !== "image");
  }, [open, fileUrl, kind]);

  const hasSidePanel = !!sidePanel;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      size={hasSidePanel ? "max-w-7xl" : "max-w-4xl"}
    >
      <div className="flex flex-col gap-4">
        <div className="flex justify-end">
          <a
            href={fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium text-primary-700 transition-colors hover:bg-primary-50 dark:text-primary-300 dark:hover:bg-primary-900/30"
          >
            <ExternalLink size={16} />
            {t("labReportsAi.viewerOpenExternal")}
          </a>
        </div>

        <div className={`grid gap-4 ${hasSidePanel ? "lg:grid-cols-2" : ""}`}>
          {/* Document pane */}
          <div className="relative min-h-[400px] w-full overflow-hidden rounded-xl border border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-900/50">
            {kind === "image" ? (
              <div className="p-3">
                <ImageZoomViewer src={fileUrl} alt={title} />
              </div>
            ) : kind === "pdf" ? (
              <div className="relative h-[70vh] w-full">
                {loading && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <StagedLoader stages={[t("common.loading")]} />
                  </div>
                )}
                <iframe
                  src={`${fileUrl}#view=FitH&toolbar=1&navpanes=0`}
                  className="h-full w-full rounded-lg border-0"
                  title={title}
                  onLoad={() => setLoading(false)}
                />
              </div>
            ) : (
              <div className="flex min-h-[400px] flex-col items-center justify-center gap-3 p-6 text-gray-500 dark:text-gray-400">
                <FileText size={48} className="opacity-50" aria-hidden />
                <p className="text-sm">{t("labReportsAi.viewerUnsupportedType")}</p>
                <a
                  href={fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-primary-700 dark:text-primary-300"
                >
                  <ExternalLink size={16} />
                  {t("labReportsAi.viewerOpenExternal")}
                </a>
              </div>
            )}
          </div>

          {/* AI side panel — visible on wide screens when content is provided */}
          {hasSidePanel && (
            <div className="flex min-h-0 flex-col gap-2 rounded-xl border border-gray-200 bg-gray-50/80 p-4 dark:border-gray-800 dark:bg-gray-900/40">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                {sidePanel.title}
              </h3>
              <div className="max-h-[70vh] overflow-y-auto pr-1">{sidePanel.content}</div>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
