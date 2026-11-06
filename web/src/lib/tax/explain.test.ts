import { describe, expect, it } from "vitest";
import { calculate, normalizeAnswers, type Calculation } from "./engine";
import { explainResult } from "./explain";
import { formatEuros } from "../format";

const eur = (v: number) => formatEuros(Math.round(v * 100));
const base = { civilStatus: "soltero" as const, ccaa: "Madrid", birthYear: 1990, grossIncome: 30000, socialSecurity: 1950 };

// Caso A del motor: 598,02 € a pagar con 4.000 € de retenciones.
const pagar = calculate(normalizeAnswers({ ...base, withholdings: 4000 }));
const devolver = calculate(normalizeAnswers({ ...base, withholdings: 5000 }));

// Para los bordes se parte de un cálculo real y se fija solo lo que cambia la frase.
const con = (c: Calculation, resultCents: number, breakdown: Partial<Calculation["breakdown"]>): Calculation => ({ ...c, resultCents, breakdown: { ...c.breakdown, ...breakdown } });

describe("explainResult", () => {
  it("a pagar: las retenciones no cubren el impuesto, con ambas cifras", () => {
    const t = explainResult(pagar)!;
    expect(t).toContain("Sale a pagar porque tus retenciones");
    expect(t).toContain("no cubren todo el impuesto");
    expect(t).toContain(eur(4000));
    expect(t).toContain(eur(pagar.breakdown.cuotaResultante));
  });
  it("a pagar sin retenciones: dice que no consta ninguna", () => {
    const sin = calculate(normalizeAnswers({ ...base, withholdings: 0 }));
    expect(explainResult(sin)).toContain("no consta ninguna retención");
  });
  it("a devolver: las retenciones superan el impuesto, con ambas cifras", () => {
    const t = explainResult(devolver)!;
    expect(t).toContain("Te devuelven porque has pagado de más");
    expect(t).toContain("superan el impuesto");
    expect(t).toContain(eur(5000));
    expect(t).toContain(eur(devolver.breakdown.cuotaResultante));
  });
  it("a devolver con maternidad suma la deducción a las retenciones", () => {
    const t = explainResult(con(devolver, -90000, { maternidad: 1200 }))!;
    expect(t).toContain(`tus retenciones (${eur(5000)}) y la deducción por maternidad (${eur(1200)}) superan`);
  });
  it("a devolver sin cuota: no te corresponde pagar y recuperas lo retenido", () => {
    const t = explainResult(con(devolver, -30000, { cuotaResultante: 0, retenciones: 300, maternidad: 0 }))!;
    expect(t).toBe(`Este año no te corresponde pagar impuesto, así que recuperas tus retenciones (${eur(300)}).`);
  });
  it("a devolver solo por maternidad, sin cuota ni retenciones", () => {
    const t = explainResult(con(devolver, -120000, { cuotaResultante: 0, retenciones: 0, maternidad: 1200 }))!;
    expect(t).toBe(`Este año no te corresponde pagar impuesto, así que cobras la deducción por maternidad (${eur(1200)}).`);
  });
  it("resultado cero: las retenciones cubren justo el impuesto", () => {
    expect(explainResult(con(pagar, 0, {}))).toBe("Tus retenciones cubren justo el impuesto que te corresponde.");
  });
  it("un cálculo antiguo sin desglose no se explica", () => {
    expect(explainResult({ ...pagar, breakdown: undefined as never })).toBeNull();
  });
});
