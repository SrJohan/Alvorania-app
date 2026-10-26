// F1 de replica/fixes.md: precio cerrado antes de pagar.
// Una sola regla, usada en la pantalla, en la demo y en el servidor, decide qué plan necesita un caso.
// El precio que se ve es el total con IVA y no cambia después: no existen suplementos.
import { PLANS } from "@/lib/data/plans";
import type { PlanCode } from "@/lib/data/types";
import { normalizeAnswers, type Answers } from "@/lib/tax/engine";

const RANK: Record<PlanCode, number> = { PRO: 0, LIVE: 1, FULL: 2 };

type Rule = { plan: PlanCode; applies: (a: Answers) => boolean; reason: string };

// Cada regla dice qué plan mínimo exige una situación y por qué, en palabras del cliente.
const RULES: Rule[] = [
  {
    plan: "FULL",
    applies: (a) => a.savingsGains > 0,
    reason: "Has vendido acciones o fondos: hay que calcular cada ganancia con su coste de compra.",
  },
];

export function requiredPlan(input: Answers): { plan: PlanCode; reasons: string[] } {
  const a = normalizeAnswers(input);
  let plan: PlanCode = "PRO";
  const reasons: string[] = [];
  for (const r of RULES) {
    if (!r.applies(a)) continue;
    reasons.push(r.reason);
    if (RANK[r.plan] > RANK[plan]) plan = r.plan;
  }
  return { plan, reasons };
}

export const coversCase = (plan: PlanCode, a: Answers) => RANK[plan] >= RANK[requiredPlan(a).plan];

export function closedPrice(plan: PlanCode) {
  const p = PLANS.find((x) => x.code === plan);
  if (!p) throw new Error(`plan desconocido ${plan}`);
  return { planCode: plan, totalCents: p.priceCents, extras: 0 as const };
}
