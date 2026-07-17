"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getAccessToken } from "@/backend/features/auth/auth.client";

/**
 * Renders nothing. On mount, sends already-logged-in visitors to the dashboard.
 * Kept separate from the marketing content so that content stays server-rendered
 * (good for SEO / instant paint) instead of being gated behind a client effect.
 */
export function RedirectIfAuthed() {
  const router = useRouter();
  useEffect(() => {
    if (getAccessToken()) router.replace("/dashboard");
  }, [router]);
  return null;
}
