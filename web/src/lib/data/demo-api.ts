"use client";
// Capa de datos FALSA con las mismas firmas que tendrá la real (server actions + Supabase).
// Cambiar la implementación por la real no debería tocar ninguna pantalla.
import { calculate, type Answers } from "@/lib/tax/engine";
import { coversCase, requiredPlan } from "@/lib/pricing";
import { planByCode } from "./plans";
import { getState, newCase, update } from "./store";
import type { PlanCode } from "./types";

const delay = (ms = 350) => new Promise((r) => setTimeout(r, ms));
const now = () => new Date().toISOString();
const id = () => crypto.randomUUID();

export async function signIn(email: string, fullName: string): Promise<"signed-in" | "check-email"> {
  await delay();
  update((s) => ({ ...s, user: { email, fullName: fullName || email.split("@")[0] } }));
  return "signed-in";
}

export async function signOut() {
  update((s) => ({ ...s, user: null }));
}

export async function recordConsent(kind: "terms" | "privacy" | "aeatDataAccess" | "mandate", granted: boolean) {
  update((s) => ({ ...s, consents: { ...s.consents, [kind]: granted } }));
}

export async function createCase(taxYear = 2025) {
  await delay(150);
  update((s) => (s.case ? s : { ...s, case: newCase(taxYear) }));
}

export async function setDataSource(source: "manual" | "documento") {
  await delay(250);
  update((s) => (s.case ? { ...s, case: { ...s.case, dataSource: source } } : s));
}

export async function saveAnswers(answers: Answers, step: number) {
  update((s) => (s.case ? { ...s, case: { ...s.case, answers, questionnaireStep: step } } : s));
}

export async function runCalculation() {
  await delay(900);
  update((s) => {
    if (!s.case) return s;
    const calculation = calculate(s.case.answers);
    const status = s.case.status === "borrador" ? "calculado" : s.case.status;
    return { ...s, case: { ...s.case, calculation, status } };
  });
}

export async function checkout(planCode: PlanCode) {
  await delay(1100); // en producción: redirección a Stripe Checkout
  const current = getState().case;
  if (current && !coversCase(planCode, current.answers)) {
    const need = requiredPlan(current.answers);
    throw new Error(`Tu caso necesita el plan ${planByCode(need.plan)?.name ?? need.plan}. ${need.reasons.join(" ")}`);
  }
  update((s) => {
    if (!s.case) return s;
    return {
      ...s,
      planCode,
      case: {
        ...s.case,
        status: "en_revision",
        review: { advisorName: "Lucía Martín", advisorApprovedAt: null, userApprovedAt: null, notes: "" },
      },
      subscription: { planCode, renewsAt: new Date(Date.now() + 365 * 864e5).toISOString(), autoRenew: true, canceledAt: null },
      messages: [...s.messages, { id: id(), from: "system", body: "Pago recibido. Tu declaración está en revisión.", at: now() }],
    };
  });
}

export async function sendMessage(body: string) {
  await delay(200);
  update((s) => ({ ...s, messages: [...s.messages, { id: id(), from: "user", body, at: now() }] }));
}

// Solo demostración: simula la acción del asesor desde su panel.
export async function demoAdvisorApprove() {
  await delay(300);
  update((s) => {
    if (!s.case?.review) return s;
    return {
      ...s,
      case: { ...s.case, status: "pendiente_aprobacion", review: { ...s.case.review, advisorApprovedAt: now() } },
      messages: [...s.messages, { id: id(), from: "advisor", body: "He revisado tu declaración y todo está correcto. Falta tu confirmación para presentarla.", at: now() }],
    };
  });
}

// Solo demostración: el asesor devuelve el caso al cliente con una nota.
export async function demoAdvisorRequestChanges(notes = "Falta el certificado de retenciones de tu segundo pagador.") {
  await delay(300);
  update((s) => {
    if (!s.case?.review) return s;
    return {
      ...s,
      case: { ...s.case, status: "en_revision", review: { ...s.case.review, status: "cambios_pedidos", notes, advisorApprovedAt: null } },
      messages: [...s.messages, { id: id(), from: "advisor", body: `Necesito que revises algunos datos: ${notes}`, at: now() }],
    };
  });
}

export async function clientResubmit() {
  await delay(300);
  update((s) => {
    if (s.case?.review?.status !== "cambios_pedidos") return s;
    return {
      ...s,
      case: { ...s.case, review: { ...s.case.review, status: "pendiente" } },
      messages: [...s.messages, { id: id(), from: "system", body: "Has corregido tus datos. Tu asesor volverá a revisarlos.", at: now() }],
    };
  });
}

export async function downloadDocument(documentId: string) {
  void documentId; // en la demo los archivos no se guardan
  throw new Error("En la demostración los documentos no se guardan, así que no se pueden descargar.");
}

export async function userApprove() {
  await delay(500);
  const s = getState();
  if (!s.case?.review?.advisorApprovedAt) throw new Error("El asesor aún no ha aprobado la declaración.");
  update((st) => (st.case?.review ? { ...st, case: { ...st.case, review: { ...st.case.review, userApprovedAt: now() } } } : st));
}

// Solo demostración: el asesor presenta en la sede electrónica y registra el justificante.
export async function demoAdvisorSubmit() {
  await delay(400);
  const s = getState();
  if (!s.case?.review?.userApprovedAt) throw new Error("Falta la aprobación del cliente.");
  update((st) =>
    st.case
      ? {
          ...st,
          case: { ...st.case, status: "presentado", submittedAt: now(), aeatReference: "DEMO-" + Math.random().toString(36).slice(2, 10).toUpperCase() },
          messages: [...st.messages, { id: id(), from: "system", body: "Tu declaración se ha presentado correctamente.", at: now() }],
        }
      : st,
  );
}

export async function uploadLetter(file: File) {
  const name = file.name;
  const sizeBytes = file.size;
  await delay(900);
  update((s) => ({
    ...s,
    documents: [...s.documents, { id: id(), kind: "carta_hacienda", name, sizeBytes, at: now() }],
    requerimientoStatus: "analizado",
  }));
}

export async function cancelRenewal() {
  await delay(400);
  update((s) => (s.subscription ? { ...s, subscription: { ...s.subscription, autoRenew: false, canceledAt: now() } } : s));
}
