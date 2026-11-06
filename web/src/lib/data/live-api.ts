"use client";
// Capa de datos REAL: mismas firmas que demo-api.ts, pero contra las Server Actions (Supabase + Stripe).
import { supabaseBrowser } from "@/lib/supabase/browser";
import type { Answers } from "@/lib/tax/engine";
import * as actions from "@/server/actions";
import * as advisor from "@/server/advisor-actions";
import type { ActionResult } from "@/server/errors";
import { NoAccountError } from "./no-account";
import { initialState, replaceState, update } from "./store";
import type { DemoState, PlanCode } from "./types";

/** Convierte el resultado de una acción en una excepción con mensaje legible, como esperan las pantallas. */
function unwrap<T>(r: ActionResult<T>): T {
  if (!r.ok) throw new Error(r.error);
  return r.data;
}

// ---- guardado diferido del cuestionario: la pantalla escribe en cada tecla, el servidor recibe una vez ----
let pending: { answers: Answers; step: number } | null = null;
let timer: ReturnType<typeof setTimeout> | null = null;

async function flush() {
  if (timer) { clearTimeout(timer); timer = null; }
  if (!pending) return;
  const { answers, step } = pending;
  pending = null;
  unwrap(await actions.saveAnswers(answers, step));
}

export async function refreshState() {
  await flush();
  const r = await actions.getState();
  if (r.ok) replaceState(r.data);
  else if (r.code === "unauthenticated") replaceState(initialState);
  else throw new Error(r.error);
}

async function mutate<T>(fn: () => Promise<ActionResult<T>>): Promise<T> {
  await flush();
  const data = unwrap(await fn());
  await refreshState();
  return data;
}

/** Devuelve la página de inicio según el rol: /asesor para el equipo, /app/conectar para clientes. */
export async function signIn(email: string, password: string): Promise<string> {
  const r = await actions.signInWithPassword({ email, password });
  if (!r.ok) throw r.code === "not_found" ? new NoAccountError(r.error) : new Error(r.error);
  await refreshState();
  return r.data.home;
}

export async function signUp(input: { fullName: string; email: string; password: string }): Promise<"signed-in" | "check-email"> {
  const { status } = unwrap(await actions.signUpWithPassword(input));
  if (status === "signed-in") await refreshState();
  return status;
}

export async function requestPasswordReset(email: string): Promise<{ demoLink: boolean }> {
  unwrap(await actions.requestPasswordReset({ email }));
  return { demoLink: false };
}

export async function resetPassword(password: string): Promise<string> {
  const { home } = unwrap(await actions.updatePassword({ password }));
  await refreshState();
  return home;
}

export async function signOut() {
  await actions.signOutAction();
  replaceState(initialState);
}

const CONSENT_KIND = { terms: "terms", privacy: "privacy", aeatDataAccess: "aeat_data_access", mandate: "mandate_presentacion" } as const;

export async function recordConsent(kind: keyof typeof CONSENT_KIND, granted: boolean) {
  // Reflejo inmediato en pantalla; el servidor guarda la prueba (versión, fecha, IP).
  update((s) => ({ ...s, consents: { ...s.consents, [kind]: granted } }));
  await mutate(() => actions.recordConsent(CONSENT_KIND[kind], granted));
}

export const createCase = (taxYear = 2025) => mutate(() => actions.createCase(taxYear));
export const setDataSource = (source: "manual" | "documento") => mutate(() => actions.setDataSource(source));

export const saveAeatReference = (nif: string, referencia: string) => mutate(() => actions.saveAeatReference(nif, referencia));

export async function saveAnswers(answers: Answers, step: number) {
  update((s) => (s.case ? { ...s, case: { ...s.case, answers, questionnaireStep: step } } : s));
  pending = { answers, step };
  if (timer) clearTimeout(timer);
  timer = setTimeout(() => { flush().catch(() => refreshState().catch(() => undefined)); }, 600);
}

export const runCalculation = () => mutate(() => actions.runCalculation());

/** Redirige a Stripe Checkout. No resuelve: la página se abandona; Stripe vuelve a /app/caso. */
export async function checkout(planCode: PlanCode): Promise<void> {
  await flush();
  const { url } = unwrap(await actions.createCheckout(planCode));
  window.location.assign(url);
  await new Promise<never>(() => undefined);
}

export const sendMessage = (body: string) => mutate(() => actions.sendMessage(body));
export const userApprove = () => mutate(() => actions.userApprove());
export const cancelRenewal = () => mutate(() => actions.cancelRenewal());

export async function uploadLetter(file: File) {
  const mime = file.type || (file.name.toLowerCase().endsWith(".pdf") ? "application/pdf" : "");
  const { path, token } = unwrap(await actions.createUploadUrl({ name: file.name, mime, sizeBytes: file.size, kind: "carta_hacienda" }));
  const { error } = await supabaseBrowser().storage.from("case-documents").uploadToSignedUrl(path, token, file);
  if (error) throw new Error("No hemos podido subir el archivo. Inténtalo de nuevo.");
  await mutate(() => actions.registerDocument({ path, kind: "carta_hacienda", mime, sizeBytes: file.size }));
}

export const clientResubmit = () => mutate(() => advisor.clientResubmit());

export async function downloadDocument(documentId: string) {
  const { url } = unwrap(await advisor.documentDownloadUrl(documentId));
  window.open(url, "_blank", "noopener");
}

export async function openBillingPortal() {
  const { url } = unwrap(await actions.openBillingPortal());
  window.location.assign(url);
  await new Promise<never>(() => undefined);
}

export async function exportMyData(): Promise<DemoState | Record<string, unknown>> {
  return unwrap(await actions.exportMyData());
}

export async function deleteMyAccount() {
  unwrap(await actions.deleteMyAccount());
  replaceState(initialState);
}
