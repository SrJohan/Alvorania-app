import Link from "next/link";
import {
  ArrowRight, BadgeCheck, Briefcase, CalendarClock, Calculator, FileText, Globe, Mail, PiggyBank, RotateCcw, ShieldCheck, UserCheck,
} from "lucide-react";
import { Accordion } from "@/components/ui/display";
import { PillCta } from "@/components/ui/pill-cta";

const START = "/acceder?next=/app/conectar";

const situations = [
  { href: START, Icon: FileText, title: "Tengo que hacer la renta", text: "Calcula gratis y decide después." },
  { href: START, Icon: RotateCcw, title: "Creo que pagué de más", text: "Revisamos tus últimos 4 años." },
  { href: "/acceder?next=/app/requerimiento", Icon: Mail, title: "Me ha escrito Hacienda", text: "Te explicamos qué piden y cómo responder." },
  { href: "/asesoria-gestoria", Icon: Briefcase, title: "Soy autónomo", text: "Trimestres y renta con un gestor." },
  { href: START, Icon: PiggyBank, title: "¿Cuánto me devuelven?", text: "Tu resultado en pocos minutos." },
  { href: START, Icon: CalendarClock, title: "Voy fuera de plazo", text: "Presentamos años anteriores." },
  { href: "/tramites", Icon: Globe, title: "Vivo entre países", text: "Residencia fiscal y modelo 720." },
];

const panelIcons = [FileText, Calculator, UserCheck, ShieldCheck];

const steps = [
  { title: "Cuéntanos tu situación", text: "Unas preguntas y tus datos fiscales." },
  { title: "Ves tu resultado gratis", text: "A pagar o a devolver, con las deducciones que aplican." },
  { title: "Un asesor lo revisa", text: "Solo si decides seguir adelante." },
  { title: "Tú das el visto bueno", text: "Nada se presenta sin tu confirmación." },
];

