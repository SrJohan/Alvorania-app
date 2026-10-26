import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Las pruebas e2e compilan en su propia carpeta para no pisar el servidor de desarrollo.
  distDir: process.env.NEXT_DIST_DIR ?? ".next",
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  // Las pantallas del área privada leen el estado del navegador; solo se valida la navegación instantánea donde se pida con `instant`.
  experimental: { instantInsights: { validationLevel: "manual-warning" } },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
