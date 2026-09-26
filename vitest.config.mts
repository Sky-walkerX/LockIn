import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

// `.mts` so Vite's native config loader reads it as ESM (a `.ts` config here is
// loaded as CommonJS, since package.json has no `"type": "module"`).
// The tests cover pure modules under lib/: no DOM, no database, so the
// default node environment is all they need.
export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL(".", import.meta.url)) },
  },
  test: {
    include: ["lib/**/*.test.ts"],
  },
});
