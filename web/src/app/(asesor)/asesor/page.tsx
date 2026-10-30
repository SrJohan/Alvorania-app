"use client";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { StaffPage, useStaffRole } from "@/components/asesor/staff-shell";
import { Button } from "@/components/ui/button";
import { EmptyState, ErrorState, Notice, Skeleton, StatusBadge, Tag } from "@/components/ui/display";
import { formatEuros } from "@/lib/format";
import { advisorApprove, advisorCases, advisorSubmit } from "@/server/actions";
import type { CaseStatus } from "@/lib/data/types";

type Row = { id: string; status: string; taxYear: number | null; client: string; resultCents: number | null; advisorApproved: boolean; userApproved: boolean; changesRequested: boolean };
type Group = "presentar" | "revisar" | "cliente" | "pago" | "otros";

// La bandeja se ordena por lo que toca hacer, no por fecha: primero lo que solo depende del asesor.
const GROUPS: { key: Group; title: string; hint: string }[] = [
  { key: "presentar", title: "Listos para presentar", hint: "El asesor y el cliente han aprobado. Presenta en la sede y registra el justificante." },
  { key: "revisar", title: "Para revisar", hint: "Comprueba los datos y aprueba la revisión, o pide cambios desde el caso." },
  { key: "pago", title: "Pago y asignación", hint: "Casos calculados o pagados que aún no tienen la revisión en marcha." },
  { key: "cliente", title: "Esperando al cliente", hint: "Le hemos pedido cambios o su aprobación final." },
  { key: "otros", title: "Otros", hint: "" },
];

function groupOf(c: Row): Group {
  if (c.advisorApproved && c.userApproved) return "presentar";
  if (c.changesRequested || c.advisorApproved) return "cliente";
  if (c.status === "en_revision") return "revisar";
  if (c.status === "calculado" || c.status === "pagado") return "pago";
  return "otros";
}

function Result({ cents }: { cents: number | null }) {
  if (cents == null) return <span className="text-text-muted">Sin calcular</span>;
  return (
    <span className="tabular-nums">
      <span className="text-text-muted">{cents < 0 ? "A devolver " : "A pagar "}</span>
      <span className="font-semibold text-ink">{formatEuros(Math.abs(cents))}</span>
    </span>
  );
}

