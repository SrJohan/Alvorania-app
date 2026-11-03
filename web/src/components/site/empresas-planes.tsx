"use client";

import { useRef, useState, type KeyboardEvent } from "react";
import { Check } from "lucide-react";
import { LinkButton } from "@/components/ui/button";
import { Card } from "@/components/ui/display";

const headline = "font-display font-semibold tracking-[-0.06em] text-ink";
const focus = "focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent";
const audiences = [
  {
    id: "equipo", label: "Para tu equipo", plans: [
      { name: "Equipo pequeño", size: "Hasta 50 personas", description: "Una ayuda con la renta para tu equipo.", features: ["Renta revisada por un asesor", "Revisión de los 4 años anteriores", "Ayuda con cartas de Hacienda", "Alta con un enlace, sin integraciones", "Informe de uso de la campaña"] },
      { name: "Equipo mediano", size: "De 51 a 500 personas", description: "Más cobertura y ayuda para ponerlo en marcha.", features: ["Trimestres y renta para quien sea autónomo", "Sesión informativa por videollamada antes de la campaña", "Materiales para anunciarlo en tu intranet"] },
      { name: "Gran empresa", size: "Más de 500 personas", description: "Un servicio que acompaña a toda tu organización.", features: ["Una persona de contacto fija en Alvorania", "Sesiones informativas por sede o equipo", "Informe de uso por departamento"] },
    ],
  },
  {
    id: "clientes", label: "Para tus clientes", plans: [
      { name: "Primeros pasos", size: "Hasta 5.000 clientes", description: "Empieza a ofrecer ayuda con la renta a tus clientes.", features: ["Renta revisada por un asesor", "Ayuda con cartas de Hacienda", "Invitación con tu marca", "Informe de uso de la campaña"] },
      { name: "Crecimiento", size: "De 5.000 a 50.000 clientes", description: "Amplía el servicio con condiciones propias.", features: ["Revisión de los 4 años anteriores", "Planes para clientes autónomos", "Condiciones propias para tus clientes"] },
      { name: "A gran escala", size: "Más de 50.000 clientes", description: "Atención y seguimiento a la medida de tu alcance.", features: ["Una persona de contacto fija en Alvorania", "Sesión informativa por videollamada para tu equipo comercial", "Informe de uso a medida"] },
    ],
  },
];

