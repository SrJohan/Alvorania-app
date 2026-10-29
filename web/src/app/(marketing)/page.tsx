import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight, BadgeCheck, Briefcase, CalendarClock, Calculator, FileText, Globe, Mail, PiggyBank, RotateCcw, ShieldCheck, UserCheck,
} from "lucide-react";
import { Accordion } from "@/components/ui/display";
import { PillCta } from "@/components/ui/pill-cta";
import { LateralTransition } from "@/components/site/directional-transition";
import { ServicesPanel } from "@/components/site/services-panel";

const START = "/acceder?next=/app/conectar";

const situations = [
  { href: START, Icon: FileText, title: "La renta de este año", text: "Mira lo que te sale antes de decidir nada." },
  { href: START, Icon: RotateCcw, title: "Revisar años anteriores", text: "Si te tocaba devolución, la reclamamos." },
  { href: "/acceder?next=/app/requerimiento", Icon: Mail, title: "Una carta de Hacienda", text: "Súbela y te decimos qué piden y qué plazo tienes." },
  { href: "/asesoria-gestoria", Icon: Briefcase, title: "Trabajo por mi cuenta", text: "Trimestres, IVA y renta, al día." },
  { href: START, Icon: PiggyBank, title: "Solo quiero saber cuánto me sale", text: "Gratis y sin tarjeta." },
  { href: START, Icon: CalendarClock, title: "Se me pasó el plazo", text: "La presentamos y te explicamos el recargo." },
  { href: "/tramites", Icon: Globe, title: "Mi vida está entre dos países", text: "Residencia fiscal y bienes fuera." },
];

const panelIcons = [FileText, Calculator, UserCheck, ShieldCheck];

const steps = [
  { title: "Nos cuentas", text: "Unas preguntas sencillas y tus datos fiscales." },
  { title: "Lo ves", text: "Lo que te sale, con cada deducción explicada. Gratis." },
  { title: "Lo revisamos", text: "Tu gestor lo mira con calma y te pregunta si falta algo." },
  { title: "Tú decides", text: "Se presenta cuando tú lo apruebas. Ni un minuto antes." },
];

const promises = [
  { Icon: BadgeCheck, title: "Gratis hasta que decidas", text: "Calcular no cuesta nada ni pide tarjeta." },
  { Icon: UserCheck, title: "Una persona, no un robot", text: "Tu gestor tiene nombre y te responde él." },
  { Icon: ShieldCheck, title: "Precio cerrado", text: "Lo ves antes de pagar y no cambia." },
];

const faq = [
  { q: "¿Tengo que pagar para ver mi resultado?", a: "No. El cálculo es gratis y no pide tarjeta. Pagas solo si decides que lo presente un asesor." },
  { q: "¿Quién revisa mi declaración?", a: "Un asesor fiscal de nuestro equipo. Nada se presenta sin su revisión y sin tu confirmación." },
  { q: "¿Qué datos necesitáis?", a: "Tus datos fiscales del ejercicio y unas preguntas sobre tu situación: hijos, hipoteca, aportaciones y donativos." },
  { q: "¿Y si vivo en el País Vasco o Navarra?", a: "Por ahora no trabajamos con declaraciones del País Vasco ni de Navarra: tienen su propio régimen fiscal y aún no podemos llevarlas. Si tu residencia fiscal está en otra comunidad, sí podemos ayudarte." },
];

const headline = "font-display font-semibold tracking-[-0.06em] text-ink";

// Campo de color del panel: tres tonos propios superpuestos sobre el lila de la marca. Solo tokens.
const fieldStyle = {
  backgroundColor: "var(--color-accent-soft)",
  backgroundImage:
    "radial-gradient(at 0% 0%, var(--color-field-a) 0, transparent 55%), radial-gradient(at 100% 10%, var(--color-field-b) 0, transparent 50%), radial-gradient(at 40% 100%, var(--color-field-c) 0, transparent 60%)",
};

// Fondo de la portada: el degradado blanco a lila de la maqueta, que se funde con el blanco al bajar.
const heroWash = {
  backgroundImage:
    "linear-gradient(to bottom, transparent 55%, var(--color-bg) 100%), radial-gradient(at 85% 20%, var(--color-field-a) 0, transparent 45%), linear-gradient(122deg, var(--color-bg) 0%, var(--color-surface) 48%, var(--color-field-c) 100%)",
};

