"use client";
import { useEffect, useRef, useState, type ComponentType, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Calculator, Check, FileText, Globe, Mail, MessageCirclePlus, Paperclip, Receipt, RotateCcw } from "lucide-react";
import { LinkButton } from "@/components/ui/button";
import { PillCta } from "@/components/ui/pill-cta";
import { AUTONOMO_PLANS, PLANS } from "@/lib/data/plans";
import { formatEuros } from "@/lib/format";

const START = "/acceder?next=/app/conectar";
const fromPrice = formatEuros(Math.min(...PLANS.map((p) => p.priceCents)));

type Profile = "particular" | "autonomo";
type Detail = {
  title: string; text: string; price: string; priceNote: string;
  cta: { label: string; href: string }; extra?: { label: string; href: string };
  // Si el caso tiene planes, el paso 3 los muestra; `pick` resalta el que encaja.
  plans?: "renta" | "autonomo"; pick?: string;
};
type Option = { id: string; Icon: ComponentType<{ className?: string }>; title: string; text: string; chip: string; detail: Detail };

const profiles: { id: Profile; label: string }[] = [
  { id: "particular", label: "particular" },
  { id: "autonomo", label: "autónomo" },
];

const hacienda: Option = {
  id: "hacienda", Icon: Mail, title: "Me ha escrito Hacienda", text: "Sube la carta y te explicamos qué piden y cómo responder.", chip: "Análisis gratis · desde 50 €",
  detail: {
    title: "Entiende qué te piden antes de decidir nada",
    text: "Sube la carta y te explicamos gratis qué reclaman y qué plazo tienes. Si prefieres no ocuparte, un asesor redacta y presenta la respuesta.",
    price: "Gratis", priceNote: "el análisis. La respuesta, desde 50 €", cta: { label: "Subir mi carta", href: "/acceder?next=/app/requerimiento" },
  },
};
const otra: Option = {
  id: "otra", Icon: MessageCirclePlus, title: "Mi caso es otro", text: "Cuéntanos qué necesitas y vemos si podemos ayudarte.", chip: "Te decimos el precio antes",
  detail: {
    title: "Si no lo ves aquí, lo valoramos",
    text: "Mira la lista de trámites. Si lo que buscas no está, escríbenos y te decimos si podemos hacerlo y cuánto costaría antes de empezar.",
    price: "Sin compromiso", priceNote: "valoramos tu caso primero", cta: { label: "Ver todos los trámites", href: "/tramites" },
  },
};

const options: Record<Profile, Option[]> = {
  particular: [
    {
      id: "renta", Icon: FileText, title: "Hacer mi renta", text: "Calcula gratis y decide después si la presentamos.", chip: `Desde ${fromPrice}/año`,
      detail: {
        title: "Tu renta, calculada gratis y revisada por una persona",
        text: "Respondes unas preguntas y ves tu resultado sin pagar y sin tarjeta. Si quieres que la presentemos, un asesor con nombre la revisa y nada sale sin tu visto bueno.",
        price: fromPrice, priceNote: "al año, IVA incluido", cta: { label: "Calcular mi renta", href: START }, plans: "renta",
      },
    },
    {
      id: "pasadas", Icon: RotateCcw, title: "Pagué de más otros años", text: "Revisamos tus últimos 4 años y reclamamos lo que te corresponda.", chip: "10 € por año + 20 % del ahorro",
      detail: {
        title: "Recupera lo que pagaste de más",
        text: "Un asesor revisa tus declaraciones de los últimos cuatro años. Si encuentra dinero a tu favor, lo reclama por ti. Pagas 10 € por cada año revisado y el 20 % de lo que consigamos ahorrarte.",
        price: "10 € por año", priceNote: "+ 20 % del ahorro conseguido", cta: { label: "Revisar mis años", href: START },
      },
    },
    hacienda,
    {
      id: "paises", Icon: Globe, title: "Vivo entre países", text: "Residencia fiscal, modelo 720 y otros trámites internacionales.", chip: "A presupuestar",
      detail: {
        title: "Trámites internacionales, caso a caso",
        text: "La residencia fiscal, la salida de España o el modelo 720 dependen de cada situación. Los presupuestamos uno a uno y todavía no se tramitan online.",
        price: "A presupuestar", priceNote: "te lo decimos antes de empezar", cta: { label: "Ver los trámites", href: "/tramites" },
      },
    },
    otra,
  ],
  autonomo: [
    {
      id: "trimestres", Icon: Calculator, title: "Llevar mis trimestres", text: "Modelos 130 y 303 cada trimestre y tu declaración anual.", chip: `Desde ${AUTONOMO_PLANS[0].price}/mes`,
      detail: {
        title: "Tus trimestres, revisados por un asesor",
        text: "Preparamos tu pago fraccionado de IRPF y tu IVA cada trimestre, y tu renta del año con la actividad incluida. Te avisamos antes de cada plazo. Compromiso mínimo de 3 meses; después cancelas sin penalización.",
        price: AUTONOMO_PLANS[0].price, priceNote: "al mes, plan Estándar", cta: { label: "Empezar", href: START }, plans: "autonomo", pick: "Estándar",
      },
    },
    {
      id: "contabilidad", Icon: Receipt, title: "Contabilidad y facturación", text: "Libros y facturas al día, con un asesor asignado por chat.", chip: `${AUTONOMO_PLANS[1].price}/mes`,
      detail: {
        title: "Tu contabilidad al día, sin ordenarla tú",
        text: "Todo lo de los trimestres, más libros y facturas al día y un asesor que conoce tu actividad y te responde por chat. Compromiso mínimo de 3 meses; después cancelas sin penalización.",
        price: AUTONOMO_PLANS[1].price, priceNote: "al mes, plan Premium", cta: { label: "Empezar", href: START }, plans: "autonomo", pick: "Premium",
      },
    },
    hacienda,
    otra,
  ],
};

