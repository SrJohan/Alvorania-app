import type { Metadata } from "next";
import { Accordion, Notice } from "@/components/ui/display";
import { Reveal } from "@/components/ui/reveal";
import { PriceFinder } from "@/components/site/price-finder";
import { PLANS } from "@/lib/data/plans";
import { LateralTransition } from "@/components/site/directional-transition";

export const metadata: Metadata = { title: "Precios" };

const rows: { label: string; values: [string | boolean, string | boolean, string | boolean] }[] = [
  { label: "Cálculo de tu resultado", values: [true, true, true] },
  { label: "Revisión por un asesor", values: [true, true, true] },
  { label: "Presentación ante Hacienda", values: [true, true, true] },
  { label: "Chat con tu asesor", values: [false, true, true] },
  { label: "Inversiones y alquileres", values: [false, false, true] },
  { label: "Revisión de años anteriores", values: [false, false, true] },
];

const services = [
  ["Respuesta a un requerimiento básico", "50 €"],
  ["Respuesta a un requerimiento complejo", "Desde 239 €"],
  ["Revisión de un ejercicio anterior", "10 € por año + 20 % del ahorro conseguido"],
];

const Cell = ({ v }: { v: string | boolean }) =>
  typeof v === "string" ? <>{v}</> : v ? <><span aria-hidden>✓</span><span className="sr-only">Incluido</span></> : <><span aria-hidden>–</span><span className="sr-only">No incluido</span></>;

export default function Precios() {
  return (
    <LateralTransition><div className="mx-auto max-w-wide px-4 py-12">
      <div className="anim-swap"><PriceFinder
        intro={<>
          <h1 className="font-display text-[38px] font-semibold leading-[1.05] tracking-[-0.06em] text-ink sm:text-[56px] lg:text-[64px]">Precios claros,<br />sin sorpresas</h1>
          <p className="mt-4 max-w-reading text-lg text-text">Calcular es gratis. Pagas solo si quieres que un asesor revise y presente tu declaración. Precios de ejemplo, IVA incluido.</p>
        </>}
        notice={<Notice tone="warning" title="País Vasco y Navarra">Por ahora no trabajamos con declaraciones del País Vasco ni de Navarra, que tienen su propio régimen fiscal (foral).</Notice>}
      /></div>
      <Reveal className="mt-20"><section aria-labelledby="cerrado" className="rounded-lg bg-success-soft p-6 text-on-success-soft">
        <h2 id="cerrado" className="text-lg font-semibold">Precio cerrado antes de pagar</h2>
        <p className="mt-1 max-w-reading">Al terminar el cuestionario te decimos qué plan necesita tu caso y cuánto cuesta en total. Ese es el precio: no hay suplementos después. Si has vendido acciones o fondos necesitarás el plan Completo, y te lo diremos antes de pagar.</p>
      </section></Reveal>

      <div className="mt-12">
      <h2 id="comparativa" className="scroll-mt-24 text-lg font-semibold">Comparativa de los planes de renta</h2>
      <div className="relative mt-4 overflow-x-auto">
        <table className="w-full min-w-[520px] border-collapse text-sm">
          <caption className="sr-only">Comparativa de planes</caption>
          <thead>
            <tr className="bg-surface text-left">
              <th scope="col" className="p-3">Incluye</th>
              {PLANS.map((p) => <th key={p.code} scope="col" className="p-3">{p.name}</th>)}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.label} className="border-b border-border transition-colors duration-150 hover:bg-accent-soft">
                <th scope="row" className="p-3 text-left font-normal">{r.label}</th>
                {r.values.map((v, i) => <td key={i} className="p-3"><Cell v={v} /></td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      </div>

      <div className="mt-12">
      <h2 className="text-lg font-semibold">Otros servicios</h2>
      <dl className="mt-4 divide-y divide-border rounded-lg border border-border">
        {services.map(([k, v]) => (
          <div key={k} className="flex flex-wrap justify-between gap-2 p-4 transition-colors duration-150 hover:bg-surface">
            <dt>{k}</dt><dd className="font-semibold">{v}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-2 text-sm text-text-muted">El análisis de una carta de Hacienda es gratuito.</p>
      </div>

      <div className="mt-12">
      <h2 className="text-lg font-semibold">Preguntas sobre precios</h2>
      <div className="mt-4 max-w-reading">
        <Accordion items={[
          { q: "¿Se renueva automáticamente?", a: "Puedes cancelar la renovación en cualquier momento desde tu cuenta. Te avisamos antes de cada renovación." },
          { q: "¿Qué pasa si no presento con vosotros?", a: "No pagas nada. El cálculo gratuito es tuyo." },
        ]} />
      </div>
      </div>
    </div></LateralTransition>
  );
}
