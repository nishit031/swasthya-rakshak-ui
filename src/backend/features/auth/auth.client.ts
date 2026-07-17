// Browser-only helpers for storing the login tokens and talking to the auth API.
// (Server code must NOT import this — it touches localStorage.)

const ACCESS_KEY = "sr_access_token";
const REFRESH_KEY = "sr_refresh_token";

// Saves both tokens in the browser after a successful login/register.
export function storeTokens(accessToken: string, refreshToken: string): void {
  localStorage.setItem(ACCESS_KEY, accessToken);
  localStorage.setItem(REFRESH_KEY, refreshToken);
}

// Reads the current access token (used to authorize API calls); null if logged out.
export function getAccessToken(): string | null {
  return localStorage.getItem(ACCESS_KEY);
}

// Reads the current refresh token (used to silently mint a new access token); null if logged out.
export function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_KEY);
}

// Clears stored tokens — this is what "logout" does for a stateless JWT setup.
export function clearTokens(): void {
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);
}
