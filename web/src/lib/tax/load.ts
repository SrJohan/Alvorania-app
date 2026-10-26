import type { TaxRules } from "./rules";

export type TaxRuleRow = {
  tax_year: number;
  territory: string;
  kind: string;
  code: string;
  rule: Record<string, unknown>;
  reviewed_at: string | null;
};

/** Convierte las filas de tax_rules en las reglas que usa el motor. Falla si falta alguna pieza. */
export function rulesFromRows(rows: TaxRuleRow[], opts: { requireReviewed: boolean }): TaxRules {
  if (!rows.length) throw new Error("No hay reglas fiscales cargadas para este ejercicio.");
  if (opts.requireReviewed && rows.some((r) => !r.reviewed_at)) {
    throw new Error("Las reglas fiscales de este ejercicio aún no han sido revisadas por un fiscalista.");
  }
  const get = (code: string) => {
    const r = rows.find((x) => x.code === code);
    if (!r) throw new Error(`Falta la regla fiscal ${code}.`);
    return r.rule as Record<string, never>;
  };
  const tramos = get("escala_general_combinada") as unknown as { brackets: { upTo: number | null; rate: number }[] };
  const minimos = get("minimos_personales") as unknown as { personal: number; descendientes: number[]; menor3: number; gastosDeducibles: number };
  const pensiones = get("pensiones") as unknown as { limite: number };
  const donativos = get("donativos") as unknown as { firstTier: number; firstRate: number; restRate: number };
  const hipoteca = get("hipoteca_anterior_2013") as unknown as { rate: number; maxBase: number };
  return {
    year: rows[0].tax_year,
    territory: rows[0].territory,
    sourceNote: rows.every((r) => r.reviewed_at) ? "Reglas revisadas." : "Reglas pendientes de revisión por tu equipo fiscal.",
    scale: tramos.brackets.map((b) => ({ upTo: b.upTo ?? Infinity, rate: b.rate })),
    minimoPersonal: minimos.personal,
    minimoDescendientes: minimos.descendientes,
    minimoMenor3: minimos.menor3,
    gastosDeducibles: minimos.gastosDeducibles,
    limitePensiones: pensiones.limite,
    donativo: donativos,
    hipotecaAnterior2013: hipoteca,
  };
}
