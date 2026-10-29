import type { Metadata } from "next";
import { BellRing, Calculator, FileText, MessageCircle, Receipt, UserPlus } from "lucide-react";
import { LinkButton } from "@/components/ui/button";
import { Accordion, Tag } from "@/components/ui/display";
import { PillCta } from "@/components/ui/pill-cta";
import { Reveal } from "@/components/ui/reveal";
import { BarraContratar, ExampleCard, PlanesYTabla, PlazosVivos } from "@/components/site/autonomos-live";
import { LateralTransition } from "@/components/site/directional-transition";
import { AUTONOMO_PLANS } from "@/lib/data/plans";

export const metadata: Metadata = { title: "Gestoría para autónomos" };

const START = "/acceder?next=/app/conectar";

const facts = [
  ["Desde 29,90 €", "al mes"],
  ["3 meses", "de compromiso mínimo; después cancelas sin penalización"],
  ["Un asesor", "revisa cada modelo antes de presentarlo"],
];

const tasks = [
  { Icon: Calculator, title: "Modelos 130 y 303", text: "Preparamos tu pago fraccionado de IRPF y tu IVA cada trimestre." },
  { Icon: FileText, title: "Declaración anual", text: "Tu renta del año con la actividad económica incluida." },
  { Icon: BellRing, title: "Avisos de plazo", text: "Te recordamos cada fecha antes de que llegue.", },
  { Icon: UserPlus, title: "Alta de autónomo", text: "Si aún no lo eres, tramitamos tu alta y te asesoramos sobre la base de cotización." },
  { Icon: Receipt, title: "Contabilidad y facturación", text: "Libros y facturas al día, sin que tengas que ordenarlos.", premium: true },
  { Icon: MessageCircle, title: "Asesor asignado", text: "Un asesor que conoce tu actividad y te responde por chat.", premium: true },
];

const compare: { label: string; values: [string | boolean, string | boolean] }[] = [
  { label: "Modelos trimestrales 130 y 303", values: [true, true] },
  { label: "Declaración anual", values: [true, true] },
  { label: "Consultas por email", values: [true, true] },
  { label: "Contabilidad y facturación", values: [false, true] },
  { label: "Asesor asignado por chat", values: [false, true] },
  { label: "Precio", values: ["29,90 € al mes", "59,90 € al mes"] },
  { label: "Compromiso mínimo", values: ["3 meses", "3 meses"] },
];

const steps = [
  { title: "Elige tu plan", text: "Estándar o Premium." },
  { title: "Cuéntanos tu actividad", text: "Unas preguntas y tus datos fiscales." },
  { title: "Tu asesor prepara los modelos", text: "Revisa tus facturas y calcula cada trimestre." },
  { title: "Tú das el visto bueno", text: "Se presenta cuando tú lo confirmas, antes del plazo." },
];

const faq = [
  { q: "¿Qué pasa si aún no soy autónomo?", a: "Podemos tramitar tu alta y asesorarte sobre la base de cotización." },
  { q: "¿Puedo cancelar?", a: "Sí. Pasados los 3 meses de compromiso mínimo, puedes cancelar sin penalización." },
  { q: "¿Quién presenta mis modelos?", a: "Un asesor de nuestro equipo los prepara y los revisa. Nada se presenta sin tu confirmación." },
  { q: "¿Qué diferencia hay entre Estándar y Premium?", a: "Premium suma contabilidad y facturación y un asesor asignado por chat. Estándar incluye los modelos 130 y 303, la declaración anual y consultas por email." },
  { q: "¿Qué necesitáis de mí?", a: "Tus datos fiscales y la información de tu actividad." },
  { q: "¿Y si vivo en el País Vasco o Navarra?", a: "Por ahora no trabajamos con declaraciones del País Vasco ni de Navarra: tienen su propio régimen fiscal." },
];

const headline = "font-display font-semibold tracking-[-0.06em] text-ink";
const inkGlow = {
  backgroundImage: "radial-gradient(at 100% 0%, var(--color-bright) 0, transparent 55%), radial-gradient(at 0% 100%, var(--color-ink-raised) 0, transparent 60%)",
};