// El mismo campo de color de la portada, con una foto propia de precios fundida a la derecha.
const fieldStyle = {
  backgroundColor: "var(--color-accent-soft)",
  backgroundImage:
    "radial-gradient(at 0% 0%, var(--color-field-a) 0, transparent 55%), radial-gradient(at 100% 10%, var(--color-field-b) 0, transparent 50%), radial-gradient(at 40% 100%, var(--color-field-c) 0, transparent 60%)",
};
const photoFade = {
  maskImage: "linear-gradient(to right, transparent 0%, #000 38%)",
  WebkitMaskImage: "linear-gradient(to right, transparent 0%, #000 38%)",
};

const sentence = "font-display text-[36px] font-semibold leading-[1.15] tracking-[-0.045em] sm:text-[56px]";

// Un paso bloqueado se ve, pero borroso, sin foco y con un aviso de qué falta.
function Locked({ open, message, children }: { open: boolean; message: string; children: ReactNode }) {
  return (
    <div className="relative">
      <div inert={!open} className={`transition-[opacity,filter] duration-[400ms] ease-brand motion-reduce:transition-none ${open ? "opacity-100 blur-[0px]" : "select-none opacity-40 blur-[5px]"}`}>
        {children}
      </div>
      <div className="pointer-events-none absolute inset-0 flex items-start justify-center pt-10">
        <p className={`inline-flex items-center gap-2 rounded-pill bg-ink px-4 py-2 text-sm font-semibold text-on-ink shadow-pop transition-[opacity,translate,visibility] ease-brand motion-reduce:transition-none ${open ? "invisible translate-y-1 opacity-0 duration-150" : "visible translate-y-0 opacity-100 duration-200"}`}>
          <span aria-hidden className="size-2 rounded-full bg-highlight" />
          {message}
        </p>
      </div>
    </div>
  );
}

const stampClass = "anim-stamp inline-block -rotate-[8deg] rounded-[6px] border-2 border-accent px-2.5 py-1 text-center text-[11px] font-bold uppercase leading-tight tracking-[0.12em] text-accent";

// Cada plan es una hoja del expediente; la que encaja va delante, con clip y sello.
function PlanSheet({ name, price, period, blurb, list, on, stamp, tilt, href }: { name: string; price: string; period: string; blurb?: string; list: string[]; on: boolean; stamp: string; tilt: string; href: string }) {
  return (
    <article className={`anim-paper relative flex flex-col rounded-[6px] border border-border bg-surface-raised p-6 ${on ? "z-10 shadow-pop md:-translate-y-3" : `shadow-card ${tilt}`}`}>
      {on && <Paperclip aria-hidden className="absolute -top-4 left-6 size-9 -rotate-[20deg] text-lilac" strokeWidth={1.75} />}
      <div className="flex items-start justify-between gap-3 border-b border-dashed border-border pb-4">
        <h3 className="text-lg font-semibold text-ink">{name}</h3>
        {on && <span className={stampClass}>{stamp}</span>}
      </div>
      <p className="mt-5 font-display text-[40px] font-semibold leading-none tracking-[-0.04em] text-ink tabular-nums">{price}</p>
      <p className="mt-1.5 text-sm text-text-muted">{period}</p>
      {blurb && <p className="mt-4 text-sm text-text">{blurb}</p>}
      <ul className="mt-4 flex-1 space-y-2 text-sm text-text">
        {list.map((f) => <li key={f} className="flex gap-2"><Check aria-hidden className="mt-0.5 size-4 shrink-0 text-accent" />{f}</li>)}
      </ul>
      <div className="mt-6">
        {on ? <PillCta href={href}>Elegir {name}</PillCta> : <LinkButton href={href} variant="secondary" className="w-full">Elegir {name}</LinkButton>}
      </div>
    </article>
  );
}

