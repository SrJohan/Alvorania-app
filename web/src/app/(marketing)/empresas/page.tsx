import type { Metadata } from "next";
import { ArrowRight, Briefcase, Check, FileText, HeartHandshake, Mail, RotateCcw, Users } from "lucide-react";
import { LinkButton } from "@/components/ui/button";
import { Accordion, Card } from "@/components/ui/display";
import { PillCta } from "@/components/ui/pill-cta";
import { Reveal } from "@/components/ui/reveal";
import { LateralTransition } from "@/components/site/directional-transition";
import { BarraContratar } from "@/components/site/autonomos-live";
import { HeroDemo } from "@/components/site/empresas-live";

export const metadata: Metadata = { title: "Empresas" };

const DEMO = "#demo";

const facts = [
  ["Sin integraciones", "cada persona se da de alta con un enlace"],
  ["Revisión humana", "un asesor mira cada declaración"],
  ["Datos privados", "la empresa solo ve el uso, nunca los datos fiscales"],
];

const solutions = [
  {
    Icon: Users, plan: "Equipo", title: "Un beneficio para tu equipo",
    text: "Tus empleados hacen la renta con un asesor que la revisa antes de presentarla. Una preocupación menos cada primavera.",
    list: ["Renta revisada por un asesor", "Años anteriores y cartas de Hacienda", "Alta en minutos con un enlace"],
  },
  {
    Icon: HeartHandshake, plan: "Clientes", title: "Un servicio para tus clientes",
    text: "Suma la declaración de la renta a tu programa de fidelización y da a tus clientes una razón más para quedarse.",
    list: ["Acceso con tu marca en la invitación", "Condiciones propias para tus clientes", "Informe de uso de la campaña"],
  },
];

const services = [
  { Icon: FileText, title: "Su renta, revisada", text: "Calculan gratis y un asesor la revisa antes de presentarla." },
  { Icon: RotateCcw, title: "Años anteriores", text: "Revisamos sus últimos 4 años por si pagaron de más." },
  { Icon: Mail, title: "Cartas de Hacienda", text: "Les explicamos qué piden y cómo responder." },
  { Icon: Briefcase, title: "Si son autónomos", text: "Trimestres y renta con un asesor que conoce su actividad." },
];

const steps = [
  { title: "Nos cuentas tu equipo", text: "Cuántas personas y qué quieres cubrir." },
  { title: "Te damos un enlace", text: "Lo compartes por correo o en tu intranet." },
  { title: "Cada persona hace su renta", text: "Con un asesor que la revisa, como cualquier cliente." },
  { title: "Ves el uso de la campaña", text: "Altas y declaraciones presentadas, sin datos personales." },
];

const plans = [
  {
    name: "Equipo", blurb: "Para ofrecerlo como beneficio a tus empleados.",
    list: ["Renta revisada por un asesor", "Años anteriores y cartas de Hacienda", "Informe de uso de la campaña"],
  },
  {
    name: "Clientes", blurb: "Para incluirlo en tu programa de fidelización.", rec: true,
    list: ["Todo lo de Equipo", "Invitación con tu marca", "Condiciones a medida para tus clientes"],
  },
];

const faq = [
  { q: "¿La empresa ve los datos fiscales de sus empleados?", a: "No. La empresa solo ve cuántas personas se han dado de alta y cuántas declaraciones se han presentado. Los datos fiscales son de cada persona." },
  { q: "¿Hace falta integrar algo?", a: "No. Te damos un enlace de alta y lo compartes por el canal que ya usas con tu equipo o tus clientes." },
  { q: "¿Cuánto cuesta?", a: "Depende del número de personas y de lo que quieras cubrir. Te enviamos una propuesta cerrada antes de empezar." },
  { q: "¿Cómo se añaden más personas?", a: "Nos lo dices y ampliamos el acceso. No tienes que volver a configurar nada." },
  { q: "¿Y si alguien vive en el País Vasco o Navarra?", a: "Por ahora no trabajamos con declaraciones del País Vasco ni de Navarra: tienen su propio régimen fiscal." },
];

