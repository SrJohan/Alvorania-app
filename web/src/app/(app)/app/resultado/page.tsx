"use client";
import { FlowHeader } from "@/components/site/flow-header";
import { DawnPanel } from "@/components/ui/dawn-panel";
import { useEffect, useRef, type CSSProperties } from "react";
import { Button, LinkButton } from "@/components/ui/button";
import { Card, EmptyState, Notice, Skeleton, Tag } from "@/components/ui/display";
import { runCalculation } from "@/lib/data/api";
import { useDemoState } from "@/lib/data/store";
import { formatEuros } from "@/lib/format";
import { calculate, type Breakdown } from "@/lib/tax/engine";
import { explainResult } from "@/lib/tax/explain";
import { RULES_2025 } from "@/lib/tax/rules";

const ROWS: [keyof Breakdown, string, "+" | "-" | "="][] = [
  ["rendimientoIntegroTrabajo", "Rendimientos íntegros del trabajo", "+"],
  ["gastosDeducibles", "Gastos deducibles (Seguridad Social y 2.000 € generales)", "-"],
  ["reduccionTrabajo", "Reducción por rendimientos del trabajo", "-"],
  ["baseImponibleAhorro", "Base imponible del ahorro", "+"],
  ["reduccionPensiones", "Reducción por planes de pensiones", "-"],
  ["baseLiquidableGeneral", "Base liquidable general", "="],
  ["minimoEstatal", "Mínimo personal y familiar (estatal)", "="],
  ["minimoAutonomico", "Mínimo personal y familiar (autonómico)", "="],
  ["cuotaIntegraEstatal", "Cuota íntegra estatal", "="],
  ["cuotaIntegraAutonomica", "Cuota íntegra autonómica", "="],
  ["deduccionesEstatales", "Deducciones (tramo estatal)", "-"],
  ["deduccionesAutonomicas", "Deducciones (tramo autonómico)", "-"],
  ["cuotaLiquida", "Cuota líquida", "="],
  ["deduccionSmi", "Deducción por rendimientos del trabajo (SMI)", "-"],
  ["retenciones", "Retenciones y pagos a cuenta", "-"],
  ["maternidad", "Maternidad y guardería", "-"],
];

export default function Resultado() {
  const s = useDemoState();
  const c = s.case;
  const started = useRef(false);
  const calc = c?.calculation ?? null;
  const ready = !!c && c.answers.grossIncome > 0 && !!c.answers.ccaa;
  // Un cálculo guardado con una versión anterior del motor (sin desglose) también cuenta como desactualizado.
  const stale = !!(c && calc && ready && (!calc.breakdown || calculate(c.answers).resultCents !== calc.resultCents));

  useEffect(() => {
    if (ready && !calc && !started.current) {
      started.current = true;
      runCalculation();
    }
  }, [ready, calc]);

  if (!ready) {
    return <EmptyState title="Todavía no hay resultado" text="Completa el cuestionario y calculamos tu declaración en segundos." action={<LinkButton href="/app/cuestionario">Ir al cuestionario</LinkButton>} />;
  }
  if (!calc) {
    return (
      <div aria-busy="true" className="space-y-4">
        <Skeleton className="h-8 w-56" /><Skeleton className="h-36 w-full" /><Skeleton className="h-24 w-full" />
        <p className="text-sm text-text-muted">Calculando tu resultado…</p>
      </div>
    );
  }

  const paid = c!.status !== "borrador" && c!.status !== "calculado";
  const why = explainResult(calc);

  return (
    <div className="space-y-6">
      <FlowHeader step={3} title={`Tu resultado de la renta ${c!.taxYear}`} />

      <DawnPanel size="hero" cents={calc.resultCents} savingsCents={calc.savingsCents} stale={stale}>
        {why && <p className="max-w-reading text-base">{why}</p>}
      </DawnPanel>

      {(c!.answers.propertyIncome || c!.answers.selfEmployed) && (
        <Notice tone="warning" title="Este resultado no incluye todos tus ingresos">
          Nos has dicho que tienes {[c!.answers.propertyIncome && "inmuebles", c!.answers.selfEmployed && "actividad como autónomo"].filter(Boolean).join(" y ")}. Eso lo calcula tu asesor al revisar el caso, así que la cifra de arriba puede cambiar.
        </Notice>
      )}

      {calc.approximate && (
        <Notice title="Es una estimación">
          Aún no tenemos cargadas las deducciones propias de {calc.territory}: la parte autonómica se ha calculado con la escala general. Tu asesor la ajustará antes de presentar.
        </Notice>
      )}

      <Card>
        <h2 className="text-lg font-semibold">Deducciones</h2>
        <ul className="mt-3 divide-y divide-border">
          {calc.deductions.map((d, i) => (
            // Entran en cascada justo después de que la cifra termine de contar.
            <li key={d.code} className="anim-swap flex flex-wrap items-start justify-between gap-2 py-3" style={{ "--d": `${400 + Math.min(i, 6) * 50}ms` } as CSSProperties}>
              <div>
                <p className="font-medium">{d.label}</p>
                {d.hint && <p className="text-sm text-text-muted">{d.hint}</p>}
              </div>
              {d.status === "aplicada"
                ? <p className="text-sm"><Tag tone="success">Aplicada</Tag> <span className="font-semibold">{formatEuros(Math.round(d.amount * 100))}</span></p>
                : d.status === "no_aplica" ? <Tag tone="warning">No aplica</Tag> : <Tag>Sugerida</Tag>}
            </li>
          ))}
        </ul>
      </Card>

      <details className="rounded-lg border border-border p-4">
        <summary className="cursor-pointer font-semibold">Cómo se ha calculado</summary>
        {calc.breakdown ? (
          <dl className="mt-3 grid grid-cols-[1fr_auto] gap-x-6 gap-y-1 text-sm">
            {ROWS.filter(([k, , sign]) => sign === "=" || calc.breakdown[k] !== 0).map(([k, label, sign]) => (
              <div key={k} className="contents">
                <dt className={sign === "=" ? "font-medium" : "text-text-muted"}>{label}</dt>
                <dd className="text-right tabular-nums">{sign === "-" ? "− " : ""}{formatEuros(Math.round(calc.breakdown[k] * 100))}</dd>
              </div>
            ))}
            <dt className="text-text-muted">Reglas</dt><dd className="text-right">{calc.rulesYear} · motor {calc.engineVersion}</dd>
          </dl>
        ) : (
          <p className="mt-3 text-sm">Este cálculo es de una versión anterior. Pulsa «Volver a calcular».</p>
        )}
        <p className="mt-3 text-sm text-text-muted">Cifras del Manual práctico de Renta {RULES_2025.year} de la Agencia Tributaria. {RULES_2025.notes} Estado: {RULES_2025.status}.</p>
      </details>

      <div className="flex flex-wrap gap-3">
        {stale && <Button variant="secondary" onClick={() => runCalculation()}>Volver a calcular</Button>}
        <LinkButton href={paid ? "/app/caso" : "/app/plan"} transitionTypes={["nav-forward"]} size="lg">{paid ? "Ir a mi caso" : "Que lo revise un asesor"}</LinkButton>
      </div>
      <p className="text-sm text-text-muted">Calcular es gratis. Solo pagas si decides que un asesor presente tu declaración.</p>
    </div>
  );
}