export default function Asesor() {
  const role = useStaffRole();
  const [rows, setRows] = useState<Row[] | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState<Record<string, boolean>>({});
  const [confirming, setConfirming] = useState<string | null>(null);
  const [success, setSuccess] = useState("");
  const successRef = useRef<HTMLDivElement>(null);
  const [refs, setRefs] = useState<Record<string, string>>({});
  const [rowError, setRowError] = useState<Record<string, string>>({});

  useEffect(() => {
    if (success) successRef.current?.focus();
  }, [success]);

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

  async function act(id: string, fn: () => ReturnType<typeof advisorApprove>, message: string) {
    setSuccess("");
    setBusy((b) => ({ ...b, [id]: true }));
    setRowError((e) => ({ ...e, [id]: "" }));
    try {
      const r = await fn();
      if (!r.ok) setRowError((e) => ({ ...e, [id]: r.error }));
      await load();
      if (r.ok) {
        setConfirming((current) => current === id ? null : current);
        setSuccess(message);
      }
    } finally {
      setBusy((b) => ({ ...b, [id]: false }));
    }
  }

  const pending = rows?.filter((c) => { const g = groupOf(c); return g === "presentar" || g === "revisar"; }).length ?? 0;

  return (
    <StaffPage
      title="Casos"
      description={rows === null ? "Cargando la bandeja…" : pending ? `${pending} ${pending === 1 ? "caso necesita" : "casos necesitan"} tu atención.` : "Nada pendiente por tu parte ahora mismo."}
    >
      {success && <div ref={successRef} tabIndex={-1} className="mb-6"><Notice tone="success">{success}</Notice></div>}
      {error && <ErrorState text={error} onRetry={load} />}
      {!error && rows === null && <div className="space-y-2" aria-busy="true"><Skeleton className="h-6 w-48" /><Skeleton className="h-16 w-full" /><Skeleton className="h-16 w-full" /></div>}
      {rows?.length === 0 && <EmptyState title="No tienes casos abiertos" text="Cuando un cliente contrate un plan, su caso aparecerá aquí." />}

      <div className="space-y-10">
        {GROUPS.map((g) => {
          const list = rows?.filter((c) => groupOf(c) === g.key) ?? [];
          if (!list.length) return null;
          const hint = g.key === "pago" && role !== "admin" ? "Casos pagados a la espera de que administración les asigne asesor." : g.hint;
          return (
            <section key={g.key} aria-labelledby={`g-${g.key}`}>
              <div className="flex items-baseline gap-3">
                <h2 id={`g-${g.key}`} className="text-base font-semibold text-ink">{g.title}</h2>
                <span className="text-sm tabular-nums text-text-muted">{list.length}</span>
              </div>
              {hint && <p className="mt-0.5 text-sm text-text-muted">{hint}</p>}

              <ul className="mt-3 divide-y divide-border overflow-hidden rounded-[14px] border border-border bg-surface-raised">
                {list.map((c) => (
                  <li key={c.id} className="grid gap-x-6 gap-y-3 px-4 py-4 sm:px-5 lg:grid-cols-[minmax(0,1fr)_200px_auto] lg:items-center">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <Link href={`/asesor/${c.id}`} className="truncate font-semibold text-ink underline-offset-4 hover:underline">{c.client}</Link>
                        <StatusBadge status={c.status as CaseStatus} staff />
                        {c.changesRequested && <Tag tone="warning">Cambios pedidos</Tag>}
                      </div>
                      <p className="mt-1 text-sm text-text-muted">
                        Renta {c.taxYear ?? "sin año"}. Revisión {c.advisorApproved ? "aprobada" : "pendiente"}, cliente {c.userApproved ? "conforme" : "pendiente"}.
                      </p>
                    </div>
                    <div className="text-sm"><Result cents={c.resultCents} /></div>
                    <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                      {g.key === "revisar" && (confirming === c.id ? (
                        <>
                          <p className="text-sm text-text-muted">Se avisará a {c.client} de que todo está correcto.</p>
                          <Button size="sm" className="pointer-coarse:h-11" loading={busy[c.id]} onClick={() => act(c.id, () => advisorApprove(c.id), `Revisión aprobada. Hemos avisado a ${c.client}.`)}>Confirmar</Button>
                          <Button size="sm" variant="secondary" className="pointer-coarse:h-11" autoFocus disabled={busy[c.id]} onClick={() => setConfirming(null)}>Cancelar</Button>
                        </>
                      ) : <Button size="sm" className="pointer-coarse:h-11" loading={busy[c.id]} onClick={() => { setSuccess(""); setConfirming(c.id); }}>Aprobar la revisión</Button>)}
                      {g.key === "pago" && <Link href={`/asesor/${c.id}`} className="text-sm font-semibold text-accent underline-offset-4 hover:underline">{role !== "admin" ? "Abrir el caso" : c.status === "calculado" ? "Registrar el pago" : "Asignar asesor"}</Link>}
                      {g.key === "presentar" && (
                        <form className="flex flex-wrap items-center gap-2" onSubmit={(e) => { e.preventDefault(); void act(c.id, () => advisorSubmit(c.id, refs[c.id]), `Presentación de ${c.client} registrada.`); }}>
                          <label htmlFor={`ref-${c.id}`} className="text-sm text-text-muted">Justificante de la sede<span className="sr-only"> de {c.client}</span></label>
                          <input id={`ref-${c.id}`} value={refs[c.id] ?? ""} onChange={(e) => setRefs({ ...refs, [c.id]: e.target.value })}
                            className="h-8 pointer-coarse:h-11 w-52 rounded-md border border-border-input bg-bg px-2.5 text-sm" />
                          <Button size="sm" className="pointer-coarse:h-11" type="submit" loading={busy[c.id]} disabled={!(refs[c.id] ?? "").trim()}>Registrar</Button>
                        </form>
                      )}
                      {(g.key === "cliente" || g.key === "otros") && <Link href={`/asesor/${c.id}`} className="text-sm font-semibold text-accent underline-offset-4 hover:underline">Abrir el caso</Link>}
                    </div>
                    {rowError[c.id] && <p role="alert" className="text-sm text-danger lg:col-span-3">{rowError[c.id]}</p>}
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>
    </StaffPage>
  );
}
