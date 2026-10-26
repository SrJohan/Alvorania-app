import { describe, expect, it } from "vitest";
import { emptyAnswers, type Answers } from "@/lib/tax/engine";
import { closedPrice, coversCase, requiredPlan } from "./pricing";

const A = (over: Partial<Answers>): Answers => ({ ...emptyAnswers, ccaa: "Madrid", civilStatus: "soltero", grossIncome: 30000, ...over });

describe("F1 · precio cerrado según el caso", () => {
  it("un caso solo con nómina cabe en cualquier plan", () => {
    const r = requiredPlan(A({}));
    expect(r.plan).toBe("PRO");
    expect(r.reasons).toEqual([]);
  });

  it("intereses y dividendos no cambian el plan (los aporta Hacienda)", () => {
    expect(requiredPlan(A({ savingsIncome: 900 })).plan).toBe("PRO");
  });

  it("vender acciones o fondos exige el plan Completo y lo explica", () => {
    const r = requiredPlan(A({ savingsGains: 1200 }));
    expect(r.plan).toBe("FULL");
    expect(r.reasons.join(" ")).toMatch(/acciones o fondos/);
  });

  it("un plan cubre el caso si es igual o superior al necesario", () => {
    const full = A({ savingsGains: 10 });
    expect(coversCase("PRO", full)).toBe(false);
    expect(coversCase("LIVE", full)).toBe(false);
    expect(coversCase("FULL", full)).toBe(true);
    expect(coversCase("PRO", A({}))).toBe(true);
  });

  it("el precio cerrado es el del plan, IVA incluido, sin extras", () => {
    expect(closedPrice("LIVE")).toEqual({ planCode: "LIVE", totalCents: 5900, extras: 0 });
  });
});