export default function Autonomos() {
  return (
    <LateralTransition><div className="mx-auto max-w-wide px-4 py-12">
      <section className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
        <div>
          <h1 className={`${headline} text-[34px] leading-[1.08] sm:text-[56px] sm:leading-[1.05] lg:text-[72px]`}>Gestoría para autónomos</h1>
          <p className="mt-3 max-w-reading text-lg text-text-muted">Olvídate de los plazos trimestrales. Un asesor lleva tus impuestos y tú te dedicas a tu negocio.</p>
          <dl className="mt-8 grid gap-4 sm:grid-cols-3">
            {facts.map(([k, v]) => (
              <div key={k}>
                <dt className="font-display text-xl font-semibold tracking-[-0.03em] text-ink">{k}</dt>
                <dd className="mt-1 text-sm text-text-muted">{v}</dd>
              </div>
            ))}
          </dl>
          <div id="hero-cta" className="mt-8 flex flex-wrap items-center gap-3">
            <PillCta href={START}>Contratar ahora</PillCta>
            <LinkButton href="#planes" variant="ghost">Ver los planes</LinkButton>
          </div>
        </div>

        <ExampleCard />
      </section>

      <section aria-labelledby="incluye" className="mt-24">
        <h2 id="incluye" className={`${headline} text-[34px] leading-[1.1] sm:text-[44px]`}>Lo que llevamos por ti</h2>
        <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {tasks.map(({ Icon, title, text, premium }) => (
            <li key={title} className="flex gap-4 rounded-[20px] border border-border bg-surface p-6">
              <span aria-hidden className="grid size-12 shrink-0 place-items-center rounded-full bg-accent text-on-accent"><Icon className="size-6" /></span>
              <div>
                <p className="flex flex-wrap items-center gap-2 text-lg font-semibold text-ink">{title}{premium && <a href="#premium" className="rounded-pill"><Tag tone="accent">Premium</Tag></a>}</p>
                <p className="mt-1 text-text-muted">{text}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="planes" className="mt-24 scroll-mt-24">
        <h2 id="planes" className={`${headline} text-[34px] leading-[1.1] sm:text-[44px]`}>Elige tu plan</h2>
        <PlanesYTabla plans={AUTONOMO_PLANS} compare={compare} />
      </section>

      <section aria-labelledby="plazos" className="mt-24">
        <h2 id="plazos" className={`${headline} text-[34px] leading-[1.1] sm:text-[44px]`}>Tus plazos del año</h2>
        <p className="mt-3 max-w-reading text-text-muted">Cada trimestre se presentan los modelos 130 y 303. Estas son las fechas generales; tu asesor te avisa antes de cada una.</p>
        <PlazosVivos />
        <p className="mt-3 text-sm text-text-muted">Si el último día cae en festivo o fin de semana, el plazo pasa al siguiente día hábil. La declaración anual se presenta en la campaña de la renta.</p>
      </section>

      <section aria-labelledby="como" className="mt-24">
        <h2 id="como" className={`${headline} text-[34px] leading-[1.1] sm:text-[44px]`}>Cómo empezar</h2>
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

      <section aria-labelledby="faq" className="mt-24 max-w-reading">
        <h2 id="faq" className={`${headline} mb-6 text-[34px] leading-[1.1]`}>Preguntas frecuentes</h2>
        <Accordion items={faq} />
      </section>

      <section id="cierre" className="mt-24">
        <Reveal>
        <div className="flex flex-col items-start justify-between gap-6 rounded-[24px] bg-ink p-8 text-on-ink md:flex-row md:items-center md:p-12" style={inkGlow}>
          <div>
            <h2 className="font-display text-[34px] font-semibold leading-[1.1] tracking-[-0.06em] sm:text-[44px]">Despreocúpate de los plazos.</h2>
            <p className="mt-2 text-on-ink-muted">Desde 29,90 € al mes, con un asesor que revisa cada modelo.</p>
          </div>
          <PillCta href={START} tone="light">Contratar ahora</PillCta>
        </div>
        </Reveal>
      </section>
      <BarraContratar />
    </div></LateralTransition>
  );
}
