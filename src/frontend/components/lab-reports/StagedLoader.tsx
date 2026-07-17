"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles } from "lucide-react";

// Cosmetic staged progress shown while a single real request is in flight. Advances through the
// given labels on a timer and holds on the last one until the parent unmounts it (request done).
export function StagedLoader({ stages }: { stages: string[] }) {
  const [i, setI] = useState(0);

  useEffect(() => {
    if (i >= stages.length - 1) return;
    const timer = setTimeout(() => setI((n) => Math.min(n + 1, stages.length - 1)), 1300);
    return () => clearTimeout(timer);
  }, [i, stages.length]);

  return (
    <div className="flex flex-col items-center gap-4 py-10 text-center">
      <motion.span
        className="flex h-14 w-14 items-center justify-center rounded-full bg-primary-100 text-primary-600 dark:bg-primary-900/40 dark:text-primary-300"
        animate={{ scale: [1, 1.12, 1] }}
        transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
      >
        <Sparkles size={24} />
      </motion.span>
      <div className="h-6">
        <AnimatePresence mode="wait">
          <motion.p
            key={i}
            className="text-sm font-medium text-gray-700 dark:text-gray-200"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.25 }}
          >
            {stages[i]}
          </motion.p>
        </AnimatePresence>
      </div>
      <div className="flex gap-1.5" aria-hidden>
        {stages.map((_, idx) => (
          <span
            key={idx}
            className={`h-1.5 w-1.5 rounded-full transition-colors ${
              idx <= i ? "bg-primary-500" : "bg-gray-200 dark:bg-gray-700"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
