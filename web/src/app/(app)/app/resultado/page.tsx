"use client";
import { useEffect, useRef } from "react";
import { Button, LinkButton } from "@/components/ui/button";
import { Card, EmptyState, ResultCard, Skeleton, Tag } from "@/components/ui/display";
import { runCalculation } from "@/lib/data/api";
import { useDemoState } from "@/lib/data/store";
import { formatEuros } from "@/lib/format";
import { calculate } from "@/lib/tax/engine";
import { RULES_2025_DEMO } from "@/lib/tax/rules";

export default function Resultado() {
  const s = useDemoState();
  const c = s.case;
  const started = useRef(false);
  const calc = c?.calculation ?? null;
  const ready = !!c && c.answers.grossIncome > 0 && !!c.answers.ccaa;
  const stale = !!(c && calc && ready && calculate(c.answers).resultCents !== calc.resultCents);

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

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-text-muted">Paso 3 de 4</p>
        <h1 className="text-xl font-bold">Tu resultado de la renta {c!.taxYear}</h1>
      </div>

      <ResultCard cents={calc.resultCents} savingsCents={calc.savingsCents} stale={stale} />

      <Card>
        <h2 className="text-lg font-semibold">Deducciones</h2>
        <ul className="mt-3 divide-y divide-border">
          {calc.deductions.map((d) => (
            <li key={d.code} className="flex flex-wrap items-start justify-between gap-2 py-3">
              <div>
                <p className="font-medium">{d.label}</p>
                {d.hint && <p className="text-sm text-text-muted">{d.hint}</p>}
              </div>
              {d.status === "aplicada"
                ? <p className="text-sm"><Tag tone="success">Aplicada</Tag> <span className="font-semibold">{formatEuros(Math.round(d.amount * 100))}</span></p>
                : <Tag>Sugerida</Tag>}
            </li>
          ))}
        </ul>
      </Card>

      <details className="rounded-lg border border-border p-4">
        <summary className="cursor-pointer font-semibold">Cómo se ha calculado</summary>
        <dl className="mt-3 grid grid-cols-[1fr_auto] gap-x-6 gap-y-1 text-sm">
          <dt className="text-text-muted">Base liquidable</dt><dd>{formatEuros(Math.round(calc.baseLiquidable * 100))}</dd>
          <dt className="text-text-muted">Cuota íntegra</dt><dd>{formatEuros(Math.round(calc.cuotaIntegra * 100))}</dd>
          <dt className="text-text-muted">Reglas</dt><dd>{calc.rulesYear} · {calc.engineVersion}</dd>
        </dl>
        <p className="mt-3 text-sm text-text-muted">{RULES_2025_DEMO.sourceNote}</p>
      </details>

      <div className="flex flex-wrap gap-3">
        {stale && <Button variant="secondary" onClick={() => runCalculation()}>Volver a calcular</Button>}
        <LinkButton href={paid ? "/app/caso" : "/app/plan"} size="lg">{paid ? "Ir a mi caso" : "Que lo revise un asesor"}</LinkButton>
      </div>
      <p className="text-sm text-text-muted">Calcular es gratis. Solo pagas si decides que un asesor presente tu declaración.</p>
    </div>
  );
}
