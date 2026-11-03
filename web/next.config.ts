import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Las pruebas e2e compilan en su propia carpeta para no pisar el servidor de desarrollo.
  distDir: process.env.NEXT_DIST_DIR ?? ".next",
  // Solo en desarrollo: abrir la demo desde un móvil de la misma wifi (http://192.168.x.x:3000).
  allowedDevOrigins: ["192.168.*.*", "10.*.*.*"],
  // La antigua pestaña de artículos (feed de otra gestoría) es ahora el blog propio.
  rewrites: async () => ({ beforeFiles: [{ source: "/", destination: "/bienvenida/index.html" }] }),
  redirects: async () => [{ source: "/articulos", destination: "/blog", permanent: true }],
  // Las fotos de portada y precios ya vienen comprimidas en .webp a 1916-2098 px: recomprimirlas a 75 (el valor por defecto) las emborronaba.
  images: { qualities: [90] },
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
