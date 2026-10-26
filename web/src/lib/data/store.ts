"use client";
import { useSyncExternalStore } from "react";
import { isLive } from "@/lib/env";
import { emptyAnswers } from "@/lib/tax/engine";
import type { CaseRow, DemoState } from "./types";

const KEY = "gestoria-demo-v1";

export const initialState: DemoState = {
  user: null,
  consents: { terms: false, privacy: false, aeatDataAccess: false, mandate: false },
  case: null,
  planCode: null,
  messages: [],
  documents: [],
  subscription: null,
  requerimientoStatus: "ninguno",
};

let state: DemoState = initialState;
let hydrated = false;
// En modo demo el estado está listo tras leer localStorage; en modo live, tras la primera carga desde el servidor.
let loaded = !isLive;
const listeners = new Set<() => void>();

function hydrate() {
  if (hydrated || typeof window === "undefined") return;
  hydrated = true;
  if (isLive) return; // en live la fuente de verdad es la base de datos, no el navegador
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw) state = { ...initialState, ...JSON.parse(raw) };
  } catch {
    /* sin almacenamiento: la demo funciona en memoria */
  }
}

export function getState(): DemoState {
  hydrate();
  return state;
}

function setState(next: DemoState) {
  state = next;
  if (!isLive) {
    try { window.localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* ignorar */ }
  }
  listeners.forEach((l) => l());
}

export function update(fn: (s: DemoState) => DemoState) {
  setState(fn(getState()));
}

/** Sustituye el estado con lo que devuelve el servidor (modo live). */
export function replaceState(next: DemoState) {
  loaded = true;
  setState(next);
}

export function useLoaded(): boolean {
  return useSyncExternalStore(subscribe, () => loaded, () => false);
}

export function resetDemo() {
  setState(initialState);
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => { listeners.delete(l); };
}

// En servidor y en la primera hidratación devolvemos el estado inicial para que el HTML coincida.
export function useDemoState(): DemoState {
  return useSyncExternalStore(subscribe, getState, () => initialState);
}

export const newCase = (taxYear = 2025): CaseRow => ({
  id: crypto.randomUUID(),
  status: "borrador",
  taxYear,
  answers: { ...emptyAnswers, taxYear },
  questionnaireStep: 0,
  dataSource: null,
  calculation: null,
  review: null,
  aeatReference: null,
  submittedAt: null,
  createdAt: new Date().toISOString(),
});
