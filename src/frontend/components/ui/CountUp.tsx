"use client";

import { useEffect, useRef, useState } from "react";
import { useInView } from "framer-motion";

interface CountUpProps {
  end: number;
  duration?: number;
  decimals?: number;
}

const easeOutQuad = (x: number) => (x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2);

/** Counts up to `end` once the element scrolls into view. */
export function CountUp({ end, duration = 2, decimals = 0 }: CountUpProps) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });

  useEffect(() => {
    if (!inView) return;
    const totalFrames = Math.max(1, Math.round(duration * 60));
    let frame = 0;
    const id = setInterval(() => {
      frame++;
      if (frame >= totalFrames) {
        setCount(end);
        clearInterval(id);
      } else {
        setCount(easeOutQuad(frame / totalFrames) * end);
      }
    }, 1000 / 60);
    return () => clearInterval(id);
  }, [inView, end, duration]);

  return <span ref={ref}>{count.toFixed(decimals)}</span>;
}