function Result({ o }: { o: Option }) {
  const d = o.detail;
  if (d.plans) {
    const renta = d.plans === "renta";
    const pick = d.pick ?? PLANS.find((p) => p.recommended)?.name;
    const tilts = ["md:rotate-[-1.5deg]", "md:rotate-[1deg]", "md:rotate-[1.5deg]"];
    return (
      <>
        <h2 className="max-w-3xl font-display text-[30px] font-semibold leading-[1.1] tracking-[-0.04em] text-ink sm:text-[40px] [text-wrap:balance]">{d.title}</h2>
        <p className="mt-4 max-w-reading text-lg text-text-muted">{d.text}{renta && " El precio es cerrado: lo ves antes de pagar."}</p>
        <div className={`mt-12 grid gap-6 md:gap-4 ${renta ? "md:grid-cols-3" : "md:max-w-3xl md:grid-cols-2"}`}>
          {renta
            ? PLANS.map((p, i) => <PlanSheet key={p.code} name={p.name} price={formatEuros(p.priceCents)} period="al año, IVA incluido" blurb={p.blurb} list={p.features} on={p.name === pick} stamp="Recomendado" tilt={tilts[i]} href={START} />)
            : AUTONOMO_PLANS.map((p, i) => <PlanSheet key={p.name} name={p.name} price={p.price} period="al mes, IVA incluido" list={p.list} on={p.name === pick} stamp="Encaja contigo" tilt={tilts[i]} href={d.cta.href} />)}
        </div>
        <p className="mt-8 text-sm text-text-muted">
          {renta
            ? <>Calcular es gratis: eliges plan solo si quieres que presentemos tu renta. <a href="#comparativa" className="font-semibold text-accent hover:text-accent-hover">Comparar planes</a></>
            : <>Compromiso mínimo de 3 meses. <Link href="/asesoria-gestoria" className="font-semibold text-accent hover:text-accent-hover">Ver el servicio para autónomos</Link></>}
        </p>
      </>
    );
  }
  return (
    <div className="grid gap-12 lg:grid-cols-[1fr_400px] lg:items-center lg:gap-16">
      <div>
        <h2 className="font-display text-[30px] font-semibold leading-[1.1] tracking-[-0.04em] text-ink sm:text-[40px] [text-wrap:balance]">{d.title}</h2>
        <p className="mt-4 max-w-reading text-lg text-text-muted">{d.text}</p>
        <div className="mt-8 flex flex-wrap items-center gap-3">
          <PillCta href={d.cta.href}>{d.cta.label}</PillCta>
          {d.extra && <LinkButton href={d.extra.href} variant="ghost">{d.extra.label}</LinkButton>}
        </div>
      </div>
      <article aria-label={`Precio: ${o.title}`} className="anim-paper relative -rotate-1 rounded-[6px] border border-border bg-surface-raised px-6 pt-7 pb-6 shadow-pop">
        <Paperclip aria-hidden className="absolute -top-4 left-7 size-9 -rotate-[20deg] text-lilac" strokeWidth={1.75} />
        <p className="flex items-center gap-2 border-b border-dashed border-border pb-4 font-semibold text-ink"><o.Icon className="size-4 text-accent" />{o.title}</p>
        <p className="mt-6 font-display text-[44px] font-semibold leading-none tracking-[-0.04em] text-ink">{d.price}</p>
        <p className="mt-1.5 text-sm text-text-muted">{d.priceNote}</p>
        <div className="mt-8 flex justify-end"><span className={stampClass}>Sin sorpresas</span></div>
      </article>
    </div>
  );
}

