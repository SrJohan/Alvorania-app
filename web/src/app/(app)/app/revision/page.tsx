"use client";
import { useState } from "react";
import { Button, LinkButton } from "@/components/ui/button";
import { Card, EmptyState, Notice, ResultCard } from "@/components/ui/display";
import { Checkbox } from "@/components/ui/form";
import { userApprove } from "@/lib/data/api";
import { useDemoState } from "@/lib/data/store";
import { formatDateTime } from "@/lib/format";

export default function Revision() {
  const s = useDemoState();
  const c = s.case;
  const [ok, setOk] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  if (!c?.review || !c.calculation) {
    return <EmptyState title="Aún no hay nada que aprobar" text="Cuando un asesor revise tu declaración, la verás aquí para darle el visto bueno." action={<LinkButton href="/app/caso">Ir a mi caso</LinkButton>} />;
  }
  const r = c.review;

  async function approve() {
    setBusy(true);
    setError("");
    try { await userApprove(); } catch (e) { setError((e as Error).message); }
    setBusy(false);
  }

  if (c.status === "presentado") {
    return (
      <div className="space-y-4">
        <h1 className="text-xl font-bold">Declaración presentada</h1>
        <Notice tone="success" title="Todo listo">Justificante: <strong>{c.aeatReference}</strong>. Presentada el {c.submittedAt && formatDateTime(c.submittedAt)}.</Notice>
        <LinkButton href="/app/caso" variant="secondary">Volver a mi caso</LinkButton>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold">Revisión y aprobación</h1>
      <ResultCard cents={c.calculation.resultCents} savingsCents={c.calculation.savingsCents} />

      <Card>
        <h2 className="text-lg font-semibold">Estado de la revisión</h2>
        <ul className="mt-3 space-y-1 text-sm">
          <li>Asesor: <strong>{r.advisorName}</strong></li>
          <li>Revisión del asesor: {r.advisorApprovedAt ? <>aprobada el {formatDateTime(r.advisorApprovedAt)}</> : "en curso"}</li>
          <li>Tu aprobación: {r.userApprovedAt ? <>dada el {formatDateTime(r.userApprovedAt)}</> : "pendiente"}</li>
        </ul>
      </Card>

      {!r.advisorApprovedAt && <Notice>Tu asesor aún está revisando la declaración. Te avisaremos cuando esté lista para tu confirmación.</Notice>}

      {r.advisorApprovedAt && !r.userApprovedAt && (
        <Card selected>
          <h2 className="text-lg font-semibold">Confirma para presentar</h2>
          <p className="mt-1 text-sm">Revisa el resultado de arriba. Si todo es correcto, autoriza la presentación.</p>
          <div className="mt-4">
            <Checkbox checked={ok} onChange={(e) => setOk(e.target.checked)} label="He revisado mi declaración y autorizo su presentación ante Hacienda." />
          </div>
          {error && <p role="alert" className="mt-2 text-sm text-danger">{error}</p>}
          <div className="mt-4"><Button size="lg" disabled={!ok} loading={busy} onClick={approve}>Aprobar y presentar</Button></div>
        </Card>
      )}

      {r.userApprovedAt && <Notice tone="success">Gracias. Tu asesor presentará la declaración y te enviaremos el justificante.</Notice>}
    </div>
  );
}
