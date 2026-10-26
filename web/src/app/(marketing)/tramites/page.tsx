import type { Metadata } from "next";
import Link from "next/link";
import { Tag } from "@/components/ui/display";

export const metadata: Metadata = { title: "Trámites" };

const groups = [
  { title: "Particulares", items: [
    { name: "Declaración de la renta", price: "Desde 29 €", href: "/acceder?next=/app/conectar" },
    { name: "Revisión de ejercicios anteriores", price: "10 € por año", href: "/acceder?next=/app/conectar" },
  ]},
  { title: "Hacienda y requerimientos", items: [
    { name: "Análisis de una carta de Hacienda", price: "Gratis", href: "/acceder?next=/app/requerimiento" },
    { name: "Respuesta a un requerimiento", price: "Desde 50 €", href: "/acceder?next=/app/requerimiento" },
  ]},
  { title: "Autónomos", items: [
    { name: "Alta de autónomo", price: "A consultar", href: "/asesoria-gestoria" },
    { name: "Gestoría mensual", price: "Desde 29,90 € al mes", href: "/asesoria-gestoria" },
  ]},
  { title: "Internacional", items: [
    { name: "Modelo 720 (bienes en el extranjero)", price: "A presupuestar", soon: true },
    { name: "Residencia fiscal y salida de España", price: "A presupuestar", soon: true },
  ]},
];

export default function Tramites() {
  return (
    <div className="mx-auto max-w-content px-4 py-12">
      <h1 className="text-xl font-bold">Trámites</h1>
      <p className="mt-2 max-w-reading text-text-muted">Elige el que necesitas. Si no lo ves, escríbenos y lo valoramos.</p>
      <div className="mt-8 grid gap-8 md:grid-cols-2">
        {groups.map((g) => (
          <section key={g.title} aria-labelledby={g.title}>
            <h2 id={g.title} className="text-lg font-semibold">{g.title}</h2>
            <ul className="mt-3 divide-y divide-border rounded-lg border border-border">
              {g.items.map((it) => (
                <li key={it.name} className="flex items-center justify-between gap-3 p-4">
                  <div>
                    {"href" in it && it.href ? <Link href={it.href} className="font-medium hover:underline">{it.name}</Link> : <span className="font-medium">{it.name}</span>}
                    <p className="text-sm text-text-muted">{it.price}</p>
                  </div>
                  {"soon" in it && it.soon && <Tag>Próximamente</Tag>}
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
