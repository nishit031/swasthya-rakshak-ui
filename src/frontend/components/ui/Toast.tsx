"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X, type LucideIcon } from "lucide-react";
import { Button } from "./Button";
import { cn } from "./cn";
import { TONE_CHIP, TONE_BORDER, type IconTone } from "@/backend/features/reminders/reminder-ui";

export interface ToastAction {
  label: string;
  onClick: () => void;
  variant?: "primary" | "secondary" | "outline";
}

export interface Toast {
  id: string;
  title: string;
  body?: string;
  tone?: IconTone;
  icon?: LucideIcon;
  actions?: ToastAction[];
}

interface ToastCardProps {
  toast: Toast;
  onDismiss: (id: string) => void;
}

function ToastCard({ toast, onDismiss }: ToastCardProps) {
  const tone = toast.tone ?? "primary";
  const Icon = toast.icon;

  return (
    <motion.div
      layout
      role="status"
      className={cn("glass-card w-80 border-l-4 !p-4 shadow-xl", TONE_BORDER[tone])}
      initial={{ x: 400, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 400, opacity: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 26 }}
    >
      <div className="flex items-start gap-3">
        {Icon && (
          <span
            className={cn(
              "flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg",
              TONE_CHIP[tone]
            )}
          >
            <Icon size={16} />
          </span>
        )}
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-gray-900 dark:text-white">{toast.title}</p>
          {toast.body && (
            <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">{toast.body}</p>
          )}
          {toast.actions && toast.actions.length > 0 && (
            <div className="mt-3 flex gap-2">
              {toast.actions.map((action, i) => (
                <Button
                  key={i}
                  variant={action.variant ?? "primary"}
                  size="sm"
                  onClick={action.onClick}
                >
                  {action.label}
                </Button>
              ))}
            </div>
          )}
        </div>
        <button
          onClick={() => onDismiss(toast.id)}
          aria-label="Dismiss"
          className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-md text-gray-400 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-800 dark:hover:text-gray-200"
        >
          <X size={14} />
        </button>
      </div>
    </motion.div>
  );
}

interface ToastViewportProps {
  toasts: Toast[];
  onDismiss: (id: string) => void;
}

/** Fixed top-right stack of slide-in toasts, anchored just below the dashboard top nav. */
export function ToastViewport({ toasts, onDismiss }: ToastViewportProps) {
  return (
    <div className="fixed right-4 top-20 z-50 flex flex-col gap-3">
      <AnimatePresence>
        {toasts.map((toast) => (
          <ToastCard key={toast.id} toast={toast} onDismiss={onDismiss} />
        ))}
      </AnimatePresence>
    </div>
  );
}
