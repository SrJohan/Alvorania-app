import { defineConfig, devices } from "@playwright/test";

// Las pruebas e2e corren contra una compilación de producción en MODO DEMO (datos en el navegador):
// no tocan Supabase ni Stripe reales. El backend real se prueba con vitest (tests/ y src/**/*.test.ts).
const PORT = 3100;

export default defineConfig({
  testDir: "e2e",
  fullyParallel: true,
  retries: 0,
  reporter: [["list"]],
  use: { baseURL: `http://localhost:${PORT}`, trace: "retain-on-failure", locale: "es-ES", timezoneId: "Europe/Madrid" },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } }, grepInvert: /@mobile/ },
    { name: "mobile", use: { ...devices["Pixel 7"] }, grep: /@mobile/ },
  ],
  webServer: {
    command: `npx next build && npx next start -p ${PORT}`,
    url: `http://localhost:${PORT}`,
    timeout: 240_000,
    reuseExistingServer: false,
    env: { NEXT_PUBLIC_DATA_MODE: "demo", NEXT_DIST_DIR: ".next-e2e" },
  },
});
