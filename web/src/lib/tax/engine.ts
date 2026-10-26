import { RULES_2025_DEMO, type Bracket, type TaxRules } from "./rules";

export type Answers = {
  taxYear: number;
  ccaa: string;
  civilStatus: "soltero" | "casado" | "";
  payers: number;
  grossIncome: number;      // rendimientos íntegros del trabajo, euros
  socialSecurity: number;   // cotizaciones, euros
  withholdings: number;     // retenciones y pagos a cuenta, euros
  children: number;
  childrenUnder3: number;
  pensionContrib: number;
  donations: number;
  mortgagePre2013: number;
};

export type DeductionLine = {
  code: string;
  label: string;
  amount: number;           // euros que reducen la cuota o la base
  kind: "base" | "cuota";
  status: "aplicada" | "sugerida";
  hint?: string;
};

export type Calculation = {
  resultCents: number;      // >0 a pagar, <0 a devolver
  draftResultCents: number; // sin optimizar
  savingsCents: number;
  baseLiquidable: number;
  cuotaIntegra: number;
  deductions: DeductionLine[];
  rulesYear: number;
  engineVersion: string;
};

export const emptyAnswers: Answers = {
  taxYear: 2025, ccaa: "", civilStatus: "", payers: 1, grossIncome: 0, socialSecurity: 0,
  withholdings: 0, children: 0, childrenUnder3: 0, pensionContrib: 0, donations: 0, mortgagePre2013: 0,
};

export function applyScale(base: number, scale: Bracket[]): number {
  let prev = 0;
  let tax = 0;
  for (const b of scale) {
    if (base <= prev) break;
    tax += (Math.min(base, b.upTo) - prev) * b.rate;
    prev = b.upTo;
  }
  return tax;
}

const toCents = (euros: number) => Math.round(euros * 100);

function compute(a: Answers, r: TaxRules, optimise: boolean) {
  const lines: DeductionLine[] = [];
  const net = Math.max(0, a.grossIncome - a.socialSecurity - r.gastosDeducibles);

  const pension = optimise ? Math.min(a.pensionContrib, r.limitePensiones, net) : 0;
  if (pension > 0) lines.push({ code: "pensiones", label: "Aportaciones a planes de pensiones", amount: pension, kind: "base", status: "aplicada" });
  const base = Math.max(0, net - pension);

  const kids = Math.min(a.children, 4);
  const minimo =
    r.minimoPersonal +
    r.minimoDescendientes.slice(0, kids).reduce((s, v) => s + v, 0) +
    Math.min(a.childrenUnder3, a.children) * r.minimoMenor3;
  const integra = Math.max(0, applyScale(base, r.scale) - applyScale(minimo, r.scale));

  let cuotaDed = 0;
  if (optimise) {
    const d = Math.min(a.donations, r.donativo.firstTier) * r.donativo.firstRate +
      Math.max(0, a.donations - r.donativo.firstTier) * r.donativo.restRate;
    if (d > 0) { cuotaDed += d; lines.push({ code: "donativos", label: "Donativos a entidades acogidas a la ley de mecenazgo", amount: d, kind: "cuota", status: "aplicada" }); }
    const h = Math.min(a.mortgagePre2013, r.hipotecaAnterior2013.maxBase) * r.hipotecaAnterior2013.rate;
    if (h > 0) { cuotaDed += h; lines.push({ code: "hipoteca", label: "Vivienda habitual comprada antes de 2013", amount: h, kind: "cuota", status: "aplicada" }); }
  }
  const cuota = Math.max(0, integra - cuotaDed);
  return { base, integra, cuota, lines, result: cuota - a.withholdings };
}

export function calculate(a: Answers, rules: TaxRules = RULES_2025_DEMO): Calculation {
  const draft = compute(a, rules, false);
  const best = compute(a, rules, true);
  const deductions = [...best.lines];
  if (a.pensionContrib === 0) deductions.push({ code: "pensiones", label: "Aportaciones a planes de pensiones", amount: 0, kind: "base", status: "sugerida", hint: `Si aportas hasta ${rules.limitePensiones} € al año, reduces tu base.` });
  if (a.donations === 0) deductions.push({ code: "donativos", label: "Donativos", amount: 0, kind: "cuota", status: "sugerida", hint: "Los donativos a ONG y fundaciones desgravan en la cuota." });
  const resultCents = toCents(best.result);
  const draftResultCents = toCents(draft.result);
  return {
    resultCents, draftResultCents,
    savingsCents: Math.max(0, draftResultCents - resultCents),
    baseLiquidable: best.base, cuotaIntegra: best.integra,
    deductions, rulesYear: rules.year, engineVersion: "demo-0.1",
  };
}
