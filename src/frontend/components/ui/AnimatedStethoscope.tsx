"use client";

import { motion } from "framer-motion";

/** Looping ECG heartbeat line. Calm, decorative — used in hero areas. */
export function AnimatedStethoscope() {
  const d = "M50 100 L150 100 L170 50 L190 150 L210 20 L230 180 L250 100 L550 100";
  const transition = {
    duration: 3,
    repeat: Infinity,
    ease: [0.4, 0, 0.2, 1] as [number, number, number, number],
    times: [0, 0.2, 0.8, 1]
  };
  return (
    <div className="flex h-72 w-full items-center justify-center">
      <svg width="100%" height="200" viewBox="0 0 600 200" className="h-auto w-full max-w-2xl">
        <motion.path
          d={d}
          stroke="rgb(var(--success-500))"
          strokeWidth={12}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity={0.3}
          style={{ filter: "blur(3px)" }}
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: [0, 1, 1, 0], opacity: [0, 0.3, 0.3, 0] }}
          transition={transition}
        />
        <motion.path
          d={d}
          stroke="rgb(var(--success-500))"
          strokeWidth={6}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: [0, 1, 1, 0], opacity: [0, 0.9, 0.9, 0] }}
          transition={transition}
        />
      </svg>
    </div>
  );
}
