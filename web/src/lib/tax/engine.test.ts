import { describe, expect, it } from "vitest";
import { applyScale, calculate, emptyAnswers, minimoPersonalFamiliar, reduccionTrabajo, type Answers } from "./engine";
import { RULES_2025 as R } from "./rules";

const A = (over: Partial<Answers>): Answers => ({ ...emptyAnswers, civilStatus: "soltero", ...over });
const euros = (cents: number) => cents / 100;

describe("escalas contra las cuotas publicadas por la AEAT (Manual Renta 2025)", () => {
  it("estatal", () => {
    expect(applyScale(12450, R.escalaEstatal)).toBeCloseTo(1182.75, 2);
    expect(applyScale(60000, R.escalaEstatal)).toBeCloseTo(8950.75, 2);
    expect(applyScale(300000, R.escalaEstatal)).toBeCloseTo(62950.75, 2);
  });
  it("Madrid: columna «cuota íntegra» de la tabla", () => {
    const m = R.territorios.Madrid.escala;
    expect(applyScale(13362.22, m)).toBeCloseTo(1135.79, 2);
    expect(applyScale(19004.63, m)).toBeCloseTo(1739.53, 2);
    expect(applyScale(35425.68, m)).toBeCloseTo(3841.42, 2);
    expect(applyScale(57320.4, m)).toBeCloseTo(7651.1, 2);
  });
  it("Cataluña", () => {
    const c = R.territorios["Cataluña"].escala;
    expect(applyScale(22000, c)).toBeCloseTo(2375, 2);
    expect(applyScale(90000, c)).toBeCloseTo(15890, 2);
    expect(applyScale(175000, c)).toBeCloseTo(36415, 2);
  });
  it("Andalucía", () => {
    const a = R.territorios["Andalucía"].escala;
    expect(applyScale(21100, a)).toBeCloseTo(2207, 2);
    expect(applyScale(60000, a)).toBeCloseTo(8910, 2);
  });
  it("ahorro: estatal + autonómica = 19 / 21 / 23 / 27 / 30 %", () => {
    const both = (b: number) => applyScale(b, R.escalaAhorroEstatal) + applyScale(b, R.escalaAhorroAutonomica);
    expect(both(6000)).toBeCloseTo(1140, 2);
    expect(both(50000)).toBeCloseTo(1140 + 44000 * 0.21, 2);
    expect(both(400000) - both(300000)).toBeCloseTo(30000, 2);
  });
});

describe("reducción por rendimientos del trabajo (art. 20)", () => {
  it("tramos 2025", () => {
    expect(reduccionTrabajo(14000, 0, R)).toBe(7302);
    expect(reduccionTrabajo(16000, 0, R)).toBeCloseTo(7302 - 1.75 * 1148, 2);
    expect(reduccionTrabajo(18000, 0, R)).toBeCloseTo(2364.34 - 1.14 * (18000 - 17673.52), 2);
    expect(reduccionTrabajo(20000, 0, R)).toBe(0);
  });
  it("no se aplica con más de 6.500 € de otras rentas", () => {
    expect(reduccionTrabajo(14000, 7000, R)).toBe(0);
  });
});

describe("mínimo personal y familiar", () => {
  it("Madrid con un hijo menor de 3 años", () => {
    expect(minimoPersonalFamiliar(A({ children: 1, childrenUnder3: 1 }), R.territorios.Madrid.minimos as never)).toBeCloseTo(5956.65 + 2575.85 + 3005.16, 2);
  });
  it("estatal: mayor de 75 y discapacidad del 65 %", () => {
    expect(minimoPersonalFamiliar(A({ birthYear: 1948, disability: 65 }), R.minimosEstatales)).toBe(5550 + 1150 + 1400 + 9000 + 3000);
  });
  it("ascendientes: 1.150 € por cada mayor de 65 y 1.400 € más por cada mayor de 75 (estatal)", () => {
    expect(minimoPersonalFamiliar(A({ ascendientes: 2, ascendientes75: 1 }), R.minimosEstatales)).toBe(5550 + 2 * 1150 + 1400);
  });
  it("ascendientes en Madrid con los importes autonómicos", () => {
    expect(minimoPersonalFamiliar(A({ ascendientes: 1, ascendientes75: 1 }), R.territorios.Madrid.minimos as never)).toBeCloseTo(5956.65 + 1234.26 + 1502.58, 2);
  });
  it("los mayores de 75 nunca superan a los ascendientes", () => {
    expect(minimoPersonalFamiliar(A({ ascendientes: 1, ascendientes75: 3 }), R.minimosEstatales)).toBe(5550 + 1150 + 1400);
  });
  it("un ascendiente baja la cuota: 1.150 € de mínimo estatal y autonómico a Madrid", () => {
    const base = A({ ccaa: "Madrid", grossIncome: 40000, socialSecurity: 2540, withholdings: 6000 });
    const con = calculate({ ...base, ascendientes: 1 });
    const sin = calculate(base);
    expect(con.resultCents).toBeLessThan(sin.resultCents);
    expect(con.breakdown.minimoEstatal - sin.breakdown.minimoEstatal).toBeCloseTo(1150, 2);
    expect(con.breakdown.minimoAutonomico - sin.breakdown.minimoAutonomico).toBeCloseTo(1234.26, 2);
  });
});

