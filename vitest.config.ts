import { defineConfig } from "vitest/config";
import path from "path";

// Vitest runs the pure Node/TS utility tests. It mirrors the `@/*` path alias from tsconfig.json.
export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    coverage: {
      provider: "v8",
      include: ["src/backend/lib/**/*.ts"],
      exclude: ["src/backend/lib/**/*.test.ts"]
    }
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src")
    }
  }
});
