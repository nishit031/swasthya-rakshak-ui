import type { NextConfig } from "next";

// This devcontainer's fs.inotify.max_user_instances is capped at 128 and can't be raised from
// inside the container. Watchpack opens one inotify instance per watched directory, which blows
// through that cap almost immediately and throws EMFILE (Linux's errno for an exceeded instance
// count) well before any real fd or watch-count limit is hit. Forcing polling here — before
// Next spins up its watchers — sidesteps inotify entirely.
process.env.WATCHPACK_POLLING = "true";

// Security headers applied to every response. These are defence-in-depth measures that
// cost nothing at runtime and close common attack vectors (clickjacking, MIME sniffing,
// referrer leakage). HSTS is only honoured by browsers over HTTPS, so it is inert in
// local HTTP dev and only takes effect once the app is served over TLS in production.
const securityHeaders = [
  // Force HTTPS for two years, including subdomains. Ignored on plain HTTP (dev).
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
  // Stop the browser from guessing (sniffing) a response's content type.
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Disallow the app being embedded in an iframe (clickjacking protection).
  { key: "X-Frame-Options", value: "DENY" },
  // Don't leak full URLs (which can carry ids) to other origins.
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Deny access to powerful browser features we don't use.
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" }
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  typedRoutes: true,
  // pdf-parse pulls in pdfjs-dist, which assumes a plain Node `require` and breaks when webpack
  // tries to bundle it into the route handler (throws "Object.defineProperty called on
  // non-object" at import time — even for requests that never touch a PDF). Keep it external so
  // Next loads it via native `require` at runtime instead. tesseract.js (wasm), sharp and
  // @napi-rs/canvas ship native/wasm binaries webpack likewise can't bundle — the OCR path.
  serverExternalPackages: ["pdf-parse", "pdfjs-dist", "tesseract.js", "sharp", "@napi-rs/canvas"],
  images: {
    remotePatterns: [{ protocol: "https", hostname: "images.pexels.com" }]
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  }
};

export default nextConfig;
