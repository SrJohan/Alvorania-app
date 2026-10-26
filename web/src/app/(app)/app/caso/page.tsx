"use client";
import { useEffect, useState, type FormEvent } from "react";
import { Button, LinkButton } from "@/components/ui/button";
import { Card, EmptyState, Notice, StatusBadge, Timeline, type TimelineItem } from "@/components/ui/display";
import { clientResubmit, demoAdvisorApprove, demoAdvisorRequestChanges, demoAdvisorSubmit, downloadDocument, refreshState, sendMessage } from "@/lib/data/api";
import { isLive } from "@/lib/env";
import { planByCode } from "@/lib/data/plans";
import { useDemoState } from "@/lib/data/store";
import { formatDateTime, formatEuros } from "@/lib/format";

export default function Caso() {
  const s = useDemoState();
  const c = s.case;
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [demoError, setDemoError] = useState("");
  const [resubmitting, setResubmitting] = useState(false);
  const [docError, setDocError] = useState("");
  const [tries, setTries] = useState(0);
  const [pagoOk] = useState(() => typeof window !== "undefined" && new URLSearchParams(window.location.search).get("pago") === "ok");
  const status = s.case?.status;
  const confirming = isLive && pagoOk && status === "calculado" && tries < 15;

  // Al volver de Stripe el webhook puede tardar unos segundos: se consulta hasta que el caso pase a revisión.
  useEffect(() => {
    if (!isLive || !pagoOk || status !== "calculado") return;
    const id = setInterval(() => {
      setTries((n) => n + 1);
      refreshState().catch(() => undefined);
    }, 2000);
    return () => clearInterval(id);
  }, [pagoOk, status]);

  if (!c) {
    return <EmptyState title="Aún no tienes ningún caso" text="Empieza calculando tu renta. Es gratis." action={<LinkButton href="/app/conectar">Empezar mi renta</LinkButton>} />;
  }
  const plan = s.planCode ? planByCode(s.planCode) : null;
  const r = c.review;
  const calc = c.calculation;

  const items: TimelineItem[] = [
    { title: "Datos y cuestionario", state: calc ? "done" : "current", detail: calc ? undefined : "Termina el cuestionario para ver tu resultado.",
      action: !calc && <LinkButton href="/app/cuestionario" size="sm">Continuar</LinkButton> },
    { title: "Resultado calculado", state: calc ? "done" : "pending", detail: calc ? `${calc.resultCents < 0 ? "A devolver" : "A pagar"} ${formatEuros(Math.abs(calc.resultCents))}` : undefined },
    { title: "Plan contratado", state: r ? "done" : calc ? "current" : "pending", detail: plan ? `Plan ${plan.name}` : undefined,
      action: calc && !r && <LinkButton href="/app/plan" size="sm">Elegir plan</LinkButton> },
    { title: "Revisión del asesor", state: r?.advisorApprovedAt ? "done" : r ? "current" : "pending", detail: r?.advisorApprovedAt ? `Aprobada el ${formatDateTime(r.advisorApprovedAt)}` : r?.status === "cambios_pedidos" ? "Tu asesor te ha pedido cambios." : r ? `${r.advisorName} está revisando tu declaración.` : undefined },
    { title: "Tu aprobación", state: r?.userApprovedAt ? "done" : r?.advisorApprovedAt ? "current" : "pending",
      detail: r?.userApprovedAt ? `Dada el ${formatDateTime(r.userApprovedAt)}` : undefined,
      action: r?.advisorApprovedAt && !r.userApprovedAt && <LinkButton href="/app/revision" size="sm">Revisar y aprobar</LinkButton> },
    { title: "Presentada ante Hacienda", state: c.status === "presentado" ? "done" : "pending", detail: c.aeatReference ? `Justificante ${c.aeatReference}` : undefined },
  ];

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    setSending(true);
    await sendMessage(text.trim());
    setText("");
    setSending(false);
  }

  async function demo(fn: () => Promise<void>) {
    setDemoError("");
    try { await fn(); } catch (e) { setDemoError((e as Error).message); }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-xl font-bold">Renta {c.taxYear}</h1>
        <StatusBadge status={c.status} />
      </div>

      {confirming && <Notice title="Estamos confirmando tu pago">Puede tardar unos segundos. No hace falta que hagas nada.</Notice>}

      {r?.status === "cambios_pedidos" && (
        <Card selected>
          <h2 className="text-lg font-semibold">Tu asesor necesita que revises algunos datos</h2>
          <blockquote className="mt-2 rounded-md bg-surface px-4 py-3">{r.notes}</blockquote>
          <p className="mt-3 text-sm">Corrige lo que haga falta en el cuestionario, vuelve a calcular y avísale.</p>
          <div className="mt-4 flex flex-wrap gap-3">
            <LinkButton href="/app/cuestionario" variant="secondary">Ir al cuestionario</LinkButton>
            <Button loading={resubmitting} onClick={async () => { setResubmitting(true); setDocError(""); try { await clientResubmit(); } catch (e) { setDocError((e as Error).message); } setResubmitting(false); }}>Ya lo he corregido</Button>
          </div>
        </Card>
      )}

      {s.documents.some((d) => d.kind === "declaracion") && (
        <Card>
          <h2 className="text-lg font-semibold">Tu declaración</h2>
          <ul className="mt-2 divide-y divide-border">
            {s.documents.filter((d) => d.kind === "declaracion").map((d) => (
              <li key={d.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                <span className="text-sm">{d.name}</span>
                <Button size="sm" variant="secondary" onClick={() => downloadDocument(d.id).catch((e: Error) => setDocError(e.message))}>Descargar</Button>
              </li>
            ))}
          </ul>
        </Card>
      )}
      {docError && <p role="alert" className="text-sm text-danger">{docError}</p>}

      <div className="grid items-start gap-6 lg:grid-cols-2">
        <Card><h2 className="mb-4 text-lg font-semibold">Seguimiento</h2><Timeline items={items} /></Card>

        <Card>
          <h2 className="mb-3 text-lg font-semibold">Mensajes</h2>
          {s.messages.length === 0 ? (
            <p className="text-sm text-text-muted">Aquí aparecerán los mensajes de tu asesor.</p>
          ) : (
            <div role="log" aria-live="polite" className="flex max-h-80 flex-col gap-2 overflow-y-auto">
              {s.messages.map((m) => (
                <div key={m.id} className={`max-w-[85%] rounded-md px-3 py-2 text-sm ${m.from === "user" ? "self-end bg-accent-soft" : m.from === "advisor" ? "bg-surface" : "self-center bg-surface text-text-muted"}`}>
                  <p>{m.body}</p>
                  <p className="mt-0.5 text-xs text-text-muted">{formatDateTime(m.at)}</p>
                </div>
              ))}
            </div>
          )}
          {plan?.chat ? (
            <form onSubmit={submit} className="mt-4 flex gap-2">
              <label htmlFor="msg" className="sr-only">Escribe un mensaje</label>
              <input id="msg" value={text} onChange={(e) => setText(e.target.value)} placeholder="Escribe un mensaje a tu asesor"
                className="h-10 min-w-0 flex-1 rounded-md border border-border-input bg-bg px-3" />
              <Button type="submit" loading={sending} disabled={!text.trim()}>Enviar</Button>
            </form>
          ) : r ? (
            <p className="mt-4 text-sm text-text-muted">El chat con tu asesor está incluido en los planes Acompañado y Completo.</p>
          ) : null}
        </Card>
      </div>

      {!isLive && r && c.status !== "presentado" && (
        <Card className="border-dashed">
          <h2 className="text-lg font-semibold">Modo demostración</h2>
          <p className="mb-3 text-sm text-text-muted">Simula lo que haría tu asesor desde su panel. No existirá en la versión real de cara al cliente.</p>
          <div className="flex flex-wrap gap-3">
            <Button variant="secondary" disabled={!!r.advisorApprovedAt || r.status === "cambios_pedidos"} onClick={() => demo(demoAdvisorApprove)}>El asesor aprueba la revisión</Button>
            <Button variant="secondary" disabled={!!r.userApprovedAt || r.status === "cambios_pedidos"} onClick={() => demo(() => demoAdvisorRequestChanges())}>El asesor pide cambios</Button>
            <Button variant="secondary" disabled={!r.userApprovedAt} onClick={() => demo(demoAdvisorSubmit)}>El asesor presenta y registra el justificante</Button>
          </div>
          {demoError && <p role="alert" className="mt-2 text-sm text-danger">{demoError}</p>}
        </Card>
      )}
      {c.status === "presentado" && <Notice tone="success" title="Declaración presentada">Justificante {c.aeatReference}.</Notice>}
    </div>
  );
}