const headline = "font-display font-semibold tracking-[-0.06em] text-ink";
const lift = "transition-[transform,translate,scale,rotate,box-shadow] duration-200 ease-brand hover:-translate-y-1 hover:shadow-pop motion-reduce:transform-none";

// Mismos fondos que la portada: campo lila con tres tonos y bloque final en morado con brillo.
const fieldStyle = {
  backgroundColor: "var(--color-accent-soft)",
  backgroundImage:
    "radial-gradient(at 0% 0%, var(--color-field-a) 0, transparent 55%), radial-gradient(at 100% 10%, var(--color-field-b) 0, transparent 50%), radial-gradient(at 40% 100%, var(--color-field-c) 0, transparent 60%)",
};
const heroWash = {
  backgroundImage:
    "linear-gradient(to bottom, transparent 55%, var(--color-bg) 100%), radial-gradient(at 85% 20%, var(--color-field-a) 0, transparent 45%), linear-gradient(122deg, var(--color-bg) 0%, var(--color-surface) 48%, var(--color-field-c) 100%)",
};
const inkGlow = {
  backgroundImage: "radial-gradient(at 100% 0%, var(--color-bright) 0, transparent 55%), radial-gradient(at 0% 100%, var(--color-ink-raised) 0, transparent 60%)",
};

