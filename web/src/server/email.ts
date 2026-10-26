import "server-only";
import { Resend } from "resend";
import { publicEnv } from "@/lib/env";
import { resendEnv } from "@/server/env";
import { supabaseAdmin } from "@/lib/supabase/server";

export type EmailKind =
  | "payment_received" | "advisor_approved" | "submitted" | "renewal_reminder"
  | "nudge_unpaid" | "nudge_approval" | "account_deleted" | "changes_requested";

const ESCAPES: Record<string, string> = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
export const esc = (s: unknown) => String(s ?? "").replace(/[&<>"']/g, (c) => ESCAPES[c]);

export type Rendered = { subject: string; html: string; text: string };

function layout(title: string, bodyHtml: string, cta?: { label: string; href: string }) {
  const button = cta
    ? `<p style="margin:24px 0 0"><a href="${esc(cta.href)}" style="background:#5631b5;color:#ffffff;text-decoration:none;padding:12px 22px;border-radius:999px;font-weight:600;display:inline-block">${esc(cta.label)}</a></p>`
    : "";
  return `<!doctype html><html lang="es"><body style="margin:0;background:#fbf9ff;font-family:system-ui,Segoe UI,Arial,sans-serif;color:#211350">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:24px">
<table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:12px;padding:32px">
<tr><td><p style="margin:0 0 20px;font-size:22px;font-weight:800;letter-spacing:-0.06em;color:#39177d">alvorania</p><p style="margin:0 0 16px;font-size:20px;font-weight:700">${esc(title)}</p>${bodyHtml}${button}
<p style="margin:32px 0 0;font-size:12px;color:#625a78">Alvorania. Si no esperabas este correo, puedes ignorarlo.</p>
</td></tr></table></td></tr></table></body></html>`;
}

const url = (path: string) => `${publicEnv.siteUrl}${path}`;

export function renderEmail(kind: EmailKind, p: Record<string, unknown>): Rendered {
  const name = esc(p.name || "");
  const hi = name ? `Hola ${name},` : "Hola,";
  switch (kind) {
    case "payment_received":
      return {
        subject: "Hemos recibido tu pago",
        html: layout("Pago recibido", `<p>${hi}</p><p>Hemos recibido tu pago. Un asesor ya está revisando tu declaración. Tu factura es la <strong>${esc(p.invoice)}</strong>.</p>`, { label: "Ver mi caso", href: url("/app/caso") }),
        text: `${hi}\nHemos recibido tu pago (factura ${p.invoice}). Un asesor ya revisa tu declaración.\n${url("/app/caso")}`,
      };
    case "advisor_approved":
      return {
        subject: "Tu declaración está lista para tu confirmación",
        html: layout("Falta tu confirmación", `<p>${hi}</p><p>Tu asesor ha revisado la declaración. Para presentarla necesitamos que la revises y la apruebes tú.</p>`, { label: "Revisar y aprobar", href: url("/app/revision") }),
        text: `${hi}\nTu asesor ha revisado tu declaración. Revísala y apruébala aquí: ${url("/app/revision")}`,
      };
    case "submitted":
      return {
        subject: "Tu declaración se ha presentado",
        html: layout("Declaración presentada", `<p>${hi}</p><p>Tu declaración se ha presentado ante Hacienda. Justificante: <strong>${esc(p.reference)}</strong>.</p>`, { label: "Ver mi caso", href: url("/app/caso") }),
        text: `${hi}\nTu declaración se ha presentado. Justificante: ${p.reference}\n${url("/app/caso")}`,
      };
    case "renewal_reminder":
      return {
        subject: "Tu plan se renueva pronto",
        html: layout("Aviso de renovación", `<p>${hi}</p><p>Tu plan se renovará el <strong>${esc(p.renewsOn)}</strong> por ${esc(p.amount)}. Si no quieres renovarlo, puedes cancelarlo con un clic antes de esa fecha.</p>`, { label: "Gestionar mi suscripción", href: url("/app/suscripcion") }),
        text: `${hi}\nTu plan se renueva el ${p.renewsOn} por ${p.amount}. Puedes cancelarlo aquí: ${url("/app/suscripcion")}`,
      };
    case "nudge_unpaid":
      return {
        subject: "Tu resultado de la renta te está esperando",
        html: layout("Tu resultado está guardado", `<p>${hi}</p><p>Calculaste tu renta pero aún no has pedido que la revise un asesor. Tus datos siguen guardados.</p>`, { label: "Continuar", href: url("/app/resultado") }),
        text: `${hi}\nTu resultado está guardado. Continúa aquí: ${url("/app/resultado")}`,
      };
    case "nudge_approval":
      return {
        subject: "Recuerda aprobar tu declaración",
        html: layout("Tu declaración espera tu visto bueno", `<p>${hi}</p><p>No se presentará hasta que la apruebes. Revisa el resumen cuando puedas.</p>`, { label: "Revisar y aprobar", href: url("/app/revision") }),
        text: `${hi}\nApruébala aquí cuando quieras: ${url("/app/revision")}`,
      };
    case "changes_requested":
      return {
        subject: "Tu asesor necesita que revises algunos datos",
        html: layout("Revisa tus datos", `<p>${hi}</p><p>Tu asesor ha revisado tu declaración y necesita que corrijas o completes algo:</p><blockquote style="margin:12px 0;padding:12px 16px;background:#f6f2ea;border-radius:8px">${esc(p.notes)}</blockquote>`, { label: "Revisar mis datos", href: url("/app/caso") }),
        text: `${hi}
Tu asesor necesita que revises algunos datos:
${p.notes}
${url("/app/caso")}`,
      };
    case "account_deleted":
      return {
        subject: "Hemos eliminado tu cuenta",
        html: layout("Cuenta eliminada", `<p>${hi}</p><p>Hemos eliminado tus datos personales. Por obligación legal conservamos durante el plazo exigido las facturas y las declaraciones presentadas.</p>`),
        text: `${hi}\nHemos eliminado tu cuenta y tus datos personales. Conservamos solo lo que la ley exige (facturas y declaraciones presentadas).`,
      };
  }
}

export async function sendEmail(to: string, r: Rendered) {
  const env = resendEnv();
  const { error } = await new Resend(env.RESEND_API_KEY).emails.send({ from: env.EMAIL_FROM, to, subject: r.subject, html: r.html, text: r.text });
  if (error) throw new Error(error.message);
}

/** Guarda la notificación y la intenta enviar. Si falla, el job `outbox` la reintenta (hasta 5 veces). */
export async function notify(args: { userId: string; caseId?: string | null; kind: EmailKind; to: string; payload: Record<string, unknown> }) {
  const admin = supabaseAdmin();
  const { data, error } = await admin.from("notifications").insert({
    user_id: args.userId, case_id: args.caseId ?? null, kind: args.kind, channel: "email", payload: args.payload, to_email: args.to,
  }).select("id").single();
  if (error) {
    if (error.code === "23505") return; // aviso ya programado (índice único de renovaciones)
    throw error;
  }
  await deliver(data.id, args.kind, args.to, args.payload);
}

export async function deliver(id: string, kind: EmailKind, to: string, payload: Record<string, unknown>) {
  const admin = supabaseAdmin();
  try {
    await sendEmail(to, renderEmail(kind, payload));
    await admin.from("notifications").update({ sent_at: new Date().toISOString(), last_error: null }).eq("id", id);
  } catch (e) {
    const { data } = await admin.from("notifications").select("attempts").eq("id", id).single();
    await admin.from("notifications").update({ attempts: (data?.attempts ?? 0) + 1, last_error: e instanceof Error ? e.message.slice(0, 300) : "error" }).eq("id", id);
  }
}
