"use client";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Card, ErrorState, FileDrop, Notice, ResultCard, Skeleton, StatusBadge, Tag } from "@/components/ui/display";
import { SelectField, TextField } from "@/components/ui/form";
import type { CaseStatus } from "@/lib/data/types";
import { formatDateTime, formatEuros } from "@/lib/format";
import { supabaseBrowser } from "@/lib/supabase/browser";
import type { Answers } from "@/lib/tax/engine";
import { advisorApprove, advisorSubmit } from "@/server/actions";
import {
  adminMarkPaid, advisorCaseDetail, advisorRegisterDeclaration, advisorRequestChanges, advisorSendMessage, advisorUploadUrl, documentDownloadUrl,
  type AdvisorCaseDetail,
} from "@/server/advisor-actions";

const ANSWER_LABELS: [keyof Answers, string, "euros" | "n" | "texto" | "si"][] = [
  ["ccaa", "Comunidad", "texto"], ["civilStatus", "Estado civil", "texto"], ["birthYear", "Año de nacimiento", "n"], ["disability", "Discapacidad (%)", "n"],
  ["grossIncome", "Ingresos brutos del trabajo", "euros"], ["socialSecurity", "Seguridad Social", "euros"], ["withholdings", "Retenciones", "euros"], ["payers", "Pagadores", "n"],
  ["savingsIncome", "Intereses y dividendos", "euros"], ["savingsGains", "Ganancias", "euros"],
  ["children", "Hijos", "n"], ["childrenUnder3", "Menores de 3", "n"], ["workingMother", "Madre trabajadora", "si"], ["nurseryCost", "Guardería", "euros"],
  ["rentPaid", "Alquiler pagado", "euros"], ["mortgagePre2013", "Hipoteca anterior a 2013", "euros"],
  ["pensionContrib", "Planes de pensiones", "euros"], ["donations", "Donativos", "euros"], ["donationsRecurrent", "Donativos recurrentes", "si"],
];

const fmt = (v: unknown, t: string) =>
  t === "euros" ? formatEuros(Math.round(Number(v) * 100)) : t === "si" ? (v ? "Sí" : "No") : String(v || "—");

