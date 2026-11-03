"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button, LinkButton } from "@/components/ui/button";
import { Card, EmptyState, Notice, Tag } from "@/components/ui/display";
import { cancelRenewal, deleteMyAccount, exportMyData, openBillingPortal } from "@/lib/data/api";
import { isLive } from "@/lib/env";
import { planByCode } from "@/lib/data/plans";
import { useDemoState } from "@/lib/data/store";
import { formatDate, formatEuros } from "@/lib/format";

export default function Suscripcion() {
  const router = useRouter();
  const s = useDemoState();
  const sub = s.subscription;
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [dataMsg, setDataMsg] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);

  async function download() {
    setDataMsg("");
    try {
      const data = await exportMyData();
      const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }));
      const a = document.createElement("a");
      a.href = url; a.download = "mis-datos.json"; a.click();
      URL.revokeObjectURL(url);
    } catch (e) { setDataMsg(e instanceof Error ? e.message : "No hemos podido exportar tus datos."); }
  }

  async function removeAccount() {
    try { await deleteMyAccount(); router.push("/inicio"); }
    catch (e) { setDataMsg(e instanceof Error ? e.message : "No hemos podido eliminar tu cuenta."); }
  }

  const myData = isLive && (
    <section className="space-y-3 border-t border-border pt-6">
      <h2 className="text-lg font-semibold">Mis datos</h2>
      <p className="text-sm text-text-muted">Puedes descargar todo lo que guardamos de ti o pedir que eliminemos tu cuenta. Por ley conservamos las facturas y las declaraciones presentadas durante el plazo exigido.</p>
      <div className="flex flex-wrap gap-3">
        <Button variant="secondary" onClick={download}>Descargar mis datos</Button>
        {!confirmDelete && <Button variant="secondary" onClick={() => setConfirmDelete(true)}>Eliminar mi cuenta</Button>}
      </div>
      {confirmDelete && (
        <div role="alertdialog" aria-labelledby="del-title" className="rounded-lg border border-danger p-5">
          <h3 id="del-title" className="font-semibold">¿Eliminar tu cuenta?</h3>
          <p className="mt-1 text-sm">Cancelaremos tu suscripción y borraremos tus datos personales a los 30 días. No se puede deshacer.</p>
          <div className="mt-3 flex gap-3"><Button variant="danger" onClick={removeAccount}>Sí, eliminar</Button><Button variant="secondary" onClick={() => setConfirmDelete(false)}>Cancelar</Button></div>
        </div>
      )}
      {dataMsg && <p role="alert" className="text-sm text-danger">{dataMsg}</p>}
    </section>
  );

  if (!sub) {
    return (
      <div className="space-y-8">
        <EmptyState title="No tienes ninguna suscripción" text="Cuando contrates un plan, podrás gestionarlo aquí." action={<LinkButton href="/precios">Ver precios</LinkButton>} />
        {myData}
      </div>
    );
  }
  const plan = planByCode(sub.planCode)!;

  async function cancel() {
    setBusy(true);
    await cancelRenewal();
    setBusy(false);
    setConfirm(false);
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold">Suscripción</h1>
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-semibold">Plan {plan.name}</h2>
          {sub.autoRenew ? <Tag tone="success">Activo</Tag> : <Tag tone="warning">No se renovará</Tag>}
        </div>
        <p className="mt-2">{formatEuros(plan.priceCents)} al año, IVA incluido.</p>
        <p className="text-sm text-text-muted">
          {sub.autoRenew ? `Se renueva el ${formatDate(sub.renewsAt)}. Te avisaremos 15 días antes.` : `Tu plan termina el ${formatDate(sub.renewsAt)} y no se renovará.`}
        </p>
      </Card>

      {sub.autoRenew && !confirm && <Button variant="secondary" onClick={() => setConfirm(true)}>Cancelar la renovación</Button>}
      {confirm && (
        <div role="alertdialog" aria-labelledby="cancel-title" className="rounded-lg border border-danger p-5">
          <h2 id="cancel-title" className="text-lg font-semibold">¿Cancelar la renovación?</h2>
          <p className="mt-1 text-sm">Seguirás teniendo tu plan hasta el {formatDate(sub.renewsAt)}. No se hará ningún cobro más.</p>
          <div className="mt-4 flex gap-3">
            <Button variant="danger" loading={busy} onClick={cancel}>Sí, cancelar</Button>
            <Button variant="secondary" onClick={() => setConfirm(false)}>Mantener plan</Button>
          </div>
        </div>
      )}
      {!sub.autoRenew && <Notice tone="success">Renovación cancelada. No se te cobrará de nuevo.</Notice>}
      {isLive && <Button variant="ghost" onClick={() => openBillingPortal()}>Método de pago y facturas</Button>}
      {myData}
    </div>
  );
}
