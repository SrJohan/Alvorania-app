"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Briefcase, FileText, Globe, Mail, RotateCcw, type LucideIcon } from "lucide-react";

const START = "/acceder?next=/app/conectar";

type Service = {
  name: string; Icon: LucideIcon; href: string; cta: string; text: string;
  sample: { title: string; tag: string; figure: string; label: string; rows: [string, string][]; note: string };
};

// Cifras de ejemplo: ilustran cómo se ve cada caso, no son datos reales.
const services: Service[] = [
  {
    name: "Renta", Icon: FileText, href: START, cta: "Calcular mi renta",
    text: "Ves el resultado antes de pagar nada. Un asesor la revisa y tú das el visto bueno.",
    sample: { title: "Renta · individual", tag: "Lista para tu visto bueno", figure: "+634 €", label: "a devolver", rows: [["Deducciones detectadas", "14"], ["Revisión", "Asesor fiscal"]], note: "Se presenta cuando tú lo confirmas" },
  },
  {
    name: "Autónomos", Icon: Briefcase, href: "/asesoria-gestoria", cta: "Ver el servicio",
    text: "Trimestres, facturas y renta con un gestor que conoce tu actividad.",
    sample: { title: "Trimestre 2 · IVA", tag: "Plazo en 9 días", figure: "1.280 €", label: "a ingresar", rows: [["Facturas revisadas", "22"], ["Gastos deducibles", "3.940 €"]], note: "Recordatorio antes de cada plazo" },
  },
  {
    name: "Requerimientos", Icon: Mail, href: "/acceder?next=/app/requerimiento", cta: "Subir la carta",
    text: "Subes la carta de Hacienda y te explicamos qué piden, con un borrador de respuesta.",
    sample: { title: "Carta de la AEAT", tag: "Plazo abierto", figure: "10 días", label: "para responder", rows: [["Qué piden", "Justificar una deducción"], ["Borrador", "Listo para revisar"]], note: "Respondemos dentro de plazo" },
  },
  {
    name: "Años anteriores", Icon: RotateCcw, href: START, cta: "Revisar mis años",
    text: "Miramos tus últimos cuatro ejercicios y reclamamos lo que pagaste de más.",
    sample: { title: "Revisión de 4 ejercicios", tag: "Posible devolución", figure: "412 €", label: "recuperables", rows: [["Ejercicios revisados", "4"], ["Reclamación", "La presentamos nosotros"]], note: "Sin compromiso hasta ver la cifra" },
  },
  {
    name: "Vivo en el extranjero", Icon: Globe, href: "/tramites", cta: "Ver trámites",
    text: "Residencia fiscal, modelo 720 y declaraciones con ingresos de más de un país.",
    sample: { title: "Residencia fiscal", tag: "En revisión", figure: "2 países", label: "con ingresos", rows: [["Bienes en el extranjero", "3"], ["Revisión", "Asesor fiscal"]], note: "Te decimos qué declarar y dónde" },
  },
];

export function ServicesPanel() {
  const [open, setOpen] = useState(0);

  return (
    <div className="flex flex-col gap-2 lg:h-[500px] lg:flex-row">
      {services.map(({ name, Icon, href, cta, text, sample }, i) => {
        const active = i === open;
        return (
          <section
            key={name}
            aria-label={name}
            className={`relative overflow-hidden rounded-[20px] border border-border transition-[flex-grow,background-color] duration-500 ease-brand motion-reduce:transition-none lg:basis-[72px] ${active ? "bg-surface lg:grow" : "bg-surface-raised hover:bg-accent-soft lg:grow-0"}`}
          >
            {active ? (
              <div className="flex flex-col gap-6 p-5 sm:p-8 lg:h-full lg:min-w-[760px] lg:flex-row lg:items-center lg:justify-between">
                <div className="max-w-sm">
                  <span aria-hidden className="grid size-11 place-items-center rounded-[12px] bg-accent text-on-accent"><Icon className="size-5" /></span>
                  <h3 className="mt-5 font-display text-[32px] font-semibold leading-none tracking-[-0.05em] text-ink">{name}</h3>
                  <p className="mt-3 text-text-muted">{text}</p>
                  <Link href={href} className="group mt-6 inline-flex items-center gap-2 font-semibold text-accent hover:text-accent-hover">
                    {cta}
                    <ArrowRight aria-hidden className="size-4 transition-transform duration-200 group-hover:translate-x-1 motion-reduce:transform-none" />
                  </Link>
                </div>

                <div className="w-full max-w-[400px] shrink-0 lg:-rotate-1">
                  <div className="rounded-t-[12px] bg-ink px-4 py-1.5 text-xs font-medium text-on-ink-muted">Ejemplo ilustrativo</div>
                  <div className="rounded-b-[16px] border border-t-0 border-border bg-surface-raised p-5 shadow-pop">
                    <div className="flex items-start justify-between gap-3">
                      <p className="font-semibold text-ink">{sample.title}</p>
                      <span className="shrink-0 rounded-pill bg-accent-soft px-2.5 py-0.5 text-xs font-semibold text-on-accent-soft">{sample.tag}</span>
                    </div>
                    <p className="mt-5 font-display text-[44px] font-semibold leading-none tracking-[-0.06em] text-ink">{sample.figure}</p>
                    <p className="mt-1 text-sm text-text-muted">{sample.label}</p>
                    <dl className="mt-5 divide-y divide-border border-t border-border text-sm">
                      {sample.rows.map(([k, v]) => (
                        <div key={k} className="flex justify-between gap-4 py-2.5">
                          <dt className="text-text-muted">{k}</dt>
                          <dd className="text-right font-semibold text-ink">{v}</dd>
                        </div>
                      ))}
                    </dl>
                    <p className="mt-1 text-xs text-text-muted">{sample.note}</p>
                  </div>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setOpen(i)}
                aria-label={`Ver ${name}`}
                className="flex w-full items-center gap-3 p-4 text-left font-display text-lg font-semibold text-ink lg:h-full lg:flex-col lg:justify-between lg:px-0 lg:py-5"
              >
                <span aria-hidden className="grid size-10 place-items-center rounded-[10px] bg-accent-soft text-accent"><Icon className="size-[18px]" /></span>
                <span className="lg:[writing-mode:vertical-rl] lg:rotate-180">{name}</span>
              </button>
            )}
          </section>
        );
      })}
    </div>
  );
}
