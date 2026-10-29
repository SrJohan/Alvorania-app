"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button, LinkButton } from "@/components/ui/button";
import { Card, EmptyState, Notice, Tag } from "@/components/ui/display";
import { Checkbox } from "@/components/ui/form";
import { checkout, recordConsent } from "@/lib/data/api";
import { PLANS } from "@/lib/data/plans";
import { useDemoState } from "@/lib/data/store";
import type { PlanCode } from "@/lib/data/types";
import { formatEuros } from "@/lib/format";
import { closedPrice, coversCase, requiredPlan } from "@/lib/pricing";

export default function Plan() {
  const router = useRouter();
  const s = useDemoState();
  const [chosen, setChosen] = useState<PlanCode | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const c = s.case;

  if (!c?.calculation) {
    return <EmptyState title="Primero calcula tu resultado" text="Así sabrás qué vas a contratar." action={<LinkButton href="/app/cuestionario">Ir al cuestionario</LinkButton>} />;
  }
  if (c.status !== "calculado") {
    return <EmptyState title="Ya has contratado" text="Tu caso está en marcha. Puedes seguirlo en tu panel." action={<LinkButton href="/app/caso">Ir a mi caso</LinkButton>} />;
  }
  const need = requiredPlan(c.answers);
  // Por defecto, el recomendado si cubre el caso; si no, el mínimo que lo cubre.
  const selected: PlanCode = chosen ?? (coversCase("LIVE", c.answers) ? "LIVE" : need.plan);
  const setSelected = setChosen;
  const plan = PLANS.find((p) => p.code === selected)!;
  const price = closedPrice(selected);

  async function pay() {
    if (!s.consents.mandate) return setError("Autoriza a la gestoría a presentar tu declaración para continuar.");
    setError("");
    setBusy(true);
    try {
      await checkout(selected);
      router.push("/app/caso", { transitionTypes: ["nav-forward"] });
    } catch (e) {
      setBusy(false);
      setError(e instanceof Error && e.message ? e.message : "No hemos podido procesar el pago. No se ha cobrado nada. Inténtalo de nuevo.");
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-text-muted">Paso 4 de 4</p>
        <h1 className="text-xl font-bold">Elige cómo quieres seguir</h1>
        <p className="mt-1 text-text-muted">Un asesor revisará tu declaración. Tú das el visto bueno antes de presentarla.</p>
      </div>

      {need.reasons.length > 0 && (
        <Notice title={`Tu caso necesita el plan ${PLANS.find((p) => p.code === need.plan)?.name}`}>{need.reasons.join(" ")}</Notice>
      )}

      <div role="radiogroup" aria-label="Plan" className="grid gap-4 md:grid-cols-3">
        {PLANS.map((p) => {
          const ok = coversCase(p.code, c.answers);
          return (
          <label key={p.code} className={ok ? "cursor-pointer" : "cursor-not-allowed opacity-60"}>
            <input type="radio" name="plan" value={p.code} checked={selected === p.code} disabled={!ok} onChange={() => setSelected(p.code)} className="peer sr-only" />
            <div className={`h-full rounded-lg p-5 shadow-card peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-focus-ring ${selected === p.code ? "border-2 border-accent bg-accent-soft p-[19px]" : "border border-border bg-surface-raised"}`}>
              <div className="flex items-center justify-between"><span className="text-lg font-semibold">{p.name}</span>{p.recommended && <Tag tone="accent">El más elegido</Tag>}</div>
              <p className="mt-2 text-xl font-bold">{formatEuros(p.priceCents)}<span className="text-sm font-normal text-text-muted"> al año</span></p>
              <p className="mt-2 text-sm">{p.blurb}</p>
              {!ok && <p className="mt-2 text-sm font-semibold">No cubre tu caso</p>}
            </div>
          </label>
          );
        })}
      </div>

      <Card>
        <h2 className="text-lg font-semibold">Resumen</h2>
        <dl className="mt-3 grid grid-cols-[1fr_auto] gap-y-1">
          <dt>Plan {plan.name}</dt><dd className="font-semibold">{formatEuros(price.totalCents)}</dd>
          <dt className="text-sm text-text-muted">IVA incluido · renovación anual, cancelable</dt><dd />
          <dt className="font-semibold">Total cerrado</dt><dd className="font-semibold">{formatEuros(price.totalCents)}</dd>
        </dl>
        <p className="mt-3 rounded-md bg-success-soft px-3 py-2 text-sm text-on-success-soft">
          <strong>Precio cerrado.</strong> Es todo lo que pagarás por esta declaración: no hay suplementos. Si tu asesor encuentra algo que no nos contaste y cambia el plan necesario, te avisamos antes de cobrar nada y puedes desistir con la devolución completa.
        </p>
        <div className="mt-4">
          <Checkbox checked={s.consents.mandate} onChange={(e) => recordConsent("mandate", e.target.checked)}
            label="Autorizo a la gestoría a presentar mi declaración en mi nombre una vez la haya revisado un asesor y yo la haya aprobado." />
        </div>
      </Card>

      <Notice tone="warning" title="Pago simulado">En esta demostración no se cobra nada. Aquí irá el pago seguro con Stripe.</Notice>
      {error && <p role="alert" className="text-sm text-danger">{error}</p>}
      <Button size="lg" loading={busy} onClick={pay}>Pagar {formatEuros(price.totalCents)}</Button>
    </div>
  );
}