// Bloque final en morado profundo con un brillo violeta en la esquina.
const inkGlow = {
  backgroundImage: "radial-gradient(at 100% 0%, var(--color-bright) 0, transparent 55%), radial-gradient(at 0% 100%, var(--color-ink-raised) 0, transparent 60%)",
};

// La foto del hero ya trae el lila a la izquierda; aquí solo se disuelve arriba y abajo en el degradado de la página.
const photoFade = {
  maskImage: "linear-gradient(to bottom, transparent 0%, #000 14%, #000 62%, transparent 100%)",
  WebkitMaskImage: "linear-gradient(to bottom, transparent 0%, #000 14%, #000 62%, transparent 100%)",
};

// En el bloque final la foto entra desde la derecha y se funde con el morado; el tramo cubre el lila claro de la propia foto.
const inkFade = {
  maskImage: "linear-gradient(to right, transparent 0%, #000 34%)",
  WebkitMaskImage: "linear-gradient(to right, transparent 0%, #000 34%)",
};

const lift = "transition-[transform,translate,scale,rotate,background-color,box-shadow] duration-200 ease-brand hover:-translate-y-0.5 hover:shadow-pop active:translate-y-0 motion-reduce:transform-none";

export default function Home() {
  return (
    <LateralTransition><div>
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[900px]" style={heroWash} />
      {/* Sin `relative` a propósito: en xl la foto se ancla al contenedor de la página y ocupa todo el ancho. */}
      <section className="mx-auto flex max-w-wide flex-col px-4 pt-8 md:pt-12 xl:min-h-[480px] xl:flex-row xl:items-start xl:justify-between xl:pt-6">
        <h1 className={`${headline} relative z-10 text-[34px] leading-[1.08] sm:text-[56px] sm:leading-[1.05] lg:text-[72px]`}>
          Tu renta,<br />a la vista.
        </h1>

        <div aria-hidden className="relative -mx-4 mt-6 h-[320px] sm:h-[420px] xl:absolute xl:inset-x-0 xl:top-0 xl:mx-0 xl:mt-0 xl:h-[660px]" style={photoFade}>
          <Image src="/home/revisando-papeles.webp" alt="" fill sizes="100vw" loading="eager" fetchPriority="high" className="object-cover object-[78%_40%]" />
        </div>

        <div className="relative z-10 -mt-20 inline-flex flex-col gap-4 self-start rounded-[20px] border border-border bg-surface-raised p-4 shadow-pop xl:mt-[330px]">
          <div className="flex items-center gap-3">
            <span aria-hidden className="grid size-11 place-items-center rounded-full bg-accent-soft text-accent"><UserCheck className="size-5" /></span>
            <div>
              <p className="font-semibold text-ink">Tu gestor, con nombre</p>
              <p className="text-sm text-text-muted">Lleva tu renta este año y el que viene</p>
            </div>
          </div>
          <PillCta href={START}>Ver mi resultado gratis</PillCta>
        </div>
      </section>

      <section aria-labelledby="situacion" className="relative mx-auto mt-8 max-w-wide px-4">
        <div className="rounded-[24px] p-5 sm:p-8" style={fieldStyle}>
          <div className="flex items-center gap-3">
            <div className="flex -space-x-2" aria-hidden>
              {panelIcons.map((Icon, i) => (
                <span key={i} className="grid size-9 place-items-center rounded-full bg-surface-raised text-accent ring-2 ring-accent-soft"><Icon className="size-4" /></span>
              ))}
            </div>
            <p className="text-sm font-semibold text-ink">Gratis hasta que decidas</p>
          </div>

          <h2 id="situacion" className="mt-5 max-w-3xl text-[22px] font-semibold leading-[1.3] tracking-[-0.02em] text-ink sm:text-[26px]">
            ¿Qué te trae por aquí?
          </h2>

          <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {situations.map(({ href, Icon, title, text }) => (
              <li key={title}>
                <Link href={href} className={`flex h-full items-start gap-3 rounded-[14px] bg-surface-raised/70 p-3 hover:bg-surface-raised ${lift}`}>
                  <span aria-hidden className="grid size-9 shrink-0 place-items-center rounded-[9px] bg-accent-soft text-accent"><Icon className="size-[18px]" /></span>
                  <span>
                    <span className="block text-sm font-semibold leading-5 text-ink">{title}</span>
                    <span className="mt-0.5 block text-xs leading-4 text-text-muted">{text}</span>
                  </span>
                </Link>
              </li>
            ))}
            <li>
              <Link href="/tramites" className={`group flex h-full min-h-[72px] items-center justify-center gap-2 rounded-[14px] bg-accent p-3 text-sm font-semibold text-on-accent hover:bg-accent-hover ${lift}`}>
                Lo mío es otra cosa
                <ArrowRight aria-hidden className="size-4 transition-transform duration-200 group-hover:translate-x-1 motion-reduce:transform-none" />
              </Link>
            </li>
          </ul>
        </div>
        {/* Pendiente de Andrés: sustituir por datos propios verificables (año de la gestoría, colegiación, Colaborador Social si se tiene). */}
        <p className="mt-3 text-sm text-text-muted sm:text-right">Una gestoría de verdad detrás · El mismo gestor cada año · Precio cerrado</p>
      </section>

      <section aria-labelledby="servicios" className="mx-auto mt-24 max-w-wide px-4">
        <h2 id="servicios" className={`${headline} mb-8 max-w-2xl text-[34px] leading-[1.1] sm:text-[44px]`}>Cada trámite, de principio a fin.</h2>
        <ServicesPanel />
      </section>

      <section aria-labelledby="como" className="mx-auto mt-24 max-w-wide px-4">
        <h2 id="como" className={`${headline} text-[34px] leading-[1.1] sm:text-[44px]`}>Así trabajamos.</h2>
        <ol className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((s, i) => (
            <li key={s.title}>
              <span className="font-display text-display font-semibold leading-none tracking-[-0.06em] text-lilac" aria-hidden>{i + 1}</span>
              <p className="mt-2 text-lg font-semibold text-ink"><span className="sr-only">Paso {i + 1}: </span>{s.title}</p>
              <p className="mt-1 text-text-muted">{s.text}</p>
            </li>
          ))}
        </ol>
      </section>

      <section aria-label="Nuestras promesas" className="mx-auto mt-24 max-w-wide px-4">
        <ul className="grid gap-6 md:grid-cols-3">
          {promises.map(({ Icon, title, text }) => (
            <li key={title} className="flex gap-4 rounded-[20px] border border-border bg-surface p-6">
              <span className="grid size-12 shrink-0 place-items-center rounded-full bg-accent text-on-accent"><Icon className="size-6" aria-hidden /></span>
              <div><p className="text-lg font-semibold text-ink">{title}</p><p className="text-text-muted">{text}</p></div>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="faq" className="mx-auto mt-24 max-w-reading px-4">
        <h2 id="faq" className={`${headline} mb-6 text-[34px] leading-[1.1]`}>Preguntas frecuentes</h2>
        <Accordion items={faq} />
      </section>

      <section className="mx-auto mt-24 max-w-wide px-4">
        <div className="relative overflow-hidden rounded-[24px] bg-ink text-on-ink md:min-h-[420px]" style={inkGlow}>
          <div aria-hidden className="relative h-[240px] md:absolute md:inset-y-0 md:right-0 md:h-auto md:w-1/2" style={inkFade}>
            <Image src="/home/sofa-tablet.webp" alt="" fill sizes="(min-width: 768px) 50vw, 100vw" className="object-cover object-[100%_50%]" />
          </div>
          <div className="relative flex flex-col items-start gap-6 p-8 md:min-h-[420px] md:max-w-[52%] md:justify-center md:p-12">
            <div>
              <h2 className="font-display text-[34px] font-semibold leading-[1.1] tracking-[-0.06em] sm:text-[44px]">Haz la luz sobre tu renta.</h2>
              <p className="mt-2 text-on-ink-muted">Son unos minutos y no necesitas tarjeta.</p>
            </div>
            <PillCta href={START} tone="light">Calcular gratis</PillCta>
          </div>
        </div>
      </section>
    </div></LateralTransition>
  );
}
