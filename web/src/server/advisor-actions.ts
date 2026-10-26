"use server";
// Panel del asesor y acciones de administración. Cada acción comprueba el rol y el acceso al caso con
// requireCaseAccess (además de RLS) y deja rastro en audit_log cuando toca datos fiscales o el estado del caso.
import { randomUUID } from "node:crypto";
import { supabaseAdmin } from "@/lib/supabase/server";
import { normalizeAnswers, type Answers, type Calculation } from "@/lib/tax/engine";
import { requireCaseAccess, requireStaff, requireUser, roleOf } from "./authz";
import { supabaseBillingRepo } from "./billing/supabase-repo";
import { notify } from "./email";
import { assertPlanCoversCase } from "./pricing-guard";
import { AppError, run, type ActionResult } from "./errors";
import { messageSchema, planCodeSchema, safeFileName, uploadSchema, uuidSchema } from "./validation";

const BUCKET = "case-documents";
const PRICE_CENTS = { PRO: 2900, LIVE: 5900, FULL: 11900 } as const; // mismos precios de ejemplo que el catálogo

export type AdvisorCaseDetail = {
  id: string;
  status: string;
  taxYear: number | null;
  client: { name: string; email: string };
  answers: Answers | null;
  calculation: Calculation | null;
  review: { status: string; notes: string; advisorApprovedAt: string | null; userApprovedAt: string | null } | null;
  documents: { id: string; kind: string; name: string; sizeBytes: number; at: string; byClient: boolean }[];
  messages: { id: string; from: string; body: string; at: string }[];
  aeatReference: string | null;
  isAdmin: boolean;
};

export async function advisorCaseDetail(caseId: string): Promise<ActionResult<AdvisorCaseDetail>> {
  return run(async () => {
    const { user, role } = await requireStaff();
    const id = uuidSchema.parse(caseId);
    const c = await requireCaseAccess(user.id, id, "staff");
    const admin = supabaseAdmin();
    const [{ data: profile }, { data: qa }, { data: calcs }, { data: rev }, { data: docs }, { data: msgs }] = await Promise.all([
      admin.from("profiles").select("full_name,email").eq("id", c.user_id).single(),
      admin.from("questionnaire_answers").select("answers").eq("case_id", id).order("version", { ascending: false }).limit(1).maybeSingle(),
      admin.from("calculations").select("output").eq("case_id", id).order("created_at", { ascending: false }).limit(1),
      admin.from("reviews").select("status,notes,advisor_approved_at,user_approved_at").eq("case_id", id).maybeSingle(),
      admin.from("documents").select("id,kind,storage_path,size_bytes,created_at,uploaded_by").eq("case_id", id).order("created_at"),
      admin.from("messages").select("id,sender_kind,body,created_at").eq("case_id", id).order("created_at"),
    ]);
    // Ver los datos fiscales de un cliente queda registrado (RGPD: trazabilidad de accesos del personal).
    await admin.from("audit_log").insert({ actor_id: user.id, action: "advisor_viewed_case", entity: "case", entity_id: id });
    const { __step: _s, ...raw } = (qa?.answers ?? {}) as Record<string, unknown>;
    void _s;
    return {
      id, status: c.status, taxYear: c.tax_year, aeatReference: c.aeat_reference ?? null, isAdmin: role === "admin",
      client: { name: profile?.full_name ?? "Cliente", email: profile?.email ?? "" },
      answers: qa ? normalizeAnswers(raw as Partial<Answers>) : null,
      calculation: ((calcs ?? [])[0]?.output as Calculation | undefined) ?? null,
      review: rev ? { status: rev.status, notes: rev.notes ?? "", advisorApprovedAt: rev.advisor_approved_at, userApprovedAt: rev.user_approved_at } : null,
      documents: (docs ?? []).map((d) => ({ id: d.id, kind: d.kind, name: String(d.storage_path).split("/").pop()!.replace(/^[0-9a-f-]{36}-/, ""), sizeBytes: d.size_bytes, at: d.created_at, byClient: d.uploaded_by === c.user_id })),
      messages: (msgs ?? []).map((m) => ({ id: m.id, from: m.sender_kind, body: m.body, at: m.created_at })),
    };
  });
}

