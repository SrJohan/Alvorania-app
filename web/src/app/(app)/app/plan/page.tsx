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

export default function Plan() {
  const router = useRouter();
  const s = useDemoState();
  const [selected, setSelected] = useState<PlanCode>("LIVE");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const c = s.case;

  if (!c?.calculation) {
    return <EmptyState title="Primero calcula tu resultado" text="Así sabrás qué vas a contratar." action={<LinkButton href="/app/cuestionario">Ir al cuestionario</LinkButton>} />;
  }
  if (c.status !== "calculado") {
    return <EmptyState title="Ya has contratado" text="Tu caso está en marcha. Puedes seguirlo en tu panel." action={<LinkButton href="/app/caso">Ir a mi caso</LinkButton>} />;
  }
  const plan = PLANS.find((p) => p.code === selected)!;

  async function pay() {
    if (!s.consents.mandate) return setError("Autoriza a la gestoría a presentar tu declaración para continuar.");
    setError("");
    setBusy(true);
    try {
      await checkout(selected);
      router.push("/app/caso");
    } catch {
      setBusy(false);
      setError("No hemos podido procesar el pago. No se ha cobrado nada. Inténtalo de nuevo.");
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-text-muted">Paso 4 de 4</p>
        <h1 className="text-xl font-bold">Elige cómo quieres seguir</h1>
        <p className="mt-1 text-text-muted">Un asesor revisará tu declaración. Tú das el visto bueno antes de presentarla.</p>
      </div>

      <div role="radiogroup" aria-label="Plan" className="grid gap-4 md:grid-cols-3">
        {PLANS.map((p) => (
          <label key={p.code} className="cursor-pointer">
            <input type="radio" name="plan" value={p.code} checked={selected === p.code} onChange={() => setSelected(p.code)} className="peer sr-only" />
            <div className={`h-full rounded-lg p-5 shadow-card peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-focus-ring ${selected === p.code ? "border-2 border-accent bg-accent-soft p-[19px]" : "border border-border bg-surface-raised"}`}>
              <div className="flex items-center justify-between"><span className="text-lg font-semibold">{p.name}</span>{p.recommended && <Tag tone="accent">Recomendado</Tag>}</div>
              <p className="mt-2 text-xl font-bold">{formatEuros(p.priceCents)}<span className="text-sm font-normal text-text-muted"> al año</span></p>
              <p className="mt-2 text-sm">{p.blurb}</p>
            </div>
          </label>
        ))}
      </div>

      <Card>
        <h2 className="text-lg font-semibold">Resumen</h2>
        <dl className="mt-3 grid grid-cols-[1fr_auto] gap-y-1">
          <dt>Plan {plan.name}</dt><dd className="font-semibold">{formatEuros(plan.priceCents)}</dd>
          <dt className="text-sm text-text-muted">IVA incluido · renovación anual, cancelable</dt><dd />
        </dl>
        <div className="mt-4">
          <Checkbox checked={s.consents.mandate} onChange={(e) => recordConsent("mandate", e.target.checked)}
            label="Autorizo a la gestoría a presentar mi declaración en mi nombre una vez la haya revisado un asesor y yo la haya aprobado." />
        </div>
      </Card>

      <Notice tone="warning" title="Pago simulado">En esta demostración no se cobra nada. Aquí irá el pago seguro con Stripe.</Notice>
      {error && <p role="alert" className="text-sm text-danger">{error}</p>}
      <Button size="lg" loading={busy} onClick={pay}>Pagar {formatEuros(plan.priceCents)}</Button>
    </div>
  );
}
