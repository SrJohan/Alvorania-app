"use server";
import { createHash, randomUUID } from "node:crypto";
import { publicEnv } from "@/lib/env";
import { serverEnv } from "@/server/env";
import { supabaseAdmin, supabaseForUser } from "@/lib/supabase/server";
import { calculate } from "@/lib/tax/engine";
import { rulesFromRows } from "@/lib/tax/load";
import { FORAL_CCAA } from "@/lib/tax/rules";
import type { DemoState } from "@/lib/data/types";
import { clientIp, rateLimit, requireCaseAccess, requireStaff, requireUser } from "./authz";
import { notify } from "./email";
import { magicLinkError } from "./auth-errors";
import { AppError, run, type ActionResult } from "./errors";
import { loadState } from "./state";
import { priceIdForPlan, stripe } from "./stripe";
import {
  answersDraftSchema, answersSchema, consentKindSchema, emailSchema, messageSchema, nameSchema, planCodeSchema, safeFileName, stepSchema, uploadSchema, uuidSchema,
} from "./validation";

const BUCKET = "case-documents";

async function myRentaCase(userId: string) {
  const { data } = await supabaseAdmin().from("cases").select("*").eq("user_id", userId).eq("case_type", "renta").neq("status", "cancelado")
    .order("created_at", { ascending: false }).limit(1).maybeSingle();
  if (!data) throw new AppError("Primero crea tu caso.", "not_found");
  return data;
}

// ---------- sesión ----------

