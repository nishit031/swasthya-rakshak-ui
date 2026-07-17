// Browser-only helpers for "Test as user": an admin swaps their own access token for a
// short-lived, redaction-forced impersonation token (see AdminService::impersonate on the
// backend), then is dropped into the normal patient dashboard. Every PHI response they see
// is redacted and audited server-side — this file only manages which token is active
// locally so the admin's own session can be restored afterwards.
import { getAccessToken, getRefreshToken } from "@/backend/features/auth/auth.client";

const ACCESS_KEY = "sr_access_token";
const REFRESH_KEY = "sr_refresh_token";
const ADMIN_BACKUP_ACCESS_KEY = "sr_admin_backup_access_token";
const ADMIN_BACKUP_REFRESH_KEY = "sr_admin_backup_refresh_token";

export function startImpersonation(impersonationAccessToken: string): void {
  const currentAccess = getAccessToken();
  const currentRefresh = getRefreshToken();
  if (currentAccess) localStorage.setItem(ADMIN_BACKUP_ACCESS_KEY, currentAccess);
  if (currentRefresh) localStorage.setItem(ADMIN_BACKUP_REFRESH_KEY, currentRefresh);

  // No refresh token for an impersonation session — it's short-lived by design and isn't
  // silently renewed; re-run "Test as user" from the admin panel if it expires mid-test.
  localStorage.setItem(ACCESS_KEY, impersonationAccessToken);
  localStorage.removeItem(REFRESH_KEY);
}

export function isImpersonating(): boolean {
  return typeof window !== "undefined" && localStorage.getItem(ADMIN_BACKUP_ACCESS_KEY) !== null;
}

export function stopImpersonation(): void {
  const backupAccess = localStorage.getItem(ADMIN_BACKUP_ACCESS_KEY);
  const backupRefresh = localStorage.getItem(ADMIN_BACKUP_REFRESH_KEY);
  if (backupAccess) localStorage.setItem(ACCESS_KEY, backupAccess);
  if (backupRefresh) localStorage.setItem(REFRESH_KEY, backupRefresh);
  localStorage.removeItem(ADMIN_BACKUP_ACCESS_KEY);
  localStorage.removeItem(ADMIN_BACKUP_REFRESH_KEY);
}