/** El asesor devuelve el caso al cliente con una nota. Se anula una aprobación previa del asesor. */
export async function advisorRequestChanges(caseId: string, notes: string): Promise<ActionResult> {
  return run(async () => {
    const { user } = await requireStaff();
    const id = uuidSchema.parse(caseId);
    const text = messageSchema.parse(notes);
    const c = await requireCaseAccess(user.id, id, "staff");
    if (!["en_revision", "pendiente_aprobacion"].includes(c.status)) throw new AppError("Este caso no está en revisión.", "conflict");
    const admin = supabaseAdmin();
    const { data: review } = await admin.from("reviews").select("id,user_approved_at").eq("case_id", id).maybeSingle();
    if (!review) throw new AppError("Este caso no tiene revisión abierta.", "conflict");
    if (review.user_approved_at) throw new AppError("El cliente ya aprobó la declaración; habla con él antes de cambiarla.", "conflict");
    await admin.from("reviews").update({ status: "cambios_pedidos", notes: text, advisor_approved_at: null }).eq("id", review.id);
    await admin.from("cases").update({ status: "en_revision" }).eq("id", id);
    await admin.from("messages").insert({ case_id: id, sender_id: user.id, sender_kind: "advisor", body: `Necesito que revises algunos datos: ${text}` });
    await admin.from("audit_log").insert({ actor_id: user.id, action: "advisor_requested_changes", entity: "case", entity_id: id });
    const { data: client } = await admin.from("profiles").select("email,full_name").eq("id", c.user_id).single();
    if (client) await notify({ userId: c.user_id, caseId: id, kind: "changes_requested", to: client.email, payload: { name: client.full_name, notes: text } });
  });
}

/** El cliente avisa de que ya corrigió sus datos: la revisión vuelve a pendiente. */
export async function clientResubmit(): Promise<ActionResult> {
  return run(async () => {
    const { user } = await requireUser();
    const admin = supabaseAdmin();
    const { data: c } = await admin.from("cases").select("id").eq("user_id", user.id).eq("case_type", "renta").neq("status", "cancelado")
      .order("created_at", { ascending: false }).limit(1).maybeSingle();
    if (!c) throw new AppError("No tienes ningún caso.", "not_found");
    const { data: review } = await admin.from("reviews").select("id,status").eq("case_id", c.id).maybeSingle();
    if (review?.status !== "cambios_pedidos") throw new AppError("Tu asesor no te ha pedido cambios.", "conflict");
    await admin.from("reviews").update({ status: "pendiente" }).eq("id", review.id);
    await admin.from("messages").insert({ case_id: c.id, sender_kind: "system", body: "Has corregido tus datos. Tu asesor volverá a revisarlos." });
  });
}

export async function advisorSendMessage(caseId: string, body: string): Promise<ActionResult> {
  return run(async () => {
    const { user } = await requireStaff();
    const id = uuidSchema.parse(caseId);
    const text = messageSchema.parse(body);
    await requireCaseAccess(user.id, id, "staff");
    const { error } = await supabaseAdmin().from("messages").insert({ case_id: id, sender_id: user.id, sender_kind: "advisor", body: text });
    if (error) throw error;
  });
}

/** URL firmada de 60 s para descargar un documento. Vale para el dueño del caso y para su asesor; queda registrada. */
export async function documentDownloadUrl(documentId: string): Promise<ActionResult<{ url: string }>> {
  return run(async () => {
    const { user } = await requireUser();
    const id = uuidSchema.parse(documentId);
    const admin = supabaseAdmin();
    const { data: doc } = await admin.from("documents").select("case_id,storage_path").eq("id", id).maybeSingle();
    if (!doc) throw new AppError("Documento no encontrado.", "not_found");
    const role = await roleOf(user.id);
    await requireCaseAccess(user.id, doc.case_id, role === "client" ? "owner" : "staff");
    const { data, error } = await admin.storage.from(BUCKET).createSignedUrl(doc.storage_path, 60, { download: true });
    if (error || !data) throw new Error("signed download failed");
    await admin.from("audit_log").insert({ actor_id: user.id, action: "document_downloaded", entity: "document", entity_id: id });
    return { url: data.signedUrl };
  });
}

/** Subida de la declaración (PDF) por el asesor: URL firmada y después registro. */
export async function advisorUploadUrl(caseId: string, input: unknown): Promise<ActionResult<{ path: string; token: string }>> {
  return run(async () => {
    const { user } = await requireStaff();
    const id = uuidSchema.parse(caseId);
    const f = uploadSchema.omit({ kind: true }).parse(input);
    if (f.mime !== "application/pdf") throw new AppError("La declaración debe ser un PDF.", "invalid");
    await requireCaseAccess(user.id, id, "staff");
    const path = `${id}/${randomUUID()}-${safeFileName(f.name)}`;
    const { data, error } = await supabaseAdmin().storage.from(BUCKET).createSignedUploadUrl(path);
    if (error || !data) throw new Error("signed upload failed");
    return { path, token: data.token };
  });
}