/** Precios como una frase que se completa: "Soy particular", "¿Qué necesitas?" y el precio en una hoja del expediente. Cada parte se desbloquea con la anterior. */
export function PriceFinder({ intro, notice }: { intro: ReactNode; notice?: ReactNode }) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [choice, setChoice] = useState<string | null>(null);
  const step2 = useRef<HTMLElement>(null);
  const step3 = useRef<HTMLElement>(null);
  // Solo baja la página cuando se elige con el ratón o el dedo: con las flechas del teclado, cada pulsación movería la vista.
  const byPointer = useRef(false);
  const list = options[profile ?? "particular"];
  const current = list.find((o) => o.id === choice) ?? list[0];

  useEffect(() => {
    const target = choice ? step3.current : profile ? step2.current : null;
    if (!target || !byPointer.current) return;
    byPointer.current = false;
    target.scrollIntoView({ block: "start", behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  }, [profile, choice]);

  const pointer = () => { byPointer.current = true; };

  return (
    <div>
      <section aria-label="Quién eres" className="relative overflow-hidden rounded-[32px] md:min-h-[480px]" style={fieldStyle}>
        <div aria-hidden className="absolute inset-y-0 right-0 hidden w-[62%] md:block" style={photoFade}>
          <Image src="/home/precios-autonomo.webp" alt="" fill sizes="62vw" loading="eager" className="object-cover object-[80%_40%]" />
        </div>
        <div className="relative z-10 flex flex-col gap-8 p-6 sm:p-12 md:max-w-[56%]">
          <div>{intro}</div>
          <div className="rounded-[24px] bg-surface-raised p-5 shadow-pop sm:p-6">
            <fieldset aria-label="¿Quién eres?" className="flex flex-wrap items-center gap-x-3 gap-y-3">
              <span aria-hidden className="mr-1 font-display text-[28px] font-semibold tracking-[-0.04em] text-ink sm:text-[34px]">Soy</span>
              {profiles.map(({ id, label }) => (
                <label
                  key={id}
                  onPointerDown={pointer}
                  className="group inline-flex cursor-pointer items-center gap-2 rounded-pill border border-border-input bg-surface-raised px-5 py-1.5 font-display text-[24px] font-semibold tracking-[-0.04em] text-ink transition-[background-color,border-color,color,translate] duration-200 ease-brand hover:-translate-y-0.5 hover:border-accent has-[:checked]:border-ink has-[:checked]:bg-ink has-[:checked]:text-on-ink has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-focus-ring motion-reduce:transform-none sm:text-[28px]"
                >
                  <input type="radio" name="perfil" value={id} checked={profile === id} onChange={() => { setProfile(id); setChoice(null); }} className="sr-only" />
                  {label}
                  <Check aria-hidden strokeWidth={3} className="hidden size-5 text-highlight group-has-[:checked]:block" />
                </label>
              ))}
            </fieldset>
            <p className="mt-4 text-sm text-text-muted">¿Tienes una empresa? <Link href="/empresas" className="group inline-flex items-center gap-1 font-semibold text-accent hover:text-accent-hover">Mira los planes para empresas<ArrowRight aria-hidden className="size-3.5 transition-transform duration-200 group-hover:translate-x-0.5 motion-reduce:transform-none" /></Link></p>
          </div>
        </div>
      </section>
      {notice &&<div className="mt-4 max-w-reading">{notice}</div>}

      <section ref={step2} aria-labelledby="necesitas" className="mt-20 scroll-mt-24">
        <h2 id="necesitas" className={`${sentence} ${profile ? "text-ink" : "text-text-muted"}`}>¿Qué necesitas?</h2>
        <div className="mt-8">
          <Locked open={!!profile} message="Primero dinos quién eres">
            <fieldset key={profile ?? "none"} aria-labelledby="necesitas" className="anim-swap flex flex-wrap gap-3">
              {list.map(({ id, Icon, title, chip }) => (
                <label
                  key={id}
                  onPointerDown={pointer}
                  className="group inline-flex cursor-pointer items-center gap-3 rounded-pill border border-border bg-surface-raised py-2.5 pr-5 pl-2.5 text-ink shadow-card transition-[background-color,border-color,color,translate,box-shadow] duration-200 ease-brand hover:-translate-y-0.5 hover:border-lilac hover:shadow-pop has-[:checked]:border-ink has-[:checked]:bg-ink has-[:checked]:text-on-ink has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-focus-ring motion-reduce:transform-none"
                >
                  <input type="radio" name="caso" value={id} checked={choice === id} onChange={() => setChoice(id)} className="sr-only" />
                  <span aria-hidden className="grid size-10 shrink-0 place-items-center rounded-full bg-accent-soft text-accent transition-colors group-has-[:checked]:bg-highlight group-has-[:checked]:text-on-highlight"><Icon className="size-5" /></span>
                  <span className="flex flex-col">
                    <span className="text-base font-semibold sm:text-lg">{title}</span>
                    <span className="text-xs text-text-muted transition-colors group-has-[:checked]:text-on-ink-muted">{chip}</span>
                  </span>
                </label>
              ))}
            </fieldset>
          </Locked>
        </div>
      </section>

      <section ref={step3} aria-label="Tu precio" className="mt-24 scroll-mt-24">
        <Locked open={!!choice} message={profile ? "Elige qué necesitas para ver tu precio" : "Completa la frase para ver tu precio"}>
          <div key={current.id} className="anim-quick"><Result o={current} /></div>
        </Locked>
      </section>

      <p role="status" className="sr-only">
        {choice ? `${current.title}: precio desbloqueado.` : profile ? `Perfil ${profile === "particular" ? "particular" : "autónomo"}. Elige qué necesitas.` : ""}
      </p>
    </div>
  );
}
