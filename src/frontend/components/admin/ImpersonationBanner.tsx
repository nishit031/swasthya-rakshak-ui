"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldAlert } from "lucide-react";
import { isImpersonating, stopImpersonation } from "@/backend/features/admin/impersonation.client";

// Shown across the patient dashboard whenever the current session is an admin's
// impersonation token — a constant, unmissable reminder that this is a redacted test
// view, with a one-click way back to the admin's own session.
export function ImpersonationBanner() {
  const router = useRouter();
  const [active, setActive] = useState(false);

  useEffect(() => {
    setActive(isImpersonating());
  }, []);

  if (!active) return null;

  return (
    <div className="flex items-center justify-between gap-3 bg-warning-500 px-4 py-2 text-sm font-medium text-white">
      <span className="flex items-center gap-2">
        <ShieldAlert size={16} /> Admin test view — health data is redacted
      </span>
      <button
        className="rounded-md bg-white/20 px-3 py-1 text-xs font-semibold hover:bg-white/30"
        onClick={() => {
          stopImpersonation();
          router.push("/admin/users");
        }}
      >
        Exit
      </button>
    </div>
  );
}
