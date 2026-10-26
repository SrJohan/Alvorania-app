import "server-only";
import { supabaseAdmin } from "@/lib/supabase/server";
import { deliver, notify, renderEmail, sendEmail, type EmailKind } from "./email";

const DAY = 864e5;
const MAX_ATTEMPTS = 5;

const dateEs = (iso: string) => new Intl.DateTimeFormat("es-ES", { dateStyle: "long", timeZone: "Europe/Madrid" }).format(new Date(iso));
const eur = (cents: number) => new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(cents / 100);

export type JobName = "outbox" | "renewal-reminder" | "case-nudges" | "gdpr-purge";
export const JOBS: JobName[] = ["outbox", "renewal-reminder", "case-nudges", "gdpr-purge"];

/** Reintenta las notificaciones sin enviar. Tras 5 intentos queda registrada con su error para revisarla (dead letter). */
async function outbox() {
  const admin = supabaseAdmin();
  const { data } = await admin.from("notifications").select("id,kind,to_email,payload").is("sent_at", null).lt("attempts", MAX_ATTEMPTS).not("to_email", "is", null).limit(50);
  for (const n of data ?? []) await deliver(n.id, n.kind as EmailKind, n.to_email!, n.payload);
  const { count } = await admin.from("notifications").select("id", { count: "exact", head: true }).is("sent_at", null).gte("attempts", MAX_ATTEMPTS);
  return { retried: data?.length ?? 0, deadLetters: count ?? 0 };
}

/** Avisa 15 días antes de la renovación. El índice único (usuario, tipo, fin de periodo) evita avisar dos veces. */
async function renewalReminder() {
  const admin = supabaseAdmin();
  const now = Date.now();
  const { data } = await admin.from("subscriptions").select("id,user_id,renews_at,plans(price_cents),profiles!subscriptions_user_id_fkey(email,full_name)")
    .eq("status", "active").eq("auto_renew", true).gt("renews_at", new Date(now).toISOString()).lte("renews_at", new Date(now + 15 * DAY).toISOString());
  let sent = 0;
  for (const s of (data ?? []) as any[]) { // eslint-disable-line @typescript-eslint/no-explicit-any
    if (!s.profiles?.email) continue;
    await notify({
      userId: s.user_id, kind: "renewal_reminder", to: s.profiles.email,
      payload: { name: s.profiles.full_name, renewsOn: dateEs(s.renews_at), amount: eur(s.plans?.price_cents ?? 0), period_end: s.renews_at },
    });
    sent++;
  }
  return { considered: data?.length ?? 0, sent };
}

/** Recordatorios: resultado calculado sin pagar (3 días) y aprobación pendiente del cliente (2 días). Uno por caso y tipo. */
async function caseNudges() {
  const admin = supabaseAdmin();
  const now = Date.now();
  const defs: { status: string; olderThanDays: number; kind: EmailKind }[] = [
    { status: "calculado", olderThanDays: 3, kind: "nudge_unpaid" },
    { status: "pendiente_aprobacion", olderThanDays: 2, kind: "nudge_approval" },
  ];
  let sent = 0;
  for (const d of defs) {
    const { data } = await admin.from("cases").select("id,user_id,profiles!cases_user_id_fkey(email,full_name)").eq("status", d.status)
      .lt("updated_at", new Date(now - d.olderThanDays * DAY).toISOString()).limit(200);
    for (const c of (data ?? []) as any[]) { // eslint-disable-line @typescript-eslint/no-explicit-any
      const { count } = await admin.from("notifications").select("id", { count: "exact", head: true }).eq("case_id", c.id).eq("kind", d.kind);
      if (count || !c.profiles?.email) continue;
      await notify({ userId: c.user_id, caseId: c.id, kind: d.kind, to: c.profiles.email, payload: { name: c.profiles.full_name } });
      sent++;
    }
  }
  return { sent };
}

/**
 * Borrado diferido (30 días tras pedirlo). Lo que la ley obliga a conservar (facturas y declaraciones presentadas)
 * se queda, pero el perfil se anonimiza y se bloquea el acceso. Sin nada que conservar, se borra el usuario entero.
 */
async function gdprPurge() {
  const admin = supabaseAdmin();
  const cutoff = new Date(Date.now() - 30 * DAY).toISOString();
  const { data: due } = await admin.from("profiles").select("id,email,full_name").not("deleted_at", "is", null).lt("deleted_at", cutoff).not("email", "like", "deleted+%").limit(25);
  let anonymised = 0, deleted = 0;
  for (const p of due ?? []) {
    // Se avisa antes de borrar y sin guardar la notificación: no queremos conservar datos de quien pidió el borrado.
    await sendEmail(p.email, renderEmail("account_deleted", { name: p.full_name })).catch(() => undefined);
    const { count: payments } = await admin.from("payments").select("id", { count: "exact", head: true }).eq("user_id", p.id);
    const { count: filed } = await admin.from("cases").select("id", { count: "exact", head: true }).eq("user_id", p.id).eq("status", "presentado");
    const { data: cases } = await admin.from("cases").select("id").eq("user_id", p.id);
    const ids = (cases ?? []).map((c) => c.id);

    if (ids.length) {
      const { data: docs } = await admin.from("documents").select("storage_path").in("case_id", ids);
      if (docs?.length) await admin.storage.from("case-documents").remove(docs.map((d) => d.storage_path));
      await admin.from("documents").delete().in("case_id", ids);
      await admin.from("messages").delete().in("case_id", ids);
      await admin.from("tax_data").delete().in("case_id", ids);
      await admin.from("questionnaire_answers").delete().in("case_id", ids);
    }
    await admin.from("notifications").delete().eq("user_id", p.id);

    if ((payments ?? 0) > 0 || (filed ?? 0) > 0) {
      await admin.from("profiles").update({ email: `deleted+${p.id}@invalid.local`, full_name: null, nif: null, phone: null }).eq("id", p.id);
      await admin.auth.admin.updateUserById(p.id, { email: `deleted+${p.id}@invalid.local`, ban_duration: "876000h" });
      anonymised++;
    } else {
      await admin.from("subscriptions").delete().eq("user_id", p.id);
      await admin.from("cases").delete().eq("user_id", p.id);
      await admin.auth.admin.deleteUser(p.id);
      deleted++;
    }
  }
  return { anonymised, deleted };
}

export async function runJob(name: JobName) {
  switch (name) {
    case "outbox": return outbox();
    case "renewal-reminder": return renewalReminder();
    case "case-nudges": return caseNudges();
    case "gdpr-purge": return gdprPurge();
  }
}