export async function advisorRegisterDeclaration(caseId: string, path: string, sizeBytes: number): Promise<ActionResult> {
  return run(async () => {
    const { user } = await requireStaff();
    const id = uuidSchema.parse(caseId);
    if (!path.startsWith(`${id}/`)) throw new AppError("Ruta de archivo no válida.", "invalid");
    const c = await requireCaseAccess(user.id, id, "staff");
    const admin = supabaseAdmin();
    const { data: exists } = await admin.storage.from(BUCKET).exists(path);
    if (!exists) throw new AppError("No hemos recibido el archivo. Inténtalo de nuevo.", "invalid");
    const { error } = await admin.from("documents").insert({ case_id: id, uploaded_by: user.id, kind: "declaracion", storage_path: path, mime: "application/pdf", size_bytes: sizeBytes });
    if (error) throw error;
    await admin.from("messages").insert({ case_id: id, sender_id: user.id, sender_kind: "advisor", body: "He subido tu declaración en PDF. La tienes en los documentos de tu caso." });
    await admin.from("audit_log").insert({ actor_id: user.id, action: "declaration_uploaded", entity: "case", entity_id: id });
    void c;
  });
}

/**
 * Solo admin: registra un pago recibido fuera de Stripe (transferencia, Bizum, efectivo) y abre la revisión.
 * Reutiliza el mismo camino que el webhook de Stripe, así que factura, asesor y revisión se crean igual y es idempotente.
 */
export async function adminMarkPaid(caseId: string, planCode: string): Promise<ActionResult> {
  return run(async () => {
    const { user, role } = await requireStaff();
    if (role !== "admin") throw new AppError("Solo un administrador puede registrar pagos.", "forbidden");
    const id = uuidSchema.parse(caseId);
    const code = planCodeSchema.parse(planCode);
    const admin = supabaseAdmin();
    const { data: c } = await admin.from("cases").select("id,user_id,status").eq("id", id).single();
    if (!c) throw new AppError("Caso no encontrado.", "not_found");
    if (c.status !== "calculado") throw new AppError("Solo se puede registrar el pago de un caso calculado y sin pagar.", "conflict");
    await assertPlanCoversCase(id, code);
    await supabaseBillingRepo().completeCheckout({
      caseId: id, userId: c.user_id, planCode: code, customerId: null, subscriptionId: null,
      paymentIntentId: `manual-${id}`, amountCents: PRICE_CENTS[code], currency: "EUR",
    });
    await admin.from("audit_log").insert({ actor_id: user.id, action: "manual_payment_recorded", entity: "case", entity_id: id, meta: { plan: code } });
    // Sin asesores dados de alta, el caso se queda en «pagado» sin revisión: lo asume quien registra el pago.
    await assignIfUnassigned(id, user.id);
  });
}

/** Asigna el caso a este miembro del equipo si nadie lo lleva todavía, y abre la revisión. */
async function assignIfUnassigned(caseId: string, staffId: string) {
  const admin = supabaseAdmin();
  const { data: c } = await admin.from("cases").select("advisor_id,status").eq("id", caseId).single();
  if (!c || c.advisor_id) return;
  await admin.from("cases").update({ advisor_id: staffId, status: c.status === "pagado" ? "en_revision" : c.status }).eq("id", caseId);
  const { data: rev } = await admin.from("reviews").select("id").eq("case_id", caseId).maybeSingle();
  if (!rev) await admin.from("reviews").insert({ case_id: caseId, advisor_id: staffId });
}

/** Solo admin: asumir un caso pagado que no tiene asesor (por ejemplo, si no había ninguno libre al pagar). */
export async function adminAssignToMe(caseId: string): Promise<ActionResult> {
  return run(async () => {
    const { user, role } = await requireStaff();
    if (role !== "admin") throw new AppError("Solo un administrador puede asignar casos.", "forbidden");
    const id = uuidSchema.parse(caseId);
    await assignIfUnassigned(id, user.id);
    await supabaseAdmin().from("audit_log").insert({ actor_id: user.id, action: "case_assigned", entity: "case", entity_id: id });
  });
}
