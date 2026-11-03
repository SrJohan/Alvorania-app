import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Briefcase, Check, FileText, Mail, RotateCcw } from "lucide-react";
import { LinkButton } from "@/components/ui/button";
import { Accordion } from "@/components/ui/display";
import { PillCta } from "@/components/ui/pill-cta";
import { Reveal } from "@/components/ui/reveal";
import { DirectionalTransition } from "@/components/site/directional-transition";
import { BarraContratar } from "@/components/site/autonomos-live";
import { HeroDemo } from "@/components/site/empresas-live";

export const metadata: Metadata = { title: "Empresas" };

const DEMO = "#demo";
const PLANES = "/empresas/planes";
const FORWARD = ["nav-forward"];

const facts = [
  ["Sin integraciones", "cada persona se da de alta con un enlace"],
  ["Revisión humana", "un asesor mira cada declaración"],
  ["Datos privados", "la empresa solo ve el uso, nunca los datos fiscales"],
];

// Los dos caminos de la página: quien llega elige primero a quién se lo ofrece.
const paths = [
  {
    id: "equipo", who: "Para tu equipo", title: "Un beneficio que se nota cada primavera.",
    text: "Tus empleados hacen la renta con un asesor que la revisa antes de presentarla. Tú compartes un enlace y te olvidas.",
    list: ["Renta revisada por un asesor", "Años anteriores y cartas de Hacienda", "Alta en minutos con un enlace"],
    photo: "/home/equipo-oficina.webp", crop: "object-cover object-[78%_40%]", frame: "aspect-[4/3] md:aspect-auto md:h-full",
  },
  {
    id: "clientes", who: "Para tus clientes", title: "Una razón más para quedarse contigo.",
    text: "Suma la declaración de la renta a tu programa de fidelización. Tus clientes la hacen con tu marca en la invitación.",
    list: ["Invitación con tu marca", "Condiciones propias para tus clientes", "Informe de uso de la campaña"],
    // Ventana cuadrada como la foto, para que el móvil se vea entero sin recortes.
    photo: "/home/movil-deducciones.webp", crop: "object-cover", frame: "aspect-square md:h-full md:w-auto",
  },
];

