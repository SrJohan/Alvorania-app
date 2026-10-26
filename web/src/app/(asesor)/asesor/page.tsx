"use client";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, EmptyState, ErrorState, Skeleton, StatusBadge, Tag } from "@/components/ui/display";
import { TextField } from "@/components/ui/form";
import { formatEuros } from "@/lib/format";
import { advisorApprove, advisorCases, advisorSubmit } from "@/server/actions";
import type { CaseStatus } from "@/lib/data/types";

type Row = { id: string; status: string; taxYear: number | null; client: string; resultCents: number | null; advisorApproved: boolean; userApproved: boolean; changesRequested: boolean };

export default function Asesor() {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");
  const [refs, setRefs] = useState<Record<string, string>>({});
  const [rowError, setRowError] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    const r = await advisorCases();
    if (r.ok) { setRows(r.data); setError(""); } else setError(r.error);
  }, []);

  useEffect(() => {
    let alive = true;
    advisorCases().then((r) => {
      if (!alive) return;
      if (r.ok) setRows(r.data); else setError(r.error);
    });
    return () => { alive = false; };
  }, []);

  async function act(id: string, fn: () => ReturnType<typeof advisorApprove>) {
    setBusy(id);
    setRowError((e) => ({ ...e, [id]: "" }));
    const r = await fn();
    if (!r.ok) setRowError((e) => ({ ...e, [id]: r.error }));
    await load();
    setBusy("");
  }

  return (
    <div className="mx-auto max-w-4xl p-4 md:p-8">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-xl font-bold">Casos asignados</h1>
        <Link href="/" className="text-sm underline">Salir al sitio</Link>
      </div>

      <div className="mt-6 space-y-4">
        {error && <ErrorState text={error} onRetry={load} />}
        {!error && rows === null && <><Skeleton className="h-28 w-full" /><Skeleton className="h-28 w-full" /></>}
        {rows?.length === 0 && <EmptyState title="No tienes casos pendientes" text="Cuando un cliente contrate, su caso aparecerá aquí." />}
        {rows?.map((c) => (
          <Card key={c.id}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <Link href={`/asesor/${c.id}`} className="font-semibold underline-offset-2 hover:underline">{c.client}</Link>
                <p className="text-sm text-text-muted">Renta {c.taxYear} · {c.resultCents == null ? "sin calcular" : `${c.resultCents < 0 ? "a devolver" : "a pagar"} ${formatEuros(Math.abs(c.resultCents))}`}</p>
              </div>
              <div className="flex gap-2">{c.changesRequested && <Tag tone="warning">Cambios pedidos</Tag>}<StatusBadge status={c.status as CaseStatus} /></div>
            </div>
            <ul className="mt-3 text-sm text-text-muted">
              <li>Revisión del asesor: {c.advisorApproved ? "aprobada" : "pendiente"}</li>
              <li>Aprobación del cliente: {c.userApproved ? "dada" : "pendiente"}</li>
            </ul>
            <div className="mt-4 flex flex-wrap items-end gap-3">
              {c.status === "en_revision" && !c.advisorApproved && !c.changesRequested && <Button loading={busy === c.id} onClick={() => act(c.id, () => advisorApprove(c.id))}>Aprobar la revisión</Button>}
              {(c.status === "calculado" || c.status === "pagado") && <Link href={`/asesor/${c.id}`} className="text-sm font-semibold underline">{c.status === "calculado" ? "Abrir para registrar el pago" : "Abrir para asignarlo"}</Link>}
              {c.advisorApproved && c.userApproved && (
                <>
                  <div className="min-w-64"><TextField label="Justificante de la presentación" value={refs[c.id] ?? ""} onChange={(e) => setRefs({ ...refs, [c.id]: e.target.value })} help="El código que devuelve la sede electrónica." /></div>
                  <Button loading={busy === c.id} disabled={!(refs[c.id] ?? "").trim()} onClick={() => act(c.id, () => advisorSubmit(c.id, refs[c.id]))}>Registrar como presentada</Button>
                </>
              )}
            </div>
            {rowError[c.id] && <p role="alert" className="mt-2 text-sm text-danger">{rowError[c.id]}</p>}
          </Card>
        ))}
      </div>
    </div>
  );
}
