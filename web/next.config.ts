import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Las pruebas e2e compilan en su propia carpeta para no pisar el servidor de desarrollo.
  distDir: process.env.NEXT_DIST_DIR ?? ".next",
  // Solo en desarrollo: abrir la demo desde un móvil de la misma wifi (http://192.168.x.x:3000).
  allowedDevOrigins: ["192.168.*.*", "10.*.*.*"],
  // La web pública vive en WordPress; aquí solo está la app. La raíz lleva al acceso.
  redirects: async () => [{ source: "/", destination: "/acceder", permanent: false }],
  // La app no se indexa nunca: es privada.
  headers: async () => [{ source: "/:path*", headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }] }],
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