describe("casos completos calculados a mano", () => {
  it("A · Madrid, 30.000 € brutos, sin hijos: 598,02 € a pagar", () => {
    // RN previo 28.050; sin reducción art. 20; −2.000 → base 26.050
    // estatal: escala(26.050)=2.990,25 − escala(5.550)=527,25 → 2.463,00
    // Madrid: escala(26.050)=2.641,34 − escala(5.956,65)=506,32 → 2.135,02
    // cuota líquida 4.598,02 − retenciones 4.000 = 598,02
    const c = calculate(A({ ccaa: "Madrid", birthYear: 1990, grossIncome: 30000, socialSecurity: 1950, withholdings: 4000 }));
    expect(c.breakdown.baseLiquidableGeneral).toBe(26050);
    expect(c.breakdown.cuotaIntegraEstatal).toBeCloseTo(2463, 2);
    expect(c.breakdown.cuotaIntegraAutonomica).toBeCloseTo(2135.02, 2);
    expect(euros(c.resultCents)).toBeCloseTo(598.02, 2);
    expect(c.approximate).toBe(false);
  });

  it("B · Andalucía, 30 años, 18.000 € y alquiler: reducción art. 20, deducción SMI y alquiler autonómico", () => {
    // RN previo 16.830 → reducción 7.302 − 1,75×1.978 = 3.840,50 → base 10.989,50
    // estatal 1.044,00 − 527,25 = 516,75 · Andalucía 1.044,00 − 550,05 = 493,95
    // alquiler: 15 % de 6.000 = 900 (tope 1.200), limitado a la cuota autonómica 493,95 → cuota autonómica 0
    // SMI: 340 − 0,2×1.424 = 55,20 → cuota resultante 461,55 − retenciones 1.200 = −738,45
    const c = calculate(A({ ccaa: "Andalucía", birthYear: 1995, grossIncome: 18000, socialSecurity: 1170, withholdings: 1200, rentPaid: 6000 }));
    expect(c.breakdown.reduccionTrabajo).toBeCloseTo(3840.5, 2);
    expect(c.breakdown.deduccionSmi).toBeCloseTo(55.2, 2);
    expect(c.deductions.find((d) => d.code === "andalucia_alquiler")?.amount).toBeCloseTo(900, 2);
    expect(euros(c.resultCents)).toBeCloseTo(-738.45, 2);
    expect(euros(c.savingsCents)).toBeCloseTo(493.95, 1); // lo que el alquiler ahorra de verdad, no los 900
  });

  it("B2 · el alquiler no aplica a quien ya cumplió 35 en Andalucía, y lo explica", () => {
    const c = calculate(A({ ccaa: "Andalucía", birthYear: 1985, grossIncome: 18000, socialSecurity: 1170, withholdings: 1200, rentPaid: 6000 }));
    const line = c.deductions.find((d) => d.code === "andalucia_alquiler");
    expect(line?.status).toBe("no_aplica");
    expect(line?.hint).toMatch(/edad/);
  });

  it("C · Cataluña, jubilado de 65 con 8.000 € de dividendos: el mínimo sobrante va a la base del ahorro", () => {
    // mínimo 5.550 + 1.150 = 6.700, todo al ahorro. Ahorro estatal: 780,00 − 643,50 = 136,50; autonómica igual
    const c = calculate(A({ ccaa: "Cataluña", birthYear: 1960, savingsIncome: 8000, withholdings: 1520 }));
    expect(c.breakdown.cuotaIntegraEstatal).toBeCloseTo(136.5, 2);
    expect(c.breakdown.cuotaIntegraAutonomica).toBeCloseTo(136.5, 2);
    expect(euros(c.resultCents)).toBeCloseTo(-1247, 2);
  });

  it("D · Madrid, madre trabajadora con un bebé y guardería: maternidad en la cuota diferencial", () => {
    // base 21.375; estatal 2.289,00 − 1.021,25 = 1.267,75; Madrid 2.042,94 − 980,70 = 1.062,24
    // 2.329,99 − 3.000 retenciones − 1.200 maternidad − 1.000 guardería = −2.870,01
    const c = calculate(A({ ccaa: "Madrid", birthYear: 1990, grossIncome: 25000, socialSecurity: 1625, withholdings: 3000, children: 1, childrenUnder3: 1, workingMother: true, nurseryCost: 2000 }));
    expect(c.breakdown.maternidad).toBe(2200);
    expect(euros(c.resultCents)).toBeCloseTo(-2870.01, 2);
    expect(euros(c.savingsCents)).toBeCloseTo(1000, 2);
  });

  it("E · comunidad sin datos propios: estimación con la escala supletoria y marcada como aproximada", () => {
    const c = calculate(A({ ccaa: "Galicia", birthYear: 1990, grossIncome: 30000, socialSecurity: 1950, withholdings: 4000 }));
    expect(c.approximate).toBe(true);
    expect(c.breakdown.cuotaIntegraAutonomica).toBeCloseTo(2463, 2);
    expect(euros(c.resultCents)).toBeCloseTo(926, 2);
  });

  it("F · donativos: 80 % de los primeros 250 € y 40 % del resto, mitad en cada cuota", () => {
    const c = calculate(A({ ccaa: "Madrid", birthYear: 1990, grossIncome: 30000, socialSecurity: 1950, withholdings: 4000, donations: 300 }));
    expect(c.deductions.find((d) => d.code === "donativos")?.amount).toBeCloseTo(220, 2);
    expect(euros(c.resultCents)).toBeCloseTo(378.02, 2);
    const rec = calculate(A({ ccaa: "Madrid", birthYear: 1990, grossIncome: 30000, socialSecurity: 1950, withholdings: 4000, donations: 300, donationsRecurrent: true }));
    expect(rec.deductions.find((d) => d.code === "donativos")?.amount).toBeCloseTo(222.5, 2);
  });

  it("G · planes de pensiones: tope de 1.500 €", () => {
    const c = calculate(A({ ccaa: "Madrid", birthYear: 1990, grossIncome: 30000, socialSecurity: 1950, withholdings: 4000, pensionContrib: 2000 }));
    expect(c.breakdown.reduccionPensiones).toBe(1500);
    expect(euros(c.resultCents)).toBeCloseTo(181.02, 2);
  });

  it("H · deducción SMI del ejemplo de la AEAT: 16.500 € de rendimientos íntegros → 340 €", () => {
    const c = calculate(A({ ccaa: "Madrid", birthYear: 1990, grossIncome: 16500, socialSecurity: 1072.5 }));
    // con la reducción del art. 20 la cuota es pequeña: la deducción nunca supera la cuota del trabajo
    expect(c.breakdown.deduccionSmi).toBeLessThanOrEqual(340);
    expect(c.breakdown.deduccionSmi).toBeLessThanOrEqual(c.breakdown.cuotaLiquida + 0.001);
    const alto = calculate(A({ ccaa: "Madrid", grossIncome: 16500, socialSecurity: 0, savingsIncome: 0 }));
    expect(alto.breakdown.deduccionSmi).toBeLessThanOrEqual(340);
  });

  it("respuestas antiguas sin los campos nuevos siguen calculando", () => {
    const viejo = { taxYear: 2025, ccaa: "Madrid", civilStatus: "soltero", payers: 1, grossIncome: 30000, socialSecurity: 1950, withholdings: 4000, children: 0, childrenUnder3: 0, pensionContrib: 0, donations: 0, mortgagePre2013: 0 } as unknown as Answers;
    expect(Number.isFinite(calculate(viejo).resultCents)).toBe(true);
  });
});
