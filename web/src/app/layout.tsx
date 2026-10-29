import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Alvorania · Tu renta, a la vista", template: "%s · Alvorania" },
  description: "Calcula tu renta gratis. Un asesor la revisa y nada se presenta sin tu confirmación.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" data-scroll-behavior="smooth" className="h-full antialiased">
      <body className="flex min-h-full flex-col">
        <a href="#contenido" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-bg focus:px-4 focus:py-2">
          Saltar al contenido
        </a>
        {children}
      </body>
    </html>
  );
}
