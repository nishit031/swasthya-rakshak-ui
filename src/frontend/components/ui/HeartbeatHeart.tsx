"use client";

import { motion } from "framer-motion";
import { Heart } from "lucide-react";

/**
 * Lightweight, calming hero visual: a softly pulsing heart inside concentric
 * rings. A dependency-free stand-in for a 3D scene (no three.js), so it renders
 * instantly and works in SSR.
 */
export function HeartbeatHeart() {
  return (
    <div className="relative flex aspect-square w-full max-w-sm items-center justify-center">
      {/* Soft glow */}
      <div className="absolute inset-6 rounded-full bg-primary-400/20 blur-3xl dark:bg-primary-600/20" />

      {/* Expanding rings */}
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="absolute rounded-full border border-primary-400/40 dark:border-primary-500/30"
          style={{ width: "60%", height: "60%" }}
          initial={{ scale: 0.8, opacity: 0.6 }}
          animate={{ scale: 1.6, opacity: 0 }}
          transition={{ duration: 3, repeat: Infinity, delay: i, ease: "easeOut" }}
        />
      ))}

      {/* Heart */}
      <motion.div
        className="relative flex h-40 w-40 items-center justify-center rounded-full bg-gradient-to-br from-primary-500 to-secondary-500 text-white shadow-2xl"
        animate={{ scale: [1, 1.08, 1, 1.04, 1] }}
        transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
      >
        <Heart size={72} fill="currentColor" className="text-white" />
      </motion.div>
    </div>
  );
}
