// Single source of truth for the backend origin. The backend is now a separate Laravel service
// (default http://127.0.0.1:5000); set NEXT_PUBLIC_BACKEND_API_URL to its origin. Empty string = same
// origin (keeps older single-app setups working). Client+server safe — no browser globals.
//
// Must stay NEXT_PUBLIC_-prefixed: this module is imported by "use client" components, and only
// NEXT_PUBLIC_ vars get inlined into the browser bundle — anything else reads as undefined there.
export const API_BASE = (process.env.NEXT_PUBLIC_BACKEND_API_URL ?? "").replace(/\/$/, "");

// Absolute URL for an API path like "/api/v1/auth/login".
export function apiUrl(path: string): string {
  // If API_BASE ends with "/api" and path starts with "/api/", deduplicate to prevent "/api/api/v1/..."
  const base = path.startsWith("/api/") ? API_BASE.replace(/\/api$/, "") : API_BASE;
  return `${base}${path}`;
}

// Absolute URL for a stored file whose fileUrl is a backend-relative path like "/uploads/x.pdf".
// The backend serves these, so they need the same origin. Pass-through for already-absolute URLs.
export function fileUrl(path: string | null | undefined): string {
  if (!path) return "";
  if (/^https?:\/\//.test(path)) return path;
  const base = path.startsWith("/uploads/") ? API_BASE.replace(/\/api$/, "") : API_BASE;
  return `${base}${path}`;
}
