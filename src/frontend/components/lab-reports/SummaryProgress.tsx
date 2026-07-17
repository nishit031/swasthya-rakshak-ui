"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, Loader2, Circle } from "lucide-react";
import { useTranslation } from "@/frontend/components/providers/LanguageContext";

// Animated step checklist shown while a summary is generating. The five steps mirror the real
// pipeline (OCR → redact → analyze → summarize → rehydrate) but advance on a cosmetic timer — a
// single request is in flight, same honest pattern as StagedLoader. Holds on the last step until
// the parent unmounts it (request resolved and the summary is swapped in).
export function SummaryProgress() {
  const { t } = useTranslation();
  const steps = [
    t("labReportsAi.stepOcr"),
    t("labReportsAi.stepPii"),
    t("labReportsAi.stepAnalyze"),
    t("labReportsAi.stepGenerate"),
    t("labReportsAi.stepRestore")
  ];
  const [i, setI] = useState(0);

  useEffect(() => {
    if (i >= steps.length - 1) return;
    const timer = setTimeout(() => setI((n) => Math.min(n + 1, steps.length - 1)), 1400);
    return () => clearTimeout(timer);
  }, [i, steps.length]);

  return (
    <div className="flex flex-col gap-3 py-2">
      <p className="text-sm font-semibold text-gray-900 dark:text-white">
        {t("labReportsAi.genTitle")}
      </p>
      <ul className="flex flex-col gap-2.5">
        {steps.map((step, idx) => {
          const done = idx < i;
          const active = idx === i;
          return (
            <motion.li
              key={idx}
              className="flex items-center gap-2.5 text-sm"
              initial={{ opacity: 0.4 }}
              animate={{ opacity: done || active ? 1 : 0.5 }}
              transition={{ duration: 0.25 }}
            >
              {done ? (
                <motion.span
                  initial={{ scale: 0.6 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 400, damping: 18 }}
                  className="text-success-500"
                >
                  <CheckCircle2 size={17} />
                </motion.span>
              ) : active ? (
                <Loader2 size={17} className="animate-spin text-primary-500" />
              ) : (
                <Circle size={17} className="text-gray-300 dark:text-gray-600" />
              )}
              <span
                className={
                  done || active
                    ? "text-gray-800 dark:text-gray-200"
                    : "text-gray-400 dark:text-gray-500"
                }
              >
                {step}
              </span>
            </motion.li>
          );
        })}
      </ul>
    </div>
  );
}