export function CaseDetail() {
  const { id } = useParams<{ id: string }>();
  const [d, setD] = useState<AdvisorCaseDetail | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");
  const [actionError, setActionError] = useState("");
  const [notes, setNotes] = useState("");
  const [msg, setMsg] = useState("");
  const [ref, setRef] = useState("");
  const [plan, setPlan] = useState("LIVE");

  const load = useCallback(async () => {
    const r = await advisorCaseDetail(id);
    if (r.ok) { setD(r.data); setError(""); } else setError(r.error);
  }, [id]);

  useEffect(() => {
    let alive = true;
    advisorCaseDetail(id).then((r) => { if (!alive) return; if (r.ok) setD(r.data); else setError(r.error); });
    return () => { alive = false; };
  }, [id]);

  async function act(name: string, fn: () => Promise<{ ok: boolean; error?: string }>) {
    setBusy(name);
    setActionError("");
    const r = await fn();
    if (!r.ok) setActionError(r.error ?? "No se ha podido completar.");
    await load();
    setBusy("");
    return r.ok;
  }

  async function download(docId: string) {
    const r = await documentDownloadUrl(docId);
    if (r.ok) window.open(r.data.url, "_blank", "noopener");
    else setActionError(r.error);
  }

  async function uploadDeclaration(file: File) {
    await act("upload", async () => {
      const u = await advisorUploadUrl(id, { name: file.name, mime: file.type || "application/pdf", sizeBytes: file.size });
      if (!u.ok) return u;
      const { error: upErr } = await supabaseBrowser().storage.from("case-documents").uploadToSignedUrl(u.data.path, u.data.token, file);
      if (upErr) return { ok: false, error: "No se ha podido subir el archivo." };
      return advisorRegisterDeclaration(id, u.data.path, file.size);
    });
  }

  if (error) return <div className="mx-auto max-w-4xl p-4 md:p-8"><ErrorState text={error} onRetry={load} /></div>;
  if (!d) return <div className="mx-auto max-w-4xl space-y-4 p-4 md:p-8" aria-busy="true"><Skeleton className="h-10 w-64" /><Skeleton className="h-48 w-full" /></div>;

  const r = d.review;
  const open = d.status === "en_revision" || d.status === "pendiente_aprobacion";

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 md:p-8">
      <Link href="/asesor" className="text-sm underline">← Casos asignados</Link>
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-xl font-bold">{d.client.name} · Renta {d.taxYear}</h1>
        <StatusBadge status={d.status as CaseStatus} />
        {r?.status === "cambios_pedidos" && <Tag tone="warning">Cambios pedidos</Tag>}
      </div>
      <p className="text-sm text-text-muted">{d.client.email}</p>
      {actionError && <Notice tone="danger">{actionError}</Notice>}

      {d.status === "calculado" && d.isAdmin && (
        <Card>
          <h2 className="text-lg font-semibold">Registrar un pago recibido fuera de la web</h2>
          <p className="mt-1 text-sm text-text-muted">Transferencia, Bizum o efectivo. Se emite la factura, se asigna un asesor y se abre la revisión.</p>
          <div className="mt-3 flex flex-wrap items-end gap-3">
            <div className="w-48"><SelectField label="Plan" value={plan} onChange={(e) => setPlan(e.target.value)} options={["PRO", "LIVE", "FULL"]} /></div>
            <Button loading={busy === "paid"} onClick={() => act("paid", () => adminMarkPaid(id, plan))}>Marcar como pagado</Button>
          </div>
        </Card>
      )}

      <div className="grid items-start gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="text-lg font-semibold">Datos del cliente</h2>
          {d.answers ? (
            <dl className="mt-3 grid grid-cols-[1fr_auto] gap-x-6 gap-y-1 text-sm">
              {ANSWER_LABELS.map(([k, label, t]) => (
                <div key={k} className="contents"><dt className="text-text-muted">{label}</dt><dd className="text-right tabular-nums">{fmt(d.answers![k], t)}</dd></div>
              ))}
            </dl>
          ) : <p className="mt-2 text-sm text-text-muted">El cliente aún no ha completado el cuestionario.</p>}
        </Card>

        <Card>
          <h2 className="text-lg font-semibold">Cálculo</h2>
          {d.calculation ? (
            <div className="mt-3 space-y-3">
              <ResultCard cents={d.calculation.resultCents} savingsCents={0} />
              {d.calculation.approximate && <Notice tone="warning">Estimación: la comunidad no tiene reglas propias cargadas.</Notice>}
              {d.calculation.breakdown && (
                <dl className="grid grid-cols-[1fr_auto] gap-x-6 gap-y-1 text-sm">
                  <dt className="text-text-muted">Base liquidable general</dt><dd className="text-right">{formatEuros(Math.round(d.calculation.breakdown.baseLiquidableGeneral * 100))}</dd>
                  <dt className="text-text-muted">Cuota íntegra estatal</dt><dd className="text-right">{formatEuros(Math.round(d.calculation.breakdown.cuotaIntegraEstatal * 100))}</dd>
                  <dt className="text-text-muted">Cuota íntegra autonómica</dt><dd className="text-right">{formatEuros(Math.round(d.calculation.breakdown.cuotaIntegraAutonomica * 100))}</dd>
                  <dt className="text-text-muted">Cuota líquida</dt><dd className="text-right">{formatEuros(Math.round(d.calculation.breakdown.cuotaLiquida * 100))}</dd>
                </dl>
              )}
              <ul className="space-y-1 text-sm">
                {d.calculation.deductions.filter((x) => x.status !== "sugerida").map((x) => (
                  <li key={x.code} className="flex justify-between gap-3"><span>{x.label}</span><span>{x.status === "aplicada" ? formatEuros(Math.round(x.amount * 100)) : "no aplica"}</span></li>
                ))}
              </ul>
            </div>
          ) : <p className="mt-2 text-sm text-text-muted">Sin cálculo todavía.</p>}
        </Card>
      </div>

      {open && r && (
        <Card>
          <h2 className="text-lg font-semibold">Revisión</h2>
          <ul className="mt-2 text-sm text-text-muted">
            <li>Tu aprobación: {r.advisorApprovedAt ? `dada el ${formatDateTime(r.advisorApprovedAt)}` : "pendiente"}</li>
            <li>Aprobación del cliente: {r.userApprovedAt ? `dada el ${formatDateTime(r.userApprovedAt)}` : "pendiente"}</li>
            {r.status === "cambios_pedidos" && <li>Cambios pedidos: «{r.notes}». Esperando a que el cliente los corrija.</li>}
          </ul>
          <div className="mt-4 flex flex-wrap gap-3">
            {!r.advisorApprovedAt && r.status !== "cambios_pedidos" && (
              <Button loading={busy === "approve"} onClick={() => act("approve", () => advisorApprove(id))}>Aprobar la revisión</Button>
            )}
          </div>
          {!r.userApprovedAt && (
            <form className="mt-4 space-y-2" onSubmit={async (e: FormEvent) => { e.preventDefault(); if (await act("changes", () => advisorRequestChanges(id, notes))) setNotes(""); }}>
              <TextField label="Pedir cambios al cliente" placeholder="Por ejemplo: falta el certificado de retenciones del segundo pagador." value={notes} onChange={(e) => setNotes(e.target.value)} />
              <Button type="submit" variant="secondary" loading={busy === "changes"} disabled={!notes.trim()}>Enviar y devolver al cliente</Button>
            </form>
          )}
          {r.advisorApprovedAt && r.userApprovedAt && (
            <div className="mt-4 flex flex-wrap items-end gap-3">
              <div className="min-w-64"><TextField label="Justificante de la presentación" value={ref} onChange={(e) => setRef(e.target.value)} help="El código que devuelve la sede electrónica." /></div>
              <Button loading={busy === "submit"} disabled={!ref.trim()} onClick={() => act("submit", () => advisorSubmit(id, ref))}>Registrar como presentada</Button>
            </div>
          )}
        </Card>
      )}

      <div className="grid items-start gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="text-lg font-semibold">Documentos</h2>
          {d.documents.length === 0 ? <p className="mt-2 text-sm text-text-muted">No hay documentos.</p> : (
            <ul className="mt-3 divide-y divide-border">
              {d.documents.map((doc) => (
                <li key={doc.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                  <div><p className="text-sm font-medium">{doc.name}</p><p className="text-xs text-text-muted">{doc.byClient ? "Del cliente" : "Del asesor"} · {formatDateTime(doc.at)}</p></div>
                  <Button size="sm" variant="secondary" onClick={() => download(doc.id)}>Descargar</Button>
                </li>
              ))}
            </ul>
          )}
          {open && <div className="mt-4"><FileDrop label="Subir la declaración (PDF)" accept=".pdf" busy={busy === "upload"} onFile={uploadDeclaration} /></div>}
        </Card>

        <Card>
          <h2 className="text-lg font-semibold">Mensajes</h2>
          <div role="log" aria-live="polite" className="mt-3 flex max-h-80 flex-col gap-2 overflow-y-auto">
            {d.messages.length === 0 && <p className="text-sm text-text-muted">Sin mensajes.</p>}
            {d.messages.map((m) => (
              <div key={m.id} className={`max-w-[85%] rounded-md px-3 py-2 text-sm ${m.from === "advisor" ? "self-end bg-accent-soft" : m.from === "user" ? "bg-surface" : "self-center bg-surface text-text-muted"}`}>
                <p className="break-words">{m.body}</p><p className="mt-0.5 text-xs text-text-muted">{formatDateTime(m.at)}</p>
              </div>
            ))}
          </div>
          <form className="mt-3 flex gap-2" onSubmit={async (e: FormEvent) => { e.preventDefault(); if (await act("msg", () => advisorSendMessage(id, msg))) setMsg(""); }}>
            <label htmlFor="adv-msg" className="sr-only">Mensaje al cliente</label>
            <input id="adv-msg" value={msg} onChange={(e) => setMsg(e.target.value)} placeholder="Escribe al cliente" className="h-10 min-w-0 flex-1 rounded-md border border-border-input bg-bg px-3" />
            <Button type="submit" loading={busy === "msg"} disabled={!msg.trim()}>Enviar</Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
