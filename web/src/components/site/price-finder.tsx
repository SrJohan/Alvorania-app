"use client";
import { useState, type ComponentType } from "react";
import { Check, FileText, Globe, Mail, MessageCirclePlus, RotateCcw } from "lucide-react";
import { LinkButton } from "@/components/ui/button";
import { PillCta } from "@/components/ui/pill-cta";
import { PLANS } from "@/lib/data/plans";
import { formatEuros } from "@/lib/format";

const START = "/acceder?next=/app/conectar";
const fromPrice = formatEuros(Math.min(...PLANS.map((p) => p.priceCents)));

type Option = {
  id: string;
  Icon: ComponentType<{ className?: string }>;
  title: string;
  text: string;
  chip: string;
  detail: { title: string; text: string; price: string; priceNote: string; cta: { label: string; href: string }; extra?: { label: string; href: string } };
};

const options: Option[] = [
  {
    id: "pasadas", Icon: RotateCcw, title: "Pagué de más otros años", text: "Revisamos tus últimos 4 años y reclamamos lo que te corresponda.", chip: "10 € por año + 20 % del ahorro",
    detail: {
      title: "Recupera lo que pagaste de más",
      text: "Un asesor revisa tus declaraciones de los últimos cuatro años. Si encuentra dinero a tu favor, lo reclama por ti. Pagas 10 € por cada año revisado y el 20 % de lo que consigamos ahorrarte.",
      price: "10 € por año", priceNote: "+ 20 % del ahorro conseguido", cta: { label: "Revisar mis años", href: START },
    },
  },
  {
    id: "renta", Icon: FileText, title: "Hacer mi renta", text: "Calcula gratis y decide después si la presentamos.", chip: `Desde ${fromPrice}/año`,
    detail: {
      title: "Tu renta, calculada gratis y revisada por una persona",
      text: "Respondes unas preguntas y ves tu resultado sin pagar y sin tarjeta. Si quieres que la presentemos, un asesor con nombre la revisa y nada sale sin tu visto bueno. El precio es cerrado: lo ves antes de pagar.",
      price: fromPrice, priceNote: "al año, IVA incluido", cta: { label: "Calcular mi renta", href: START }, extra: { label: "Comparar planes", href: "#planes" },
    },
  },
  {
    id: "hacienda", Icon: Mail, title: "Me ha escrito Hacienda", text: "Sube la carta y te explicamos qué piden y cómo responder.", chip: "Análisis gratis · desde 50 €",
    detail: {
      title: "Entiende qué te piden antes de decidir nada",
      text: "Sube la carta y te explicamos gratis qué reclaman y qué plazo tienes. Si prefieres no ocuparte, un asesor redacta y presenta la respuesta.",
      price: "Gratis", priceNote: "el análisis. La respuesta, desde 50 €", cta: { label: "Subir mi carta", href: "/acceder?next=/app/requerimiento" },
    },
  },
  {
    id: "paises", Icon: Globe, title: "Vivo entre países", text: "Residencia fiscal, modelo 720 y otros trámites internacionales.", chip: "A presupuestar",
    detail: {
      title: "Trámites internacionales, caso a caso",
      text: "La residencia fiscal, la salida de España o el modelo 720 dependen de cada situación. Los presupuestamos uno a uno y todavía no se tramitan online.",
      price: "A presupuestar", priceNote: "te lo decimos antes de empezar", cta: { label: "Ver los trámites", href: "/tramites" },
    },
  },
  {
    id: "otra", Icon: MessageCirclePlus, title: "Mi caso es otro", text: "Cuéntanos qué necesitas y vemos si podemos ayudarte.", chip: "Te decimos el precio antes",
    detail: {
      title: "Si no lo ves aquí, lo valoramos",
      text: "Mira la lista de trámites. Si lo que buscas no está, escríbenos y te decimos si podemos hacerlo y cuánto costaría antes de empezar.",
      price: "Sin compromiso", priceNote: "valoramos tu caso primero", cta: { label: "Ver todos los trámites", href: "/tramites" },
    },
  },
];

const stepLabel = "flex items-center gap-3 text-sm font-semibold text-ink";

/** Entrada de la página de precios: eliges tu caso (paso 1) y ves su precio y su siguiente paso (paso 2). */
export function PriceFinder() {
  const [selected, setSelected] = useState("renta");
  const current = options.find((o) => o.id === selected) ?? options[1];
  const d = current.detail;

  return (
    <div>
      <p className={stepLabel}>
        <span aria-hidden className="grid size-7 place-items-center rounded-full bg-ink text-on-ink"><Check className="size-4" /></span>
        Paso 1 de 2 · Cuéntanos tu caso
      </p>
      <h2 id="que-quieres" className="mt-4 font-display text-[28px] font-semibold leading-[1.1] tracking-[-0.04em] text-ink sm:text-[36px]">¿Qué quieres hacer?</h2>

      <fieldset aria-labelledby="que-quieres" className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {options.map(({ id, Icon, title, text, chip }) => (
          <label
            key={id}
            className="group relative flex cursor-pointer flex-col rounded-[20px] border border-border bg-surface-raised p-5 transition-[transform,box-shadow,border-color,background-color] duration-200 ease-brand hover:-translate-y-0.5 hover:border-lilac hover:shadow-pop has-[:checked]:border-accent has-[:checked]:bg-accent-soft has-[:checked]:ring-1 has-[:checked]:ring-accent has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-focus-ring motion-reduce:transform-none"
          >
            <input type="radio" name="caso" value={id} checked={selected === id} onChange={() => setSelected(id)} className="sr-only" />
            <span aria-hidden className="grid size-12 place-items-center rounded-[14px] bg-accent-soft text-accent transition-colors group-has-[:checked]:bg-surface-raised"><Icon className="size-6" /></span>
            <span className="mt-4 text-lg font-semibold leading-6 text-ink">{title}</span>
            <span className="mt-1 mb-5 text-sm leading-5 text-text-muted">{text}</span>
            <span className="mt-auto inline-block self-start rounded-pill bg-accent-soft px-3 py-1 text-xs font-semibold text-on-accent-soft transition-colors group-has-[:checked]:bg-surface-raised">{chip}</span>
          </label>
        ))}
      </fieldset>

      <p className={`${stepLabel} mt-10`}>
        <span aria-hidden className="grid size-7 place-items-center rounded-full bg-accent text-sm font-bold text-on-accent">2</span>
        Paso 2 de 2 · Tu precio y tu siguiente paso
      </p>
      <div aria-live="polite" className="mt-4 grid gap-8 rounded-[24px] bg-surface p-6 sm:p-8 lg:grid-cols-[1.4fr_1fr] lg:items-center">
        <div>
          <h3 className="font-display text-[24px] font-semibold leading-[1.15] tracking-[-0.03em] text-ink sm:text-[30px]">{d.title}</h3>
          <p className="mt-3 max-w-reading text-text-muted">{d.text}</p>
        </div>
        <div className="flex flex-col gap-5 rounded-[20px] bg-surface-raised p-6 shadow-card">
          <div>
            <p className="font-display text-[34px] font-semibold leading-none tracking-[-0.05em] text-ink">{d.price}</p>
            <p className="mt-1 text-sm text-text-muted">{d.priceNote}</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <PillCta href={d.cta.href}>{d.cta.label}</PillCta>
            {d.extra && <LinkButton href={d.extra.href} variant="ghost">{d.extra.label}</LinkButton>}
          </div>
        </div>
      </div>
      <span className="sr-only">Opción elegida: {current.title}</span>
    </div>
  );
}
