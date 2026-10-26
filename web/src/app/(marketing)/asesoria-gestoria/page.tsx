import type { Metadata } from "next";
import { LinkButton } from "@/components/ui/button";
import { Accordion, Card, Tag } from "@/components/ui/display";

export const metadata: Metadata = { title: "Gestoría para autónomos" };

const plans = [
  { name: "Estándar", price: "29,90 €", list: ["Modelos trimestrales 130 y 303", "Declaración anual", "Consultas por email"] },
  { name: "Premium", price: "59,90 €", list: ["Todo lo de Estándar", "Contabilidad y facturación", "Asesor asignado por chat"], rec: true },
];

export default function Autonomos() {
  return (
    <div className="mx-auto max-w-content px-4 py-12">
      <h1 className="text-xl font-bold">Gestoría para autónomos</h1>
      <p className="mt-2 max-w-reading text-text-muted">Olvídate de los plazos trimestrales. Un gestor lleva tus impuestos y tú te dedicas a tu negocio.</p>
      <div className="mt-8 grid gap-4 md:grid-cols-2">
        {plans.map((p) => (
          <Card key={p.name} selected={p.rec}>
            <div className="flex items-center justify-between"><h2 className="text-lg font-semibold">{p.name}</h2>{p.rec && <Tag tone="accent">Recomendado</Tag>}</div>
            <p className="mt-3 text-xl font-bold">{p.price}<span className="text-sm font-normal text-text-muted"> al mes</span></p>
            <ul className="mt-4 space-y-1 text-sm">{p.list.map((l) => <li key={l}>✓ {l}</li>)}</ul>
            <p className="mt-4 text-sm text-text-muted">Compromiso mínimo de 3 meses.</p>
            <div className="mt-4"><LinkButton href="/acceder?next=/app/conectar" variant={p.rec ? "primary" : "secondary"}>Contratar {p.name}</LinkButton></div>
          </Card>
        ))}
      </div>
      <h2 className="mb-4 mt-12 text-lg font-semibold">Preguntas frecuentes</h2>
      <div className="max-w-reading">
        <Accordion items={[
          { q: "¿Qué pasa si aún no soy autónomo?", a: "Podemos tramitar tu alta y asesorarte sobre la base de cotización." },
          { q: "¿Puedo cancelar?", a: "Sí, después del compromiso mínimo de 3 meses, sin penalización." },
        ]} />
      </div>
    </div>
  );
}
