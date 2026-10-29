"use client";

import { useRef, useState, type KeyboardEvent } from "react";
import Link from "next/link";
import { ArrowRight, Briefcase, FileText, Globe, Mail, Paperclip, RotateCcw, type LucideIcon } from "lucide-react";

const START = "/acceder?next=/app/conectar";

type Service = {
  name: string; tab?: string; Icon: LucideIcon; href: string; cta: string; text: string;
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
    name: "Vivo en el extranjero", tab: "Extranjero", Icon: Globe, href: "/tramites", cta: "Ver trámites",
    text: "Residencia fiscal, modelo 720 y declaraciones con ingresos de más de un país.",
    sample: { title: "Residencia fiscal", tag: "En revisión", figure: "2 países", label: "con ingresos", rows: [["Bienes en el extranjero", "3"], ["Revisión", "Asesor fiscal"]], note: "Te decimos qué declarar y dónde" },
  },
];

// Cada trámite es una carpeta de archivador: la pestaña activa se funde con el cuerpo y el ejemplo sale como un documento sellado.
export function ServicesPanel() {
  const [open, setOpen] = useState(0);
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  // El sello cae solo la primera vez que se abre cada trámite, y nunca desde el teclado: cambiar de pestaña es frecuente.
  const seen = useRef(new Set([0]));
  const [stamp, setStamp] = useState(true);
  const { name, Icon, href, cta, text, sample } = services[open];

  function select(i: number, viaKey = false) {
    setStamp(!viaKey && !seen.current.has(i));
    seen.current.add(i);
    setOpen(i);
    // En móvil la tira de pestañas se desplaza: la elegida tiene que quedar a la vista.
    const tab = tabs.current[i];
    tab?.parentElement?.scrollTo({ left: tab.offsetLeft - (tab.parentElement.clientWidth - tab.offsetWidth) / 2, behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  }

  function onKey(e: KeyboardEvent) {
    const last = services.length - 1;
    const next = { ArrowRight: open === last ? 0 : open + 1, ArrowLeft: open === 0 ? last : open - 1, Home: 0, End: last }[e.key];
    if (next === undefined) return;
    e.preventDefault();
    select(next, true);
    tabs.current[next]?.focus();
  }

  return (
    <div>
      <div role="tablist" aria-label="Trámites" onKeyDown={onKey} className="relative -mb-px flex items-end gap-1 overflow-x-auto overflow-y-hidden [scrollbar-width:none]">
        {services.map((s, i) => {
          const active = i === open;
          return (
            <button
              key={s.name}
              ref={(el) => { tabs.current[i] = el; }}
              type="button"
              role="tab"
              id={`tramite-tab-${i}`}
              aria-selected={active}
              aria-controls="tramite-panel"
              tabIndex={active ? 0 : -1}
              onClick={() => select(i)}
              className={`relative flex shrink-0 items-center gap-2 rounded-t-[14px] border border-b-0 px-4 font-semibold whitespace-nowrap pt-3.5 pb-3 transition-[translate,background-color,color] duration-200 ease-brand motion-reduce:transition-none sm:px-5 ${active ? "z-10 border-field-a bg-field-a text-ink" : "translate-y-1.5 border-border bg-surface text-text-muted hover:translate-y-0.5 hover:bg-accent-soft hover:text-ink"}`}
            >
              <s.Icon aria-hidden className="size-4" />
              {s.tab ?? s.name}
            </button>
          );
        })}
      </div>

      <div
        role="tabpanel"
        id="tramite-panel"
        aria-labelledby={`tramite-tab-${open}`}
        className={`relative grid gap-10 overflow-hidden rounded-b-[24px] rounded-tr-[24px] bg-field-a px-5 py-8 sm:px-10 sm:py-12 lg:min-h-[460px] lg:grid-cols-[minmax(0,1fr)_420px] lg:items-center lg:gap-16 lg:px-14 ${open === 0 ? "" : "rounded-tl-[24px]"}`}
      >
        <div key={name} className="anim-quick max-w-md">
          <h3 className="font-display text-[34px] font-semibold leading-[1.05] tracking-[-0.04em] text-ink sm:text-[44px] [text-wrap:balance]">{name}</h3>
          <p className="mt-4 text-lg leading-relaxed text-text">{text}</p>
          <Link href={href} className="group mt-8 inline-flex items-center gap-2 rounded-pill bg-ink px-5 py-3 font-semibold text-on-ink transition-colors hover:bg-accent-hover">
            {cta}
            <ArrowRight aria-hidden className="size-4 transition-transform duration-200 group-hover:translate-x-1 motion-reduce:transform-none" />
          </Link>
        </div>

        <div className="relative mx-auto w-full max-w-[420px] pt-4">
          {/* Hoja de debajo: el expediente tiene más papeles que el que se ve. */}
          <div aria-hidden className="absolute inset-x-3 top-4 bottom-0 rotate-[2.5deg] rounded-[6px] border border-border bg-surface shadow-card" />

          <article key={name} aria-label={`Ejemplo ilustrativo: ${sample.title}`} className="anim-paper relative -rotate-1 rounded-[6px] border border-border bg-surface-raised px-6 pt-7 pb-6 shadow-pop">
            <Paperclip aria-hidden className="absolute -top-4 left-7 size-9 -rotate-[20deg] text-lilac" strokeWidth={1.75} />

            <div className="flex items-start justify-between gap-3 border-b border-dashed border-border pb-4">
              <p className="flex items-center gap-2 font-semibold text-ink"><Icon aria-hidden className="size-4 text-accent" />{sample.title}</p>
              <span className="shrink-0 rounded-pill bg-accent-soft px-2.5 py-0.5 text-xs font-semibold text-on-accent-soft">{sample.tag}</span>
            </div>

            <p className="mt-6 font-display text-[48px] font-semibold leading-none tracking-[-0.04em] text-ink tabular-nums">{sample.figure}</p>
            <p className="mt-1.5 text-sm text-text-muted">{sample.label}</p>

            <dl className="mt-6 text-sm">
              {sample.rows.map(([k, v]) => (
                <div key={k} className="flex items-baseline gap-2 py-1.5">
                  <dt className="text-text-muted">{k}</dt>
                  <span aria-hidden className="mb-1 flex-1 border-b border-dotted border-border-input/50" />
                  <dd className="text-right font-semibold text-ink tabular-nums">{v}</dd>
                </div>
              ))}
            </dl>

            <div className="mt-6 flex items-end justify-between gap-4">
              <p className="max-w-[55%] text-xs text-text-muted">{sample.note}</p>
              <span className={`${stamp ? "anim-stamp " : ""}shrink-0 -rotate-[8deg] rounded-[6px] border-2 border-accent px-2.5 py-1 text-center text-[11px] leading-tight font-bold tracking-[0.12em] text-accent uppercase`}>
                Ejemplo<br />ilustrativo
              </span>
            </div>
          </article>
        </div>
      </div>
    </div>
  );
}
