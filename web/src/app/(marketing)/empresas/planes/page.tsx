import type { Metadata } from "next";
import { Check } from "lucide-react";
import { DirectionalTransition } from "@/components/site/directional-transition";
import { EmpresasPlanes } from "@/components/site/empresas-planes";
import { LinkButton } from "@/components/ui/button";
import { Accordion } from "@/components/ui/display";
import { PillCta } from "@/components/ui/pill-cta";

export const metadata: Metadata = { title: "Planes para empresas" };

const headline = "font-display font-semibold tracking-[-0.06em] text-ink";
const heroWash = {
  backgroundImage: "linear-gradient(to bottom, transparent 55%, var(--color-bg) 100%), radial-gradient(at 85% 20%, var(--color-field-a) 0, transparent 45%), linear-gradient(122deg, var(--color-bg) 0%, var(--color-surface) 48%, var(--color-field-c) 100%)",
};
const fieldStyle = {
  backgroundColor: "var(--color-accent-soft)",
  backgroundImage: "radial-gradient(at 0% 0%, var(--color-field-a) 0, transparent 55%), radial-gradient(at 100% 10%, var(--color-field-b) 0, transparent 50%), radial-gradient(at 40% 100%, var(--color-field-c) 0, transparent 60%)",
};
const inkGlow = {
  backgroundImage: "radial-gradient(at 100% 0%, var(--color-bright) 0, transparent 55%), radial-gradient(at 0% 100%, var(--color-ink-raised) 0, transparent 60%)",
};
const faq = [
  { q: "¿Qué pasa si mi equipo cambia de tamaño?", a: "Ajustamos el plan en la siguiente campaña, sin volver a configurar nada." },
  { q: "¿Pago por persona o por campaña?", a: "La propuesta es por campaña y por número de personas con acceso. La cerramos antes de empezar." },
  { q: "¿Puedo combinar equipo y clientes?", a: "Sí, podemos combinar ambos en una sola propuesta." },
  { q: "¿Hay permanencia?", a: "No. El acuerdo es por campaña." },
];

export default function PlanesEmpresasPage() {
  return (
    <DirectionalTransition lateral><div className="min-w-0">
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[900px]" style={heroWash} />
      <div className="mx-auto max-w-wide px-4 py-12">
        <h1 className={`${headline} max-w-4xl text-[34px] leading-[1.08] sm:text-[56px] sm:leading-[1.05] lg:text-[72px]`}>Un plan para cada tamaño de equipo.</h1>
        <p className="mt-3 max-w-reading text-lg text-text-muted">Elige a quién quieres ofrecerlo y cuántas personas son. Te enviamos una propuesta cerrada antes de empezar.</p>
        <div className="mt-8 flex flex-wrap items-center gap-3">
          <PillCta href="/empresas#demo">Pedir propuesta</PillCta>
          <LinkButton href="/empresas" transitionTypes={["nav-back"]} variant="ghost">Ver cómo funciona</LinkButton>
        </div>

        <EmpresasPlanes />

        <section aria-labelledby="datos-titulo" className="mt-24 grid gap-8 rounded-[24px] p-6 sm:p-8 md:grid-cols-[1.1fr_1fr] md:gap-12 md:p-12" style={fieldStyle}>
          <div>
            <h2 id="datos-titulo" className={`${headline} text-[34px] leading-[1.1] sm:text-[44px]`}>Tus datos, siempre suyos</h2>
            <p className="mt-4 max-w-reading text-text-muted">Ofrecer este servicio no te da acceso a la información fiscal de nadie. Cada persona trata directamente con su asesor y mantiene el control de sus datos.</p>
          </div>
          <ul className="space-y-6 self-center text-ink">
            {[
              "La empresa solo ve altas y declaraciones presentadas, nunca datos fiscales.",
              "Cada persona firma su propio encargo con el asesor.",
              "No trabajamos aún con declaraciones del País Vasco ni Navarra.",
            ].map((text) => <li key={text} className="flex gap-3"><Check aria-hidden className="mt-1 size-5 shrink-0 text-accent" /><span>{text}</span></li>)}
          </ul>
        </section>

        <section aria-labelledby="faq-titulo" className="mt-24 max-w-reading">
          <h2 id="faq-titulo" className={`${headline} mb-6 text-[34px] leading-[1.1] sm:text-[44px]`}>Preguntas frecuentes</h2>
          <Accordion items={faq} />
        </section>

        <section aria-labelledby="cierre-titulo" className="mt-24">
            <div className="flex flex-col items-start justify-between gap-6 rounded-[24px] bg-ink p-8 text-on-ink md:flex-row md:items-center md:p-12" style={inkGlow}>
              <div>
                <h2 id="cierre-titulo" className="font-display text-[34px] font-semibold leading-[1.1] tracking-[-0.06em] sm:text-[44px]">Te preparamos la propuesta.</h2>
                <p className="mt-2 max-w-reading text-on-ink-muted">Dinos cuántas personas son y a quién va dirigido. Te respondemos en dos días laborables.</p>
              </div>
              <PillCta tone="light" href="/empresas#demo" className="shrink-0">Pedir propuesta</PillCta>
            </div>
        </section>
      </div>
    </div></DirectionalTransition>
  );
}
