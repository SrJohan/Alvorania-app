import type { DemoState } from "./types";

/** Estado vacío, sin dependencias del navegador (lo usan tanto el servidor como el almacén del cliente). */
export function initialStateShape(): DemoState {
  return {
    user: null,
    consents: { terms: false, privacy: false, aeatDataAccess: false, mandate: false },
    case: null,
    planCode: null,
    messages: [],
    documents: [],
    subscription: null,
    requerimientoStatus: "ninguno",
  };
}
