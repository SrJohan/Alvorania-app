import type { Metadata } from "next";
import { LinkButton } from "@/components/ui/button";
import { Accordion, Card, Tag } from "@/components/ui/display";
import { PLANS } from "@/lib/data/plans";
import { formatEuros } from "@/lib/format";

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
    <div className="mx-auto max-w-content px-4 py-12">
      <h1 className="text-xl font-bold">Precios claros, sin sorpresas</h1>
      <p className="mt-2 max-w-reading text-text-muted">Calcular es gratis. Pagas solo si quieres que un asesor revise y presente tu declaración. Precios de ejemplo, IVA incluido.</p>

      <div className="mt-8 grid gap-4 md:grid-cols-3">
        {PLANS.map((p) => (
          <Card key={p.code} selected={p.recommended} className="flex flex-col">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">{p.name}</h2>
              {p.recommended && <Tag tone="accent">Recomendado</Tag>}
            </div>
            <p className="mt-3 text-xl font-bold">{formatEuros(p.priceCents)}<span className="text-sm font-normal text-text-muted"> al año</span></p>
            <p className="mt-2 text-sm text-text-muted">{p.blurb}</p>
            <ul className="mt-4 flex-1 space-y-1 text-sm">
              {p.features.map((f) => <li key={f}>✓ {f}</li>)}
            </ul>
            <div className="mt-6"><LinkButton href="/acceder?next=/app/conectar" variant={p.recommended ? "primary" : "secondary"} className="w-full">Elegir {p.name}</LinkButton></div>
          </Card>
        ))}
      </div>

      <h2 className="mt-12 text-lg font-semibold">Comparativa</h2>
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
              <tr key={r.label} className="border-b border-border">
                <th scope="row" className="p-3 text-left font-normal">{r.label}</th>
                {r.values.map((v, i) => <td key={i} className="p-3"><Cell v={v} /></td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2 className="mt-12 text-lg font-semibold">Otros servicios</h2>
      <dl className="mt-4 divide-y divide-border rounded-lg border border-border">
        {services.map(([k, v]) => (
          <div key={k} className="flex flex-wrap justify-between gap-2 p-4">
            <dt>{k}</dt><dd className="font-semibold">{v}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-2 text-sm text-text-muted">El análisis de una carta de Hacienda es gratuito. En el País Vasco y Navarra, consulta antes con un asesor.</p>

      <h2 className="mt-12 text-lg font-semibold">Preguntas sobre precios</h2>
      <div className="mt-4 max-w-reading">
        <Accordion items={[
          { q: "¿Se renueva automáticamente?", a: "Puedes cancelar la renovación en cualquier momento desde tu cuenta. Te avisamos antes de cada renovación." },
          { q: "¿Qué pasa si no presento con vosotros?", a: "No pagas nada. El cálculo gratuito es tuyo." },
        ]} />
      </div>
    </div>
  );
}