export function EmpresasPlanes() {
  const [{ active, keyboard }, setSelection] = useState({ active: 0, keyboard: false });
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const panels = useRef<(HTMLDivElement | null)[]>([]);
  const animation = useRef<Animation | null>(null);
  const keyboardChange = useRef(false);

  function select(index: number, animate: boolean) {
    animation.current?.cancel();
    keyboardChange.current = !animate;
    setSelection({ active: index, keyboard: keyboardChange.current });
    const panel = panels.current[index];
    if (index !== active && animate && panel && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      animation.current = panel.animate(
        [{ opacity: 0, transform: "translateY(6px)", filter: "blur(4px)" }, { opacity: 1, transform: "translateY(0)", filter: "blur(0)" }],
        { duration: 200, easing: getComputedStyle(panel).getPropertyValue("--ease-brand").trim() || "cubic-bezier(.2,.8,.2,1)" },
      );
    }
  }

  function onKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    let next: number;
    if (event.key === "ArrowRight") next = (index + 1) % audiences.length;
    else if (event.key === "ArrowLeft") next = (index + audiences.length - 1) % audiences.length;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = audiences.length - 1;
    else return;
    event.preventDefault();
    select(next, false);
    tabs.current[next]?.focus();
  }

  return (
    <section aria-label="Planes para tu equipo o tus clientes" className="mt-24 min-w-0">
      <div role="tablist" aria-label="A quién va dirigido el plan" className="relative flex w-full max-w-md gap-1 rounded-pill bg-surface p-1 text-sm font-semibold">
        <div aria-hidden className={`pointer-events-none absolute inset-y-1 left-1 w-[calc(50%_-_6px)] rounded-pill bg-surface-raised shadow-card ${keyboard ? "transition-none" : "transition-transform"} duration-200 ease-brand motion-reduce:transition-none`} style={{ transform: `translateX(calc(${active} * (100% + 4px)))` }} />
        {audiences.map((audience, index) => (
          <button key={audience.id} ref={(node) => { tabs.current[index] = node; }} type="button" role="tab" id={`tab-${audience.id}`} aria-selected={active === index} aria-controls={`panel-${audience.id}`} tabIndex={active === index ? 0 : -1} onKeyDown={(event) => onKeyDown(event, index)} onClick={(event) => select(index, event.detail !== 0)} className={`relative z-10 inline-flex min-h-11 flex-1 items-center justify-center rounded-pill px-3 transition-colors duration-150 ease-brand motion-reduce:transition-none ${focus} ${active === index ? "text-ink" : "text-text-muted"}`}>
            {audience.label}
          </button>
        ))}
      </div>
      {audiences.map((audience, index) => (
        <div key={audience.id} ref={(node) => { panels.current[index] = node; }} role="tabpanel" id={`panel-${audience.id}`} aria-labelledby={`tab-${audience.id}`} hidden={active !== index} tabIndex={0} className={`min-w-0 rounded-lg ${focus}`}>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {audience.plans.map((plan, planIndex) => (
              <div key={plan.name} className="flex min-w-0">
                <Card selected={planIndex === 1} className="flex w-full min-w-0 flex-col text-ink">
                  <h2 className="text-lg font-semibold">{plan.name}</h2>
                  <p className="mt-4 font-display text-[30px] font-semibold leading-[1.1] tracking-[-0.04em]">{plan.size}</p>
                  <p className="mt-3 text-sm text-text-muted">{plan.description}</p>
                  <p className="mt-6 text-xl font-bold">A presupuestar</p>
                  <p className="mt-5 text-sm font-semibold">{planIndex === 0 ? "Incluye:" : `Todo lo de ${audience.plans[planIndex - 1].name}, y además:`}</p>
                  <ul className="mt-3 flex-1 space-y-3 text-sm">
                    {plan.features.map((feature) => <li key={feature} className="flex gap-2"><Check aria-hidden className="mt-0.5 size-4 shrink-0 text-accent" /><span>{feature}</span></li>)}
                  </ul>
                  <LinkButton href="/empresas#demo" variant={planIndex === 1 ? "primary" : "secondary"} className={`mt-8 w-full ${focus}`}>Pedir propuesta</LinkButton>
                </Card>
              </div>
            ))}
          </div>
          <section aria-labelledby={`comparativa-${audience.id}`} className="mt-24 min-w-0">
            <h2 id={`comparativa-${audience.id}`} className={`${headline} text-[34px] leading-[1.1] sm:text-[44px]`}>¿Qué incluye cada plan?</h2>
            <div role="region" aria-label={`Comparativa: ${audience.label.toLowerCase()}`} tabIndex={0} className={`relative mt-8 max-w-full overflow-x-auto rounded-[20px] border border-border bg-surface ${focus}`}>
              <table className="w-full min-w-[720px] text-left text-sm text-ink">
                <caption className="sr-only">Ventajas incluidas en los planes {audience.label.toLowerCase()}</caption>
                <thead className="bg-surface-raised">
                  <tr><th scope="col" className="w-2/5 p-5 font-semibold">Ventajas</th>{audience.plans.map((plan) => <th key={plan.name} scope="col" className="p-5 text-center font-semibold">{plan.name}</th>)}</tr>
                </thead>
                <tbody>
                  {audience.plans.flatMap((plan, firstIncluded) => plan.features.map((feature) => (
                    <tr key={feature} className="border-t border-border">
                      <th scope="row" className="p-5 font-medium">{feature}</th>
                      {audience.plans.map((column, columnIndex) => <td key={column.name} className={`p-5 text-center ${columnIndex === 1 ? "bg-accent-soft" : ""}`}>
                        {columnIndex >= firstIncluded ? <><Check aria-hidden className="mx-auto size-5 text-accent" /><span className="sr-only">Incluido</span></> : <><span aria-hidden>-</span><span className="sr-only">No incluido</span></>}
                      </td>)}
                    </tr>
                  )))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      ))}
    </section>
  );
}