const reasons = [
  { title: "Nada que integrar", text: "Ni sistemas, ni ficheros de empleados. Un enlace por el canal que ya usas." },
  { title: "Cero trabajo para tu equipo de personas", text: "Las dudas fiscales las resuelve el asesor, no tu departamento." },
  { title: "Con tu nombre delante", text: "La invitación lleva tu marca, para que se vea quién lo ofrece." },
  { title: "Sabes cómo va la campaña", text: "Altas y declaraciones presentadas, sin un solo dato personal." },
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

const tiers = [
  { size: "Hasta 50", unit: "personas", name: "Equipo pequeño" },
  { size: "51 a 500", unit: "personas", name: "Equipo mediano" },
  { size: "Más de 500", unit: "personas", name: "Gran empresa" },
];

const faq = [
  { q: "¿La empresa ve los datos fiscales de sus empleados?", a: "No. La empresa solo ve cuántas personas se han dado de alta y cuántas declaraciones se han presentado. Los datos fiscales son de cada persona." },
  { q: "¿Hace falta integrar algo?", a: "No. Te damos un enlace de alta y lo compartes por el canal que ya usas con tu equipo o tus clientes." },
  { q: "¿Cuánto cuesta?", a: <>Depende del número de personas y de lo que quieras cubrir. En <Link href={PLANES} transitionTypes={FORWARD} className="font-semibold text-accent underline-offset-4 hover:underline">los planes</Link> ves qué incluye cada tamaño, y te enviamos una propuesta cerrada antes de empezar.</> },
  { q: "¿Cómo se añaden más personas?", a: "Nos lo dices y ampliamos el acceso. No tienes que volver a configurar nada." },
  { q: "¿Y si alguien vive en el País Vasco o Navarra?", a: "Por ahora no trabajamos con declaraciones del País Vasco ni de Navarra: tienen su propio régimen fiscal." },
];

const headline = "font-display font-semibold tracking-[-0.06em] text-ink";
const arrow = "size-4 transition-transform duration-200 ease-brand group-hover:translate-x-1 motion-reduce:transform-none";

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
    <DirectionalTransition lateral><div>
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
              <LinkButton href={PLANES} transitionTypes={FORWARD} variant="ghost">Ver planes</LinkButton>
            </div>
          </div>
        </HeroDemo>

        <section aria-labelledby="soluciones" className="mt-24 scroll-mt-24">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <h2 id="soluciones" className={`${headline} max-w-2xl text-[34px] leading-[1.1] text-balance sm:text-[44px]`}>¿A quién quieres ofrecérselo?</h2>
            <nav aria-label="Elige un camino" className="flex gap-2">
              {paths.map((p) => (
                <a key={p.id} href={`#${p.id}`} className="inline-flex h-10 items-center rounded-pill border border-border bg-surface-raised px-4 text-sm font-semibold text-ink transition-colors duration-150 hover:border-accent hover:text-accent">{p.who}</a>
              ))}
            </nav>
          </div>
          <div className="mt-8 space-y-4">
            {paths.map((p, i) => (
              <Reveal key={p.id}>
                <article id={p.id} aria-labelledby={`${p.id}-titulo`} className="anim-target relative grid scroll-mt-24 overflow-hidden rounded-[24px] md:min-h-[460px] md:grid-cols-2" style={fieldStyle}>
                  {/* Radio anidado: 24 px de la tarjeta menos 12 px de margen. */}
                  <div aria-hidden className={`p-3 ${i % 2 ? "md:order-1" : "md:order-2"}`}>
                    {/* Solo el canto que mira al texto se funde con la tarjeta; los demás quedan definidos. */}
                    <div className={`relative overflow-hidden rounded-[12px] ${p.frame} [mask-image:linear-gradient(to_bottom,#000_65%,transparent)] ${i % 2 ? "md:[mask-image:linear-gradient(to_left,transparent,#000_35%)]" : "md:[mask-image:linear-gradient(to_right,transparent,#000_35%)]"}`}>
                      <Image src={p.photo} alt="" fill sizes="(min-width: 768px) 50vw, 100vw" className={p.crop} />
                      <span aria-hidden className="pointer-events-none absolute inset-0 rounded-[12px] ring-1 ring-inset ring-border" />
                    </div>
                  </div>
                  <div className={`relative flex flex-col p-6 sm:p-10 md:justify-center ${i % 2 ? "md:order-2" : "md:order-1"}`}>
                    <h3 id={`${p.id}-titulo`} className={`${headline} text-[28px] leading-[1.1] text-balance sm:text-[40px]`}>{p.who}</h3>
                    <p className="mt-3 text-xl font-semibold leading-[1.3] tracking-[-0.02em] text-ink">{p.title}</p>
                    <p className="mt-2 max-w-reading text-text-muted">{p.text}</p>
                    <ul className="mt-6 space-y-2">
                      {p.list.map((l) => <li key={l} className="flex gap-2 text-ink"><Check aria-hidden className="mt-1 size-4 shrink-0 text-accent" />{l}</li>)}
                    </ul>
                    <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
                      <PillCta href={DEMO}>Solicitar una demo</PillCta>
                      <Link href={PLANES} transitionTypes={FORWARD} className="group inline-flex items-center gap-2 font-semibold text-accent hover:text-accent-hover">
                        Ver planes {p.who.toLowerCase()}
                        <ArrowRight aria-hidden className={arrow} />
                      </Link>
                    </div>
                  </div>
                </article>
              </Reveal>
            ))}
          </div>
        </section>

        <section aria-labelledby="por-que" className="mt-24 grid gap-10 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="lg:sticky lg:top-28 lg:self-start">
            <h2 id="por-que" className={`${headline} text-[34px] leading-[1.1] text-balance sm:text-[44px]`}>Un beneficio que no te da trabajo.</h2>
            <p className="mt-3 max-w-reading text-text-muted">Lo pensamos para que ofrecerlo cueste un correo, no un proyecto.</p>
          </div>
          <ul className="divide-y divide-border border-y border-border">
            {reasons.map((r) => (
              <li key={r.title}>
                <div className="grid gap-2 py-6 sm:grid-cols-[1fr_1.2fr] sm:gap-8 sm:py-8">
                  <p className="font-display text-[22px] font-semibold leading-[1.2] tracking-[-0.03em] text-ink sm:text-[26px]">{r.title}</p>
                  <p className="text-text-muted sm:pt-1">{r.text}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="reciben" className="mt-24">
          <h2 id="reciben" className={`${headline} text-[34px] leading-[1.1] sm:text-[44px]`}>Lo que reciben</h2>
          <ul className="mt-8 grid gap-x-10 sm:grid-cols-2">
            {services.map(({ Icon, title, text }) => (
              <li key={title} className="flex gap-4 border-t border-border py-6">
                <span aria-hidden className="grid size-12 shrink-0 place-items-center rounded-full bg-accent-soft text-accent"><Icon className="size-6" /></span>
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
                <Reveal delay={i * 60} className="group">
                  <div className="h-0.5 bg-border">
                    <div className="h-full origin-left bg-accent transition-[scale] duration-[360ms] ease-brand [transition-delay:var(--d)] motion-reduce:transition-none group-data-[reveal=hidden]:scale-x-0" />
                  </div>
                  <span className="mt-6 block font-display text-display font-semibold leading-none tracking-[-0.06em] text-accent transition-colors duration-[360ms] [transition-delay:var(--d)] group-data-[reveal=hidden]:text-lilac" aria-hidden>{i + 1}</span>
                  <p className="mt-2 text-lg font-semibold text-ink"><span className="sr-only">Paso {i + 1}: </span>{s.title}</p>
                  <p className="mt-1 text-text-muted">{s.text}</p>
                </Reveal>
              </li>
            ))}
          </ol>
        </section>

        <section aria-labelledby="planes" className="mt-24 scroll-mt-24">
          <div className="rounded-[24px] border border-border bg-surface p-6 sm:p-10">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <h2 id="planes" className={`${headline} text-[34px] leading-[1.1] sm:text-[44px]`}>Un plan para cada tamaño.</h2>
                <p className="mt-3 max-w-reading text-text-muted">El precio depende de cuántas personas son y de lo que quieras cubrir. Siempre con propuesta cerrada antes de empezar.</p>
              </div>
              <LinkButton href={PLANES} transitionTypes={FORWARD} variant="secondary">Comparar planes</LinkButton>
            </div>
            <ul className="mt-8 grid gap-px overflow-hidden rounded-[16px] bg-border sm:grid-cols-3">
              {tiers.map((t) => (
                <li key={t.name}>
                  <Link href={PLANES} transitionTypes={FORWARD} className="group flex h-full flex-col bg-surface-raised p-6 transition-colors duration-150 hover:bg-accent-soft">
                    <span className={`${headline} origin-left text-[32px] leading-none transition-transform duration-200 ease-brand group-hover:scale-[1.04] motion-reduce:transform-none`}>{t.size}</span>
                    <span className="mt-1 text-sm text-text-muted">{t.unit}</span>
                    <span className="mt-6 inline-flex items-center gap-2 font-semibold text-accent">{t.name}<ArrowRight aria-hidden className={arrow} /></span>
                  </Link>
                </li>
              ))}
            </ul>
            <p className="mt-4 text-sm text-text-muted">¿Es para tus clientes? También hay planes según cuántos sean, en la misma página.</p>
          </div>
        </section>

        <section aria-labelledby="faq" className="mt-24 max-w-reading">
          <h2 id="faq" className={`${headline} mb-6 text-[34px] leading-[1.1]`}>Preguntas frecuentes</h2>
          <Accordion items={faq} />
        </section>

        <section id="cierre" aria-labelledby="cierre-titulo" className="mt-24">
          <div className="flex flex-col items-start justify-between gap-6 rounded-[24px] bg-ink p-8 text-on-ink md:flex-row md:items-center md:p-12" style={inkGlow}>
            <div>
              <h2 id="cierre-titulo" className="font-display text-[34px] font-semibold leading-[1.1] tracking-[-0.06em] sm:text-[44px]">Te lo enseñamos con tu caso.</h2>
              <p className="mt-2 max-w-reading text-on-ink-muted">Cuéntanos quién eres y a quién quieres ofrecérselo, y preparamos la demo a tu medida.</p>
            </div>
            <PillCta href={DEMO} tone="light">Solicitar una demo</PillCta>
          </div>
        </section>
        <BarraContratar href={DEMO} label="Solicitar una demo" endId="cierre" />
      </div>
    </div></DirectionalTransition>
  );
}