export async function requestMagicLink(input: { email: string; fullName: string; next?: string }): Promise<ActionResult<{ sent: true }>> {
  return run(async () => {
    const email = emailSchema.parse(input.email);
    const fullName = nameSchema.parse(input.fullName);
    const ip = await clientIp();
    await rateLimit(`login:ip:${ip}`, 10, 600);
    // Se guarda un hash, no el email: la tabla de límites no debe contener datos personales.
    await rateLimit(`login:email:${createHash("sha256").update(email).digest("hex").slice(0, 32)}`, 3, 600);
    const sb = await supabaseForUser();
    const { error } = await sb.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${publicEnv.siteUrl}/auth/callback`, data: { full_name: fullName }, shouldCreateUser: true },
    });
    if (error) throw magicLinkError(error);
    return { sent: true as const };
  });
}

export async function signOutAction(): Promise<ActionResult> {
  return run(async () => {
    const { sb } = await requireUser();
    await sb.auth.signOut({ scope: "global" }); // cierra sesión en todos los dispositivos
  });
}

export async function getState(): Promise<ActionResult<DemoState>> {
  return run(async () => {
    const { sb, user } = await requireUser();
    return loadState(sb, user.id);
  });
}

// ---------- caso del cliente ----------

export async function recordConsent(kind: string, granted: boolean): Promise<ActionResult> {
  return run(async () => {
    const { sb, user } = await requireUser();
    const k = consentKindSchema.parse(kind);
    const ip = await clientIp();
    const { error } = await sb.from("consents").insert({ user_id: user.id, kind: k, version: "2026-10", granted, ip: ip === "unknown" ? null : ip });
    if (error) throw error;
  });
}

export async function createCase(taxYear: number): Promise<ActionResult> {
  return run(async () => {
    const { sb, user } = await requireUser();
    const year = answersDraftSchema.shape.taxYear.parse(taxYear);
    const { error } = await sb.from("cases").insert({ user_id: user.id, case_type: "renta", tax_year: year, status: "borrador" });
    if (error && error.code !== "23505") throw error; // 23505: ya tiene un caso vivo (doble clic), no es un error
  });
}

export async function setDataSource(source: string): Promise<ActionResult> {
  return run(async () => {
    const { sb, user } = await requireUser();
    const s = source === "documento" ? "documento" : "manual";
    const c = await myRentaCase(user.id);
    const { error } = await sb.from("tax_data").upsert({ case_id: c.id, source: s }, { onConflict: "case_id" });
    if (error) throw error;
  });
}

export async function saveAnswers(input: unknown, step: number): Promise<ActionResult> {
  return run(async () => {
    const { sb, user } = await requireUser();
    const answers = answersDraftSchema.parse(input);
    const c = await myRentaCase(user.id);
    if (["presentado", "cerrado", "cancelado"].includes(c.status)) throw new AppError("Este caso ya no admite cambios.", "conflict");
    const { error } = await sb.from("questionnaire_answers").upsert(
      { case_id: c.id, version: 1, answers: { ...answers, __step: stepSchema.parse(step) } },
      { onConflict: "case_id,version" },
    );
    if (error) throw error;
  });
}

export async function runCalculation(): Promise<ActionResult> {
  return run(async () => {
    const { user } = await requireUser();
    await rateLimit(`calc:user:${user.id}`, 30, 3600);
    const admin = supabaseAdmin();
    const c = await myRentaCase(user.id);
    const { data: qa } = await admin.from("questionnaire_answers").select("answers").eq("case_id", c.id).order("version", { ascending: false }).limit(1).maybeSingle();
    if (!qa) throw new AppError("Completa el cuestionario primero.", "invalid");
    const { __step: _ignored, ...raw } = qa.answers as Record<string, unknown>;
    void _ignored;
    const answers = answersSchema.parse(raw);
    if (!answers.ccaa) throw new AppError("Indica tu comunidad.", "invalid");
    if ((FORAL_CCAA as readonly string[]).includes(answers.ccaa)) throw new AppError("Los casos de régimen foral los calcula un asesor.", "invalid");

    const { data: ruleRows, error: rulesErr } = await admin.from("tax_rules").select("tax_year,territory,kind,code,rule,reviewed_at").eq("tax_year", answers.taxYear).eq("territory", "ESTATAL");
    if (rulesErr) throw rulesErr;
    const rules = rulesFromRows(ruleRows ?? [], { requireReviewed: serverEnv().REQUIRE_REVIEWED_TAX_RULES === "true" });
    const calc = calculate(answers, rules);

    const { error } = await admin.from("calculations").insert({
      case_id: c.id, rules_snapshot: rules, input: answers, output: calc, result_amount_cents: calc.resultCents, engine_version: calc.engineVersion, created_by: user.id,
    });
    if (error) throw error;
    await admin.from("cases").update({
      result_amount_cents: calc.resultCents, savings_cents: calc.savingsCents, regime: "comun",
      ...(c.status === "borrador" ? { status: "calculado" } : {}),
    }).eq("id", c.id);
  });
}

// ---------- pago ----------

export async function createCheckout(planCode: string): Promise<ActionResult<{ url: string }>> {
  return run(async () => {
    const { user } = await requireUser();
    const code = planCodeSchema.parse(planCode);
    await rateLimit(`checkout:user:${user.id}`, 10, 3600);
    const admin = supabaseAdmin();
    const c = await myRentaCase(user.id);
    if (c.status !== "calculado") throw new AppError("Este caso no está listo para contratar.", "conflict");

    const { data: mandate } = await admin.from("consents").select("granted").eq("user_id", user.id).eq("kind", "mandate_presentacion")
      .order("created_at", { ascending: false }).limit(1).maybeSingle();
    if (!mandate?.granted) throw new AppError("Autoriza la presentación de tu declaración para continuar.", "invalid");

    const { data: profile } = await admin.from("profiles").select("email,full_name,stripe_customer_id").eq("id", user.id).single();
    if (!profile) throw new AppError("Perfil no encontrado.", "not_found");
    let customer = profile.stripe_customer_id as string | null;
    if (!customer) {
      const created = await stripe().customers.create({ email: profile.email, name: profile.full_name ?? undefined, metadata: { user_id: user.id } }, { idempotencyKey: `customer:${user.id}` });
      customer = created.id;
      await admin.from("profiles").update({ stripe_customer_id: customer }).eq("id", user.id);
    }

    const meta = { case_id: c.id, user_id: user.id, plan_code: code };
    const session = await stripe().checkout.sessions.create({
      mode: "subscription",
      customer,
      client_reference_id: c.id,
      line_items: [{ price: priceIdForPlan(code), quantity: 1 }],
      locale: "es",
      metadata: meta,
      subscription_data: { metadata: meta },
      success_url: `${publicEnv.siteUrl}/app/caso?pago=ok`,
      cancel_url: `${publicEnv.siteUrl}/app/plan?pago=cancelado`,
    }, { idempotencyKey: `checkout:${c.id}:${code}:${Math.floor(Date.now() / 600000)}` });
    if (!session.url) throw new Error("stripe session without url");
    return { url: session.url };
  });
}

export async function openBillingPortal(): Promise<ActionResult<{ url: string }>> {
  return run(async () => {
    const { user } = await requireUser();
    const { data: profile } = await supabaseAdmin().from("profiles").select("stripe_customer_id").eq("id", user.id).single();
    if (!profile?.stripe_customer_id) throw new AppError("Todavía no tienes ninguna suscripción.", "not_found");
    const s = await stripe().billingPortal.sessions.create({ customer: profile.stripe_customer_id, return_url: `${publicEnv.siteUrl}/app/suscripcion` });
    return { url: s.url };
  });
}

/** Cancelar es un clic: la renovación se desactiva y el plan sigue hasta el final del periodo pagado. */
export async function cancelRenewal(): Promise<ActionResult> {
  return run(async () => {
    const { user } = await requireUser();
    const admin = supabaseAdmin();
    const { data: sub } = await admin.from("subscriptions").select("id,stripe_subscription_id").eq("user_id", user.id).eq("status", "active")
      .order("created_at", { ascending: false }).limit(1).maybeSingle();
    if (!sub?.stripe_subscription_id) throw new AppError("No tienes ninguna suscripción activa.", "not_found");
    await stripe().subscriptions.update(sub.stripe_subscription_id, { cancel_at_period_end: true });
    await admin.from("subscriptions").update({ auto_renew: false, canceled_at: new Date().toISOString() }).eq("id", sub.id);
  });
}

// ---------- mensajes, documentos y aprobación ----------

export async function sendMessage(body: string): Promise<ActionResult> {
  return run(async () => {
    const { sb, user } = await requireUser();
    const text = messageSchema.parse(body);
    await rateLimit(`msg:user:${user.id}`, 30, 600);
    const c = await myRentaCase(user.id);
    const { data: sub } = await sb.from("subscriptions").select("plans(features)").in("status", ["active", "past_due"]).limit(1).maybeSingle();
    const plan = sub?.plans as unknown as { features?: { chat?: boolean } } | null;
    if (!plan?.features?.chat) throw new AppError("El chat con tu asesor está incluido en los planes Acompañado y Completo.", "forbidden");
    const { error } = await sb.from("messages").insert({ case_id: c.id, sender_id: user.id, sender_kind: "user", body: text });
    if (error) throw error;
  });
}

export async function createUploadUrl(input: unknown): Promise<ActionResult<{ path: string; token: string }>> {
  return run(async () => {
    const { sb, user } = await requireUser();
    const f = uploadSchema.parse(input);
    await rateLimit(`upload:user:${user.id}`, 20, 3600);
    const admin = supabaseAdmin();

    // Las cartas de Hacienda van a un caso propio de tipo requerimiento; el resto, al caso de renta.
    let caseId: string;
    if (f.kind === "carta_hacienda") {
      const { data: existing } = await admin.from("cases").select("id").eq("user_id", user.id).eq("case_type", "requerimiento").neq("status", "cancelado")
        .order("created_at", { ascending: false }).limit(1).maybeSingle();
      if (existing) caseId = existing.id;
      else {
        const { data: created, error } = await sb.from("cases").insert({ user_id: user.id, case_type: "requerimiento", status: "borrador" }).select("id").single();
        if (error) throw error;
        caseId = created.id;
      }
    } else {
      caseId = (await myRentaCase(user.id)).id;
    }
    await requireCaseAccess(user.id, caseId, "owner");
    const path = `${caseId}/${randomUUID()}-${safeFileName(f.name)}`;
    const { data, error } = await admin.storage.from(BUCKET).createSignedUploadUrl(path);
    if (error || !data) throw new Error("signed upload failed");
    return { path, token: data.token };
  });
}

export async function registerDocument(input: { path: string; kind: string; mime: string; sizeBytes: number }): Promise<ActionResult> {
  return run(async () => {
    const { user } = await requireUser();
    const f = uploadSchema.pick({ kind: true, mime: true, sizeBytes: true }).parse(input);
    const [caseIdRaw] = String(input.path).split("/");
    const caseId = uuidSchema.parse(caseIdRaw);
    await requireCaseAccess(user.id, caseId, "owner");
    const admin = supabaseAdmin();
    // El archivo debe existir de verdad en el bucket antes de registrarlo.
    const { data: exists } = await admin.storage.from(BUCKET).exists(input.path);
    if (!exists) throw new AppError("No hemos recibido el archivo. Inténtalo de nuevo.", "invalid");
    const { error } = await admin.from("documents").insert({ case_id: caseId, uploaded_by: user.id, kind: f.kind, storage_path: input.path, mime: f.mime, size_bytes: f.sizeBytes });
    if (error) throw error;
  });
}

export async function userApprove(): Promise<ActionResult> {
  return run(async () => {
    const { user } = await requireUser();
    const admin = supabaseAdmin();
    const c = await myRentaCase(user.id);
    const { data: review } = await admin.from("reviews").select("id,advisor_approved_at,user_approved_at").eq("case_id", c.id).maybeSingle();
    if (!review?.advisor_approved_at) throw new AppError("El asesor aún no ha aprobado la declaración.", "conflict");
    if (review.user_approved_at) return;
    const ip = await clientIp();
    const { error } = await admin.from("reviews").update({ user_approved_at: new Date().toISOString(), user_approval_ip: ip === "unknown" ? null : ip })
      .eq("id", review.id).is("user_approved_at", null);
    if (error) throw error;
    await admin.from("audit_log").insert({ actor_id: user.id, action: "user_approved_submission", entity: "case", entity_id: c.id });
  });
}

// ---------- panel de asesor ----------

export async function advisorCases(): Promise<ActionResult<{ id: string; status: string; taxYear: number | null; client: string; resultCents: number | null; advisorApproved: boolean; userApproved: boolean }[]>> {
  return run(async () => {
    const { user, role } = await requireStaff();
    const admin = supabaseAdmin();
    let q = admin.from("cases").select("id,status,tax_year,result_amount_cents,user_id,advisor_id,profiles!cases_user_id_fkey(full_name,email),reviews(advisor_approved_at,user_approved_at)")
      .in("status", ["en_revision", "pendiente_aprobacion", "pagado"]).order("created_at");
    if (role === "advisor") q = q.eq("advisor_id", user.id);
    const { data, error } = await q;
    if (error) throw error;
    return ((data ?? []) as any[]).map((c) => { // eslint-disable-line @typescript-eslint/no-explicit-any
      const rev = Array.isArray(c.reviews) ? c.reviews[0] : c.reviews;
      return { id: c.id, status: c.status, taxYear: c.tax_year, client: c.profiles?.full_name ?? c.profiles?.email ?? "Cliente", resultCents: c.result_amount_cents, advisorApproved: !!rev?.advisor_approved_at, userApproved: !!rev?.user_approved_at };
    });
  });
}

export async function advisorApprove(caseId: string): Promise<ActionResult> {
  return run(async () => {
    const { user } = await requireStaff();
    const id = uuidSchema.parse(caseId);
    const c = await requireCaseAccess(user.id, id, "staff");
    const admin = supabaseAdmin();
    const { data: review } = await admin.from("reviews").select("id,advisor_approved_at").eq("case_id", id).maybeSingle();
    if (!review) throw new AppError("Este caso no tiene revisión abierta.", "conflict");
    if (review.advisor_approved_at) return;
    await admin.from("reviews").update({ status: "aprobada_por_asesor", advisor_approved_at: new Date().toISOString() }).eq("id", review.id);
    await admin.from("cases").update({ status: "pendiente_aprobacion" }).eq("id", id);
    await admin.from("messages").insert({ case_id: id, sender_id: user.id, sender_kind: "advisor", body: "He revisado tu declaración y todo está correcto. Falta tu confirmación para presentarla." });
    await admin.from("audit_log").insert({ actor_id: user.id, action: "advisor_approved", entity: "case", entity_id: id });
    const { data: client } = await admin.from("profiles").select("email,full_name").eq("id", c.user_id).single();
    if (client) await notify({ userId: c.user_id, caseId: id, kind: "advisor_approved", to: client.email, payload: { name: client.full_name } });
  });
}

/** Registra que la declaración se presentó en la sede electrónica. La presentación en sí la hace la persona con el certificado de colaborador social. */
export async function advisorSubmit(caseId: string, aeatReference: string): Promise<ActionResult> {
  return run(async () => {
    const { user } = await requireStaff();
    const id = uuidSchema.parse(caseId);
    const reference = nameSchema.max(80).parse(aeatReference);
    const c = await requireCaseAccess(user.id, id, "staff");
    const admin = supabaseAdmin();
    // El trigger guard_case_submission rechaza esto si faltan las dos aprobaciones.
    const { error } = await admin.from("cases").update({ status: "presentado", aeat_reference: reference }).eq("id", id);
    if (error) throw new AppError(error.message.includes("approval") ? "Faltan las aprobaciones del asesor o del cliente." : "No se ha podido registrar la presentación.", "conflict");
    await admin.from("messages").insert({ case_id: id, sender_kind: "system", body: "Tu declaración se ha presentado correctamente." });
    await admin.from("audit_log").insert({ actor_id: user.id, action: "case_submitted", entity: "case", entity_id: id, meta: { reference } });
    const { data: client } = await admin.from("profiles").select("email,full_name").eq("id", c.user_id).single();
    if (client) await notify({ userId: c.user_id, caseId: id, kind: "submitted", to: client.email, payload: { name: client.full_name, reference } });
  });
}

// ---------- RGPD ----------

export async function exportMyData(): Promise<ActionResult<Record<string, unknown>>> {
  return run(async () => {
    const { sb, user } = await requireUser();
    await rateLimit(`export:user:${user.id}`, 3, 3600);
    const tables = ["profiles", "consents", "cases", "questionnaire_answers", "tax_data", "calculations", "documents", "messages", "reviews", "subscriptions", "payments", "notifications"];
    const out: Record<string, unknown> = { exported_at: new Date().toISOString() };
    for (const t of tables) {
      const { data } = await sb.from(t).select("*");
      out[t] = data ?? [];
    }
    return out;
  });
}

export async function deleteMyAccount(): Promise<ActionResult> {
  return run(async () => {
    const { sb, user } = await requireUser();
    const admin = supabaseAdmin();
    const { data: subs } = await admin.from("subscriptions").select("stripe_subscription_id").eq("user_id", user.id).in("status", ["active", "past_due"]);
    for (const s of subs ?? []) if (s.stripe_subscription_id) await stripe().subscriptions.cancel(s.stripe_subscription_id);
    await admin.from("profiles").update({ deleted_at: new Date().toISOString() }).eq("id", user.id);
    await admin.from("audit_log").insert({ actor_id: user.id, action: "account_deletion_requested", entity: "profile", entity_id: user.id });
    await sb.auth.signOut({ scope: "global" });
  });
}

