import type { SupabaseClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "@/lib/supabase/server";
import { emptyAnswers, type Answers, type Calculation } from "@/lib/tax/engine";
import { initialStateShape } from "@/lib/data/shape";
import type { CaseRow, DemoState, DocumentRow, Message, PlanCode, Subscription } from "@/lib/data/types";

type Row = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any

/**
 * Construye el estado que ven las pantallas a partir de la base de datos, con la sesión del usuario (RLS activo):
 * si una política estuviera mal, aquí tampoco aparecerían datos ajenos.
 */
export async function loadState(sb: SupabaseClient, userId: string): Promise<DemoState> {
  const state = initialStateShape();

  const { data: profile } = await sb.from("profiles").select("email,full_name").eq("id", userId).maybeSingle();
  if (!profile) return state;
  state.user = { email: profile.email, fullName: profile.full_name ?? profile.email.split("@")[0] };

  const { data: consents } = await sb.from("consents").select("kind,granted,created_at").order("created_at", { ascending: false });
  const seen = new Set<string>();
  for (const c of (consents ?? []) as Row[]) {
    if (seen.has(c.kind)) continue;
    seen.add(c.kind);
    if (c.kind === "terms") state.consents.terms = c.granted;
    if (c.kind === "privacy") state.consents.privacy = c.granted;
    if (c.kind === "aeat_data_access") state.consents.aeatDataAccess = c.granted;
    if (c.kind === "mandate_presentacion") state.consents.mandate = c.granted;
  }

  const { data: cases } = await sb.from("cases").select("*").neq("status", "cancelado").order("created_at", { ascending: false });
  const rows = (cases ?? []) as Row[];
  const renta = rows.find((c) => c.case_type === "renta");

  if (renta) state.case = await loadCase(sb, renta);

  const caseIds = rows.map((c) => c.id as string);
  if (renta) {
    const { data: msgs } = await sb.from("messages").select("id,sender_kind,body,created_at").eq("case_id", renta.id).order("created_at");
    state.messages = ((msgs ?? []) as Row[]).map((m): Message => ({ id: m.id, from: m.sender_kind === "user" ? "user" : m.sender_kind, body: m.body, at: m.created_at }));
  }
  if (caseIds.length) {
    const { data: docs } = await sb.from("documents").select("id,kind,storage_path,size_bytes,created_at").in("case_id", caseIds).order("created_at");
    state.documents = ((docs ?? []) as Row[]).map((d): DocumentRow => ({
      id: d.id, kind: d.kind, name: String(d.storage_path).split("/").pop()!.replace(/^[0-9a-f-]{36}-/, ""), sizeBytes: d.size_bytes, at: d.created_at,
    }));
    if (state.documents.some((d) => d.kind === "carta_hacienda")) state.requerimientoStatus = "analizado";
  }

  const { data: subs } = await sb.from("subscriptions").select("status,auto_renew,renews_at,canceled_at,plans(code)").order("created_at", { ascending: false }).limit(1);
  const sub = (subs ?? [])[0] as Row | undefined;
  if (sub?.plans?.code) {
    const code = sub.plans.code as PlanCode;
    state.planCode = code;
    state.subscription = {
      planCode: code, renewsAt: sub.renews_at ?? new Date().toISOString(), autoRenew: !!sub.auto_renew, canceledAt: sub.canceled_at ?? null,
    } satisfies Subscription;
  }
  return state;
}

async function loadCase(sb: SupabaseClient, c: Row): Promise<CaseRow> {
  const [{ data: qa }, { data: td }, { data: calcs }, { data: rev }] = await Promise.all([
    sb.from("questionnaire_answers").select("answers").eq("case_id", c.id).order("version", { ascending: false }).limit(1).maybeSingle(),
    sb.from("tax_data").select("source").eq("case_id", c.id).maybeSingle(),
    sb.from("calculations").select("output").eq("case_id", c.id).order("created_at", { ascending: false }).limit(1),
    sb.from("reviews").select("status,advisor_id,advisor_approved_at,user_approved_at,notes").eq("case_id", c.id).maybeSingle(),
  ]);

  const { __step, ...answers } = ((qa?.answers ?? {}) as Row);
  let advisorName = "Tu asesor";
  let advisorColegiado: string | null = null;
  let advisorReturning = false;
  if (rev?.advisor_id) {
    // El cliente no puede leer el perfil del asesor (RLS); solo se exponen el nombre y el nº de colegiado.
    const admin = supabaseAdmin();
    const { data: adv } = await admin.from("profiles").select("full_name,colegiado_no").eq("id", rev.advisor_id).maybeSingle();
    if (adv?.full_name) advisorName = adv.full_name;
    advisorColegiado = adv?.colegiado_no ?? null;
    // F2: ¿es el mismo asesor que ya llevó un caso anterior de este cliente?
    const { count } = await admin.from("cases").select("id", { count: "exact", head: true })
      .eq("user_id", c.user_id).eq("advisor_id", rev.advisor_id).neq("id", c.id);
    advisorReturning = (count ?? 0) > 0;
  }

  return {
    id: c.id,
    status: c.status,
    taxYear: c.tax_year ?? 2025,
    answers: { ...emptyAnswers, taxYear: c.tax_year ?? 2025, ...answers } as Answers,
    questionnaireStep: Number(__step ?? 0),
    dataSource: td?.source === "aeat_datos_fiscales" ? "aeat" : td?.source === "manual" || td?.source === "documento" ? td.source : null,
    calculation: ((calcs ?? [])[0]?.output as Calculation | undefined) ?? null,
    review: rev ? { status: rev.status, advisorName, advisorColegiado, advisorReturning, advisorApprovedAt: rev.advisor_approved_at, userApprovedAt: rev.user_approved_at, notes: rev.notes ?? "" } : null,
    aeatReference: c.aeat_reference ?? null,
    submittedAt: c.submitted_at ?? null,
    createdAt: c.created_at,
  };
}