const promises = [
  { Icon: BadgeCheck, title: "Calcular es gratis", text: "Sin tarjeta. Pagas solo si quieres que presentemos." },
  { Icon: UserCheck, title: "Revisa una persona", text: "Un asesor fiscal mira tu declaración antes de presentarla." },
  { Icon: ShieldCheck, title: "Tú decides", text: "Se presenta cuando tú lo apruebas, no antes." },
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

const lift = "transition-[transform,background-color,box-shadow] duration-200 ease-brand hover:-translate-y-0.5 hover:shadow-pop active:translate-y-0 motion-reduce:transform-none";

export default function Home() {
  return (
    <>
      <section className="mx-auto max-w-content px-4 pt-8 md:pt-12">
        <h1 className={`${headline} text-[34px] leading-[1.08] sm:text-[56px] sm:leading-[1.05] lg:text-[72px]`}>
          Tu renta, revisada<br />por un experto.
        </h1>

        <div className="mt-8 inline-flex flex-col gap-4 rounded-[20px] bg-surface-raised p-4 shadow-card">
          <div className="flex items-center gap-3">
            <span aria-hidden className="grid size-11 place-items-center rounded-full bg-accent-soft text-accent"><UserCheck className="size-5" /></span>
            <div>
              <p className="font-semibold text-ink">Tu asesor fiscal</p>
              <p className="text-sm text-text-muted">Revisa tu caso antes de presentarlo</p>
            </div>
          </div>
          <PillCta href={START}>Empezar ahora</PillCta>
        </div>
      </section>

      <section aria-labelledby="situacion" className="mx-auto mt-8 max-w-content px-4">
        <div className="rounded-[24px] p-5 sm:p-8" style={fieldStyle}>
          <div className="flex items-center gap-3">
            <div className="flex -space-x-2" aria-hidden>
              {panelIcons.map((Icon, i) => (
                <span key={i} className="grid size-9 place-items-center rounded-full bg-surface-raised text-ink ring-2 ring-accent-soft"><Icon className="size-4" /></span>
              ))}
            </div>
            <p className="text-sm font-semibold text-ink">Cálculo gratis y revisión humana</p>
          </div>

          <h2 id="situacion" className="mt-5 max-w-3xl text-[22px] font-semibold leading-[1.3] tracking-[-0.02em] text-ink sm:text-[26px]">
            Un asesor lleva tu caso y tú das el visto bueno. ¿Cuál es tu situación?
          </h2>

          <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {situations.map(({ href, Icon, title, text }) => (
              <li key={title}>
                <Link href={href} className={`flex h-full items-start gap-3 rounded-[14px] bg-surface-raised/70 p-3 hover:bg-surface-raised ${lift}`}>
                  <span aria-hidden className="grid size-9 shrink-0 place-items-center rounded-[9px] bg-surface-raised text-ink"><Icon className="size-[18px]" /></span>
                  <span>
                    <span className="block text-sm font-semibold leading-5 text-ink">{title}</span>
                    <span className="mt-0.5 block text-xs leading-4 text-text-muted">{text}</span>
                  </span>
                </Link>
              </li>
            ))}
            <li>
              <Link href="/tramites" className={`group flex h-full min-h-[72px] items-center justify-center gap-2 rounded-[14px] bg-ink/85 p-3 text-sm font-semibold text-on-ink hover:bg-ink ${lift}`}>
                Mi caso no está aquí
                <ArrowRight aria-hidden className="size-4 transition-transform duration-200 group-hover:translate-x-1 motion-reduce:transform-none" />
              </Link>
            </li>
          </ul>
        </div>
        <p className="mt-3 text-sm text-text-muted sm:text-right">Cálculo gratis · Revisión por un asesor · Nada se presenta sin tu confirmación</p>
      </section>

      <section aria-labelledby="como" className="mx-auto mt-24 max-w-content px-4">
        <h2 id="como" className={`${headline} text-[34px] leading-[1.1] sm:text-[44px]`}>Así de simple, de principio a fin.</h2>
        <ol className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((s, i) => (
            <li key={s.title}>
              <span className="font-display text-display font-semibold leading-none tracking-[-0.06em] text-accent/30" aria-hidden>{i + 1}</span>
              <p className="mt-2 text-lg font-semibold text-ink"><span className="sr-only">Paso {i + 1}: </span>{s.title}</p>
              <p className="mt-1 text-text-muted">{s.text}</p>
            </li>
          ))}
        </ol>
      </section>

      <section aria-label="Nuestras promesas" className="mx-auto mt-24 max-w-content px-4">
        <ul className="grid gap-6 md:grid-cols-3">
          {promises.map(({ Icon, title, text }) => (
            <li key={title} className="flex gap-4 rounded-[20px] bg-surface p-6">
              <span className="grid size-12 shrink-0 place-items-center rounded-full bg-highlight text-on-highlight"><Icon className="size-6" aria-hidden /></span>
              <div><p className="text-lg font-semibold text-ink">{title}</p><p className="text-text-muted">{text}</p></div>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="faq" className="mx-auto mt-24 max-w-reading px-4">
        <h2 id="faq" className={`${headline} mb-6 text-[34px] leading-[1.1]`}>Preguntas frecuentes</h2>
        <Accordion items={faq} />
      </section>

      <section className="mx-auto mt-24 max-w-content px-4">
        <div className="flex flex-col items-start justify-between gap-6 rounded-[24px] bg-ink p-8 text-on-ink md:flex-row md:items-center md:p-12">
          <div>
            <h2 className="font-display text-[34px] font-semibold leading-[1.1] tracking-[-0.06em] sm:text-[44px]">Empieza por tu resultado.</h2>
            <p className="mt-2 text-on-ink-muted">Tarda unos minutos y no necesitas tarjeta.</p>
          </div>
          <PillCta href={START} tone="light">Calcular gratis</PillCta>
        </div>
      </section>
    </>
  );
}
