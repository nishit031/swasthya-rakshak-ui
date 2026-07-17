"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Heart } from "lucide-react";

/** Brief splash shown on first load. Fades out after `duration` ms. */
export function Preloader({ duration = 1800 }: { duration?: number }) {
  const [visible, setVisible] = useState(true);
  const [dots, setDots] = useState(1);

  useEffect(() => {
    const dotTimer = setInterval(() => setDots((d) => (d % 3) + 1), 450);
    const hideTimer = setTimeout(() => setVisible(false), duration);
    return () => {
      clearInterval(dotTimer);
      clearTimeout(hideTimer);
    };
  }, [duration]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-gradient-to-br from-primary-50 via-white to-secondary-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
        >
          <motion.div
            animate={{ scale: [1, 1.12, 1, 1.06, 1] }}
            transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
            className="text-primary-600 dark:text-primary-400"
          >
            <Heart size={56} fill="currentColor" />
          </motion.div>
          <p className="mt-5 text-2xl font-bold text-gray-800 dark:text-gray-100">
            स्वास्थ्य रक्षक
          </p>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Loading{".".repeat(dots)}</p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
