"use client";

import { ThemeProvider } from "./ThemeContext";
import { LanguageProvider } from "./LanguageContext";
import { NotificationProvider } from "./NotificationContext";

/** Single client boundary holding all app-wide context providers. */
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <NotificationProvider>{children}</NotificationProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}
