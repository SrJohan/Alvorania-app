import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: { include: ["tests/**/*.test.ts", "src/**/*.test.ts"], testTimeout: 60000 },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
      // En pruebas no hay entorno de servidor de React: se sustituye por un módulo vacío.
      "server-only": path.resolve(__dirname, "tests/stubs/server-only.ts"),
    },
  },
});
