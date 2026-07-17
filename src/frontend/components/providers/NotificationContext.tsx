"use client";

import { createContext, useCallback, useContext, useRef, useState } from "react";
import { ToastViewport, type Toast } from "@/frontend/components/ui/Toast";

export type NotifyInput = Omit<Toast, "id"> & { id?: string };

interface NotificationContextValue {
  /** Push a toast. Returns its id. Reuses an existing toast if `id` is already showing. */
  notify: (input: NotifyInput) => string;
  dismiss: (id: string) => void;
}

const NotificationContext = createContext<NotificationContextValue | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const counter = useRef(0);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const notify = useCallback((input: NotifyInput) => {
    const id = input.id ?? `toast-${++counter.current}`;
    setToasts((prev) => {
      if (prev.some((t) => t.id === id)) {
        return prev.map((t) => (t.id === id ? { ...input, id } : t));
      }
      return [...prev, { ...input, id }];
    });
    return id;
  }, []);

  return (
    <NotificationContext.Provider value={{ notify, dismiss }}>
      {children}
      <ToastViewport toasts={toasts} onDismiss={dismiss} />
    </NotificationContext.Provider>
  );
}

export function useNotification() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error("useNotification must be used within a NotificationProvider");
  return ctx;
}
