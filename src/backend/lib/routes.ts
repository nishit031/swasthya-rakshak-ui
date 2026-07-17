import type { Route } from "next";

// next.config's typedRoutes can't statically validate a path+query string built at runtime (e.g.
// a filtered list URL). Cast at the one boundary where we hand it to next/navigation — only safe
// when the path itself is a real route in this app.
export function toRoute(path: string): Route {
  return path as Route;
}
