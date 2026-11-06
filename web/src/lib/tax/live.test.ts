import { describe, expect, it } from "vitest";
import { normalizeAnswers, type DeductionLine } from "./engine";
import { improvementCents, liveSummary, topApplied } from "./live";

const a = normalizeAnswers({ civilStatus: "soltero", ccaa: "Madrid", birthYear: 1990, grossIncome: 30000, socialSecurity: 1950, withholdings: 4000 });
const b = normalizeAnswers({ civilStatus: "soltero", ccaa: "Andalucía", birthYear: 1995, grossIncome: 18000, socialSecurity: 1170, withholdings: 1200, rentPaid: 6000 });

describe("cifra viva", () => {
  it("sin comunidad o sin ingresos devuelve empty", () => {
    expect(liveSummary(normalizeAnswers({ grossIncome: 30000 }))).toEqual({ kind: "empty" });
    for (const grossIncome of [0, -1]) expect(liveSummary(normalizeAnswers({ ccaa: "Madrid", grossIncome }))).toEqual({ kind: "empty" });
  });
  it("comunidad foral devuelve foral aunque no haya ingresos", () => {
    for (const ccaa of ["Navarra", "País Vasco"]) expect(liveSummary(normalizeAnswers({ ccaa }))).toEqual({ kind: "foral" });
  });
  it("caso A (Madrid, 30.000 €) da 59802 céntimos a pagar", () => {
    expect(liveSummary(a)).toMatchObject({ kind: "ready", calc: { resultCents: 59802 } });
  });
  it("caso B (Andalucía, 1995, alquiler 6.000 €) da -73845 céntimos", () => {
    expect(liveSummary(b)).toMatchObject({ kind: "ready", calc: { resultCents: -73845 } });
  });
  it("partial es true con inmueble o autónomo y false sin ellos", () => {
    expect(liveSummary(a)).toMatchObject({ partial: false });
    expect(liveSummary({ ...a, propertyIncome: true })).toMatchObject({ partial: true });
    expect(liveSummary({ ...a, selfEmployed: true })).toMatchObject({ partial: true });
  });
  it("topApplied devuelve la mayor aplicada e ignora sugeridas y no_aplica", () => {
    const lines: DeductionLine[] = [
      { code: "a", label: "Primera", amount: 10, kind: "cuota", status: "aplicada" },
      { code: "b", label: "Mayor", amount: 20, kind: "cuota", status: "aplicada" },
      { code: "c", label: "Empate", amount: 20, kind: "cuota", status: "aplicada" },
      { code: "d", label: "Sugerida", amount: 100, kind: "cuota", status: "sugerida" },
      { code: "e", label: "No aplica", amount: 200, kind: "cuota", status: "no_aplica" },
    ];
    expect(topApplied(lines)).toBe(lines[1]);
    expect(topApplied(lines.slice(3))).toBeNull();
    expect(topApplied([])).toBeNull();
  });
  it("improvementCents: 59802 a 57402 es 2400 y -73845 a -74845 es 1000", () => {
    expect(improvementCents(59802, 57402)).toBe(2400);
    expect(improvementCents(-73845, -74845)).toBe(1000);
  });
});