export default function Empresas() {
  return (
    <LateralTransition><div>
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[900px]" style={heroWash} />
      <div className="mx-auto max-w-wide px-4 py-12">
        <HeroDemo>
          <div>
            <h1 className={`${headline} text-[34px] leading-[1.08] sm:text-[56px] sm:leading-[1.05] lg:text-[72px]`}>La renta de tu equipo, revisada por un experto.</h1>
            <p className="mt-3 max-w-reading text-lg text-text-muted">Ofrece a tus empleados o a tus clientes un asesor fiscal que revisa su declaración. Tú no gestionas nada.</p>
            <dl className="mt-8 grid gap-4 sm:grid-cols-3">
              {facts.map(([k, v]) => (
                <div key={k}>
                  <dt className="font-display text-xl font-semibold tracking-[-0.03em] text-ink">{k}</dt>
                  <dd className="mt-1 text-sm text-text-muted">{v}</dd>
                </div>
              ))}
            </dl>
            <div id="hero-cta" className="mt-8 flex flex-wrap items-center gap-3">
              <PillCta href={DEMO}>Solicitar una demo</PillCta>
              <LinkButton href="#soluciones" variant="ghost">Ver soluciones</LinkButton>
            </div>
          </div>

        </HeroDemo>

        <section aria-labelledby="soluciones" className="mt-24 scroll-mt-24">
          <h2 id="soluciones" className={`${headline} max-w-2xl text-[34px] leading-[1.1] sm:text-[44px]`}>Dos formas de ofrecerlo.</h2>
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {solutions.map(({ Icon, plan, title, text, list }, i) => (
              <Reveal key={title} delay={i * 60} className="flex">
                <div className={`flex w-full flex-col rounded-[24px] p-6 sm:p-8 ${i === 0 ? "" : "border border-border bg-surface"}`} style={i === 0 ? fieldStyle : undefined}>
                  <span aria-hidden className="grid size-12 place-items-center rounded-full bg-accent text-on-accent"><Icon className="size-6" /></span>
                  <h3 className="mt-5 text-[22px] font-semibold leading-[1.3] tracking-[-0.02em] text-ink sm:text-[26px]">{title}</h3>
                  <p className="mt-2 max-w-reading text-text-muted">{text}</p>
                  <ul className="mt-5 space-y-2">
                    {list.map((l) => <li key={l} className="flex gap-2 text-ink"><Check aria-hidden className="mt-1 size-4 shrink-0 text-accent" />{l}</li>)}
                  </ul>
                  <a href={`#plan-${plan.toLowerCase()}`} className="group mt-6 inline-flex items-center gap-2 self-start font-semibold text-accent hover:text-accent-hover">
                    Ver el plan {plan}
                    <ArrowRight aria-hidden className="size-4 transition-transform duration-200 group-hover:translate-x-1 motion-reduce:transform-none" />
                  </a>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        <section aria-labelledby="reciben" className="mt-24">
          <h2 id="reciben" className={`${headline} text-[34px] leading-[1.1] sm:text-[44px]`}>Lo que reciben</h2>
          <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {services.map(({ Icon, title, text }) => (
              <li key={title} className="flex gap-4 rounded-[20px] border border-border bg-surface p-6">
                <span aria-hidden className="grid size-12 shrink-0 place-items-center rounded-full bg-accent text-on-accent"><Icon className="size-6" /></span>
                <div><p className="text-lg font-semibold text-ink">{title}</p><p className="mt-1 text-text-muted">{text}</p></div>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="como" className="mt-24 scroll-mt-24">
          <h2 id="como" className={`${headline} text-[34px] leading-[1.1] sm:text-[44px]`}>Así de simple, de principio a fin.</h2>
          <ol className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((s, i) => (
              <li key={s.title}>
                <Reveal delay={i * 100} className="group">
                  <div className="h-0.5 bg-border">
                    <div className="h-full origin-left bg-accent transition-[scale] duration-500 ease-brand [transition-delay:var(--d)] motion-reduce:transition-none group-data-[reveal=hidden]:scale-x-0" />
                  </div>
                  <span className="mt-6 block font-display text-display font-semibold leading-none tracking-[-0.06em] text-accent transition-colors duration-500 [transition-delay:var(--d)] group-data-[reveal=hidden]:text-lilac" aria-hidden>{i + 1}</span>
                  <p className="mt-2 text-lg font-semibold text-ink"><span className="sr-only">Paso {i + 1}: </span>{s.title}</p>
                  <p className="mt-1 text-text-muted">{s.text}</p>
                </Reveal>
              </li>
            ))}
          </ol>
        </section>

        <section aria-labelledby="planes" className="mt-24 scroll-mt-24">
          <h2 id="planes" className={`${headline} text-[34px] leading-[1.1] sm:text-[44px]`}>Planes a medida</h2>
          <p className="mt-3 max-w-reading text-text-muted">El precio depende del número de personas y de lo que quieras cubrir. Te enviamos una propuesta cerrada antes de empezar.</p>
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {plans.map((p) => (
              <div key={p.name} id={`plan-${p.name.toLowerCase()}`} className="anim-target flex scroll-mt-24 rounded-lg">
                <Card selected={p.rec} className={`flex w-full flex-col ${lift}`}>
                  <h3 className="text-lg font-semibold">{p.name}</h3>
                  <p className="mt-3 text-xl font-bold">A presupuestar</p>
                  <p className="mt-2 text-sm text-text-muted">{p.blurb}</p>
                  <ul className="mt-4 flex-1 space-y-1 text-sm">{p.list.map((l) => <li key={l} className="flex gap-2"><Check aria-hidden className="mt-0.5 size-4 shrink-0 text-accent" />{l}</li>)}</ul>
                  <div className="mt-6"><LinkButton href={DEMO} variant={p.rec ? "primary" : "secondary"}>Pedir propuesta</LinkButton></div>
                </Card>
              </div>
            ))}
          </div>
        </section>

        <section aria-labelledby="faq" className="mt-24 max-w-reading">
          <h2 id="faq" className={`${headline} mb-6 text-[34px] leading-[1.1]`}>Preguntas frecuentes</h2>
          <Accordion items={faq} />
        </section>

        <section id="cierre" aria-labelledby="cierre-titulo" className="mt-24">
          <Reveal>
          <div className="flex flex-col items-start justify-between gap-6 rounded-[24px] bg-ink p-8 text-on-ink md:flex-row md:items-center md:p-12" style={inkGlow}>
            <div>
              <h2 id="cierre-titulo" className="font-display text-[34px] font-semibold leading-[1.1] tracking-[-0.06em] sm:text-[44px]">Te lo enseñamos con tu caso.</h2>
              <p className="mt-2 max-w-reading text-on-ink-muted">Cuéntanos quién eres y cuántas personas hay en tu equipo, y preparamos la demo a tu medida.</p>
            </div>
            <PillCta href={DEMO} tone="light">Solicitar una demo</PillCta>
          </div>
          </Reveal>
        </section>
        <BarraContratar href={DEMO} label="Solicitar una demo" endId="cierre" />
      </div>
    </div></LateralTransition>
  );
}
