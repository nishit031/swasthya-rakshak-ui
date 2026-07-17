"use client";

import { useState } from "react";
import { useTranslation } from "@/frontend/components/providers/LanguageContext";
import type { TrendSeries } from "@/backend/features/lab-reports/trends";
import type { Status } from "@/backend/features/lab-reports/lab-values";

const W = 560;
const H = 200;
const PAD = { top: 16, right: 84, bottom: 28, left: 40 };

const STATUS_DOT: Record<Status, string> = {
  normal: "fill-success-500",
  high: "fill-warning-500",
  low: "fill-warning-500",
  unknown: "fill-gray-400"
};

function formatShortDate(d: Date) {
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "2-digit" });
}

function formatValue(v: number) {
  return Number.isInteger(v) ? String(v) : v.toFixed(1);
}

/** A single-series line chart plotting one test's values over time, with a hover tooltip and
 *  status-colored points (green = normal, amber = out of range). Reads left→right regardless of
 *  locale, matching every other numeric chart in the app. */
export function LabTrendChart({ series }: { series: TrendSeries }) {
  const { t } = useTranslation();
  const [hovered, setHovered] = useState<number | null>(null);
  const { points } = series;

  const dates = points.map((p) => p.date.getTime());
  const minDate = Math.min(...dates);
  const maxDate = Math.max(...dates);
  const dateSpan = maxDate - minDate || 1;

  const latest = points[points.length - 1];
  const hasBand = latest.low != null && latest.high != null;

  const values = points.map((p) => p.value);
  if (hasBand) values.push(latest.low!, latest.high!);
  const rawMin = Math.min(...values);
  const rawMax = Math.max(...values);
  const valuePad = (rawMax - rawMin || rawMax || 1) * 0.15;
  const minValue = rawMin - valuePad;
  const maxValue = rawMax + valuePad;
  const valueSpan = maxValue - minValue || 1;

  const plotW = W - PAD.left - PAD.right;
  const plotH = H - PAD.top - PAD.bottom;

  function x(t: number) {
    return PAD.left + ((t - minDate) / dateSpan) * plotW;
  }
  function y(v: number) {
    return PAD.top + plotH - ((v - minValue) / valueSpan) * plotH;
  }

  const coords = points.map((p) => ({ px: x(p.date.getTime()), py: y(p.value), point: p }));
  const linePath = coords.map((c) => `${c.px},${c.py}`).join(" ");

  const hasAbnormal = points.some((p) => p.status === "high" || p.status === "low");
  const hoveredPoint = hovered != null ? coords[hovered] : null;

  return (
    <div className="flex flex-col gap-2">
      <div className="relative">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="h-auto w-full"
          role="img"
          aria-label={series.testName}
        >
          {hasBand && (
            <rect
              x={PAD.left}
              y={y(latest.high!)}
              width={plotW}
              height={Math.max(0, y(latest.low!) - y(latest.high!))}
              className="fill-success-500/10"
            />
          )}

          <polyline
            points={linePath}
            fill="none"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="stroke-primary-500"
          />

          {/* Out-of-range points get a triangle, not just a color swap — success/warning green
              and amber sit too close under protanopia (ΔE ~4, below the CVD floor) to trust hue
              alone; shape carries the same distinction color-blind. */}
          {coords.map((c, i) => {
            const size = hovered === i ? 6 : 5;
            const cls = `${STATUS_DOT[c.point.status]} stroke-white transition-all dark:stroke-gray-900`;
            if (c.point.status === "high" || c.point.status === "low") {
              const r = size + 1;
              const trianglePoints = `${c.px},${c.py - r} ${c.px - r},${c.py + r * 0.8} ${c.px + r},${c.py + r * 0.8}`;
              return <polygon key={i} points={trianglePoints} strokeWidth={2} className={cls} />;
            }
            return <circle key={i} cx={c.px} cy={c.py} r={size} strokeWidth={2} className={cls} />;
          })}

          {/* Direct label: latest value at the line's end. Right-anchored at a fixed inset from
              the chart's edge (not tied to the last point's x) so a long value+unit string
              grows left into the reserved margin instead of clipping past the viewBox. */}
          <text
            x={W - 4}
            y={coords[coords.length - 1].py}
            textAnchor="end"
            dominantBaseline="middle"
            className="fill-gray-700 text-[11px] font-semibold dark:fill-gray-200"
          >
            {formatValue(latest.value)}
            {latest.unit ? ` ${latest.unit}` : ""}
          </text>

          {/* Axis labels: date range (x) and value range (y) — not a dense grid. */}
          <text x={PAD.left} y={H - 6} className="fill-gray-400 text-[10px] dark:fill-gray-500">
            {formatShortDate(points[0].date)}
          </text>
          <text
            x={PAD.left + plotW}
            y={H - 6}
            textAnchor="end"
            className="fill-gray-400 text-[10px] dark:fill-gray-500"
          >
            {formatShortDate(points[points.length - 1].date)}
          </text>
          <text x={2} y={PAD.top + 4} className="fill-gray-400 text-[10px] dark:fill-gray-500">
            {formatValue(maxValue)}
          </text>
          <text x={2} y={PAD.top + plotH} className="fill-gray-400 text-[10px] dark:fill-gray-500">
            {formatValue(minValue)}
          </text>

          {/* Hover/focus hit targets — bigger than the visible dot, per point. */}
          {coords.map((c, i) => (
            <circle
              key={`hit-${i}`}
              cx={c.px}
              cy={c.py}
              r={12}
              className="cursor-pointer fill-transparent focus:outline-none"
              tabIndex={0}
              role="button"
              aria-label={`${formatShortDate(c.point.date)}: ${formatValue(c.point.value)}${c.point.unit ? ` ${c.point.unit}` : ""}`}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
              onFocus={() => setHovered(i)}
              onBlur={() => setHovered(null)}
            />
          ))}
        </svg>

        {hoveredPoint && (
          <div
            className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-md border border-gray-200 bg-white px-2 py-1 text-xs shadow-md dark:border-gray-700 dark:bg-gray-900"
            style={{
              left: `${(hoveredPoint.px / W) * 100}%`,
              top: `${(hoveredPoint.py / H) * 100 - 4}%`
            }}
          >
            <p className="font-semibold text-gray-900 dark:text-white">
              {formatValue(hoveredPoint.point.value)}
              {hoveredPoint.point.unit ? ` ${hoveredPoint.point.unit}` : ""}
            </p>
            <p className="text-gray-500 dark:text-gray-400">
              {formatShortDate(hoveredPoint.point.date)}
            </p>
          </div>
        )}
      </div>

      {hasAbnormal && (
        <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-success-500" />
            {t("labResult.normal")}
          </span>
          <span className="flex items-center gap-1">
            <svg width="8" height="8" viewBox="0 0 8 8" aria-hidden>
              <polygon points="4,0 0,7 8,7" className="fill-warning-500" />
            </svg>
            {t("labReportsAi.filterAbnormal")}
          </span>
        </div>
      )}
    </div>
  );
}
