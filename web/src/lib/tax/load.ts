import type { TaxRules } from "./rules";

export type TaxRuleRow = {
  tax_year: number;
  territory: string;
  kind: string;
  code: string;
  rule: Record<string, unknown>;
  reviewed_at: string | null;
};

/** Lee el paquete de reglas del ejercicio desde tax_rules. Falla con un mensaje claro si falta o no está revisado. */
export function rulesFromRows(rows: TaxRuleRow[], opts: { requireReviewed: boolean }): TaxRules {
  const pkg = rows.find((r) => r.kind === "paquete" && r.code === "irpf");
  if (!pkg) throw new Error("No hay reglas fiscales cargadas para este ejercicio.");
  if (opts.requireReviewed && !pkg.reviewed_at) {
    throw new Error("Las reglas fiscales de este ejercicio aún no han sido revisadas por un fiscalista.");
  }
  const rules = pkg.rule as unknown as TaxRules;
  for (const key of ["escalaEstatal", "minimosEstatales", "trabajo", "territorios"] as const) {
    if (!rules[key]) throw new Error(`Falta la regla fiscal ${key}.`);
  }
  return rules;
}
