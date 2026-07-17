"use client";

import { useCallback, useEffect, useState, type RefObject } from "react";

const DEFAULT_WIDTH = 288; // matches the calendar popover's w-72
const DEFAULT_HEIGHT_ESTIMATE = 336; // fixed-height content, avoids a measure-then-flash render
const VIEWPORT_MARGIN = 8;
const GAP = 4;

export interface PopoverPosition {
  top: number;
  left: number;
  placement: "top" | "bottom";
}

/**
 * Fixed-position coordinates for a portaled popover anchored to `triggerRef`. Flips above the
 * trigger when there isn't room below (and there is room above), and clamps horizontally so the
 * popover never overflows the viewport. Positions are viewport-relative (`position: fixed`), so
 * they need no scroll-offset math.
 *
 * Closes the popover on any scroll rather than repositioning continuously — the same behavior
 * native `<select>`/`<input type="date">` popups already have, and it avoids reposition-on-scroll
 * jank (stale rects during momentum scroll, extra listeners on every ancestor scroll container).
 * `onClose` should be a stable callback (wrap it in `useCallback` in the caller) so this effect
 * doesn't re-attach listeners on every render.
 */
export function usePopoverPosition(
  triggerRef: RefObject<HTMLElement | null>,
  open: boolean,
  onClose: () => void,
  size: { width?: number; heightEstimate?: number } = {}
): PopoverPosition | null {
  const width = size.width ?? DEFAULT_WIDTH;
  const heightEstimate = size.heightEstimate ?? DEFAULT_HEIGHT_ESTIMATE;
  const [position, setPosition] = useState<PopoverPosition | null>(null);

  const recompute = useCallback(() => {
    const trigger = triggerRef.current;
    if (!trigger) return;
    const rect = trigger.getBoundingClientRect();

    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    const placement: "top" | "bottom" =
      spaceBelow < heightEstimate + GAP && spaceAbove > heightEstimate + GAP ? "top" : "bottom";

    const top = placement === "bottom" ? rect.bottom + GAP : rect.top - heightEstimate - GAP;

    let left = rect.left;
    if (left + width > window.innerWidth - VIEWPORT_MARGIN) {
      left = window.innerWidth - width - VIEWPORT_MARGIN;
    }
    left = Math.max(VIEWPORT_MARGIN, left);

    setPosition({ top, left, placement });
  }, [triggerRef, width, heightEstimate]);

  useEffect(() => {
    if (!open) return;
    recompute();

    // Capture phase: scroll events don't bubble, but a capture listener on window still fires
    // for scroll on any descendant container (e.g. a Modal's internal overflow-y-auto panel).
    window.addEventListener("scroll", onClose, true);
    window.addEventListener("resize", recompute);
    return () => {
      window.removeEventListener("scroll", onClose, true);
      window.removeEventListener("resize", recompute);
    };
  }, [open, recompute, onClose]);

  return position;
}
