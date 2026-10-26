import { RULES_2025, type Bracket, type Minimos, type TaxRules } from "./rules";

// Motor del IRPF para tributación individual de residentes en territorio común.
// Sigue el orden de la liquidación: rendimiento del trabajo → reducciones → bases → mínimo personal y familiar →
// cuotas íntegras estatal y autonómica → deducciones → cuota líquida → deducción SMI → retenciones y maternidad.
// Lo que NO cubre (y lo dice): tributación conjunta, actividades económicas, inmuebles, compensación de pérdidas,
// ascendientes, otras deducciones autonómicas y las comunidades sin datos propios (estimación con la escala supletoria).

export type Answers = {
  taxYear: number;
  ccaa: string;
  civilStatus: "soltero" | "casado" | "";
  birthYear: number;              // 0 = sin indicar
  disability: 0 | 33 | 65;        // grado de discapacidad del contribuyente
  payers: number;
  grossIncome: number;            // rendimientos íntegros del trabajo
  socialSecurity: number;         // cotizaciones
  withholdings: number;           // retenciones y pagos a cuenta (trabajo y ahorro)
  savingsIncome: number;          // intereses y dividendos
  savingsGains: number;           // ganancias netas por ventas de acciones o fondos (si hubo pérdidas, 0)
  children: number;
  childrenUnder3: number;
  workingMother: boolean;         // madre con trabajo remunerado y hijos menores de 3 años
  nurseryCost: number;            // gasto en guardería autorizada no subvencionado
  rentPaid: number;               // alquiler de vivienda habitual pagado en el año
  mortgagePre2013: number;
  pensionContrib: number;
  donations: number;
  donationsRecurrent: boolean;    // misma entidad tres años o más
};

export type DeductionLine = {
  code: string;
  label: string;
  amount: number;
  kind: "base" | "cuota" | "diferencial";
  status: "aplicada" | "sugerida" | "no_aplica";
  hint?: string;
};

export type Breakdown = {
  rendimientoIntegroTrabajo: number;
  gastosDeducibles: number;
  reduccionTrabajo: number;
  rendimientoNetoTrabajo: number;
  baseImponibleGeneral: number;
  baseImponibleAhorro: number;
  reduccionPensiones: number;
  baseLiquidableGeneral: number;
  baseLiquidableAhorro: number;
  minimoEstatal: number;
  minimoAutonomico: number;
  cuotaIntegraEstatal: number;
  cuotaIntegraAutonomica: number;
  deduccionesEstatales: number;
  deduccionesAutonomicas: number;
  cuotaLiquida: number;
  deduccionSmi: number;
  cuotaResultante: number;
  retenciones: number;
  maternidad: number;
};

export type Calculation = {
  resultCents: number;        // >0 a pagar, <0 a devolver
  draftResultCents: number;   // sin las deducciones que hay que pedir expresamente (autonómicas, guardería)
  savingsCents: number;
  approximate: boolean;       // comunidad sin datos propios: autonómica con la escala supletoria
  territory: string;
  baseLiquidable: number;     // compatibilidad con pantallas: base liquidable general
  cuotaIntegra: number;       // compatibilidad: cuota íntegra total
  breakdown: Breakdown;
  deductions: DeductionLine[];
  rulesYear: number;
  engineVersion: string;
};

export const emptyAnswers: Answers = {
  taxYear: 2025, ccaa: "", civilStatus: "", birthYear: 0, disability: 0, payers: 1,
  grossIncome: 0, socialSecurity: 0, withholdings: 0, savingsIncome: 0, savingsGains: 0,
  children: 0, childrenUnder3: 0, workingMother: false, nurseryCost: 0,
  rentPaid: 0, mortgagePre2013: 0, pensionContrib: 0, donations: 0, donationsRecurrent: false,
};

/** Respuestas guardadas con una versión anterior del cuestionario: completa los campos que falten. */
export const normalizeAnswers = (a: Partial<Answers>): Answers => ({ ...emptyAnswers, ...a });

const round2 = (n: number) => Math.round(n * 100) / 100;
const toCents = (euros: number) => Math.round(euros * 100);

/**
 * Aplica una escala progresiva por tramos (hasta = null significa «en adelante»), como la tabla de la AEAT:
 * la cuota acumulada al final de cada tramo completo se redondea al céntimo y el resto se calcula sobre ella.
 */
export function applyScale(base: number, scale: Bracket[]): number {
  let prev = 0;
  let tax = 0;
  for (const b of scale) {
    const top = b.hasta ?? Infinity;
    if (base <= prev) break;
    if (base >= top) {
      tax = round2(tax + (top - prev) * b.tipo);
    } else {
      tax += (base - prev) * b.tipo;
    }
    prev = top;
  }
  return round2(tax);
}

/** Reducción por obtención de rendimientos del trabajo (art. 20 LIRPF) sobre el rendimiento neto previo. */
export function reduccionTrabajo(rnPrevio: number, otrasRentas: number, r: TaxRules): number {
  const red = r.trabajo.reduccion;
  if (otrasRentas > red.maxOtrasRentas) return 0;
  for (const t of red.tramos) {
    if (rnPrevio <= t.hasta) {
      if (t.fijo != null) return t.fijo;
      return Math.max(0, (t.base ?? 0) - (t.pendiente ?? 0) * (rnPrevio - (t.desde ?? 0)));
    }
  }
  return 0;
}

export function minimoPersonalFamiliar(a: Answers, m: Minimos): number {
  const age = a.birthYear ? a.taxYear - a.birthYear : 0;
  let total = m.personal;
  if (age >= 65) total += m.mayor65;
  if (age >= 75) total += m.mayor75;
  for (let i = 0; i < a.children; i++) total += m.descendientes[Math.min(i, m.descendientes.length - 1)];
  total += Math.min(a.childrenUnder3, a.children) * m.menor3;
  if (a.disability === 33) total += m.discapacidad33;
  if (a.disability === 65) total += m.discapacidad65 + m.asistencia;
  return total;
}

/** Cuota de una base con su mínimo: escala(base) − escala(parte del mínimo que cabe en la base). Devuelve también el mínimo sobrante. */
function cuotaConMinimo(base: number, minimo: number, scale: Bracket[]) {
  const usado = Math.min(minimo, base);
  return { cuota: Math.max(0, applyScale(base, scale) - applyScale(usado, scale)), resto: minimo - usado };
}

type Opts = { claimOptional: boolean };

function compute(a: Answers, r: TaxRules, { claimOptional }: Opts) {
  const lines: DeductionLine[] = [];
  const terr = r.territorios[a.ccaa];
  const approximate = !terr;
  const escalaAut = terr?.escala ?? r.escalaEstatal; // escala supletoria = misma estructura que la estatal
  const minAutRules = !terr || terr.minimos === "estatales" ? r.minimosEstatales : terr.minimos;
  const age = a.birthYear ? a.taxYear - a.birthYear : null;

  // 1. Rendimiento del trabajo
  const integro = a.grossIncome;
  const rnPrevio = Math.max(0, integro - a.socialSecurity);
  const otrasRentas = Math.max(0, a.savingsIncome) + Math.max(0, a.savingsGains);
  const reduccion = Math.min(reduccionTrabajo(rnPrevio, otrasRentas, r), Math.max(0, rnPrevio - r.trabajo.otrosGastos));
  const otrosGastos = Math.min(r.trabajo.otrosGastos, rnPrevio);
  const rnTrabajo = Math.max(0, rnPrevio - otrosGastos - reduccion);

  // 2. Bases imponibles
  const baseGeneral = rnTrabajo;
  const baseAhorro = otrasRentas;

  // 3. Reducción por planes de pensiones (límite 1.500 € y 30 % de los rendimientos netos del trabajo)
  const pension = Math.min(a.pensionContrib, r.pensiones.limite, r.pensiones.pctRendimientos * rnTrabajo, baseGeneral);
  if (pension > 0) lines.push({ code: "pensiones", label: "Aportaciones a planes de pensiones", amount: round2(pension), kind: "base", status: "aplicada" });
  const blGeneral = baseGeneral - pension;
  const blAhorro = baseAhorro;

  // 4. Mínimos y cuotas íntegras (estatal y autonómica por separado)
  const minEst = minimoPersonalFamiliar(a, r.minimosEstatales);
  const minAut = minimoPersonalFamiliar(a, minAutRules);
  const genEst = cuotaConMinimo(blGeneral, minEst, r.escalaEstatal);
  const ahoEst = cuotaConMinimo(blAhorro, genEst.resto, r.escalaAhorroEstatal);
  const genAut = cuotaConMinimo(blGeneral, minAut, escalaAut);
  const ahoAut = cuotaConMinimo(blAhorro, genAut.resto, r.escalaAhorroAutonomica);
  const cie = genEst.cuota + ahoEst.cuota;
  const cia = genAut.cuota + ahoAut.cuota;

  // 5. Deducciones de la cuota
  const h = r.hipotecaAnterior2013;
  const hipBase = Math.min(a.mortgagePre2013, h.baseMax);
  const hipEst = hipBase * h.pctEstatal;
  const hipAut = hipBase * h.pctAutonomico;
  if (hipBase > 0) lines.push({ code: "hipoteca", label: "Vivienda habitual comprada antes de 2013", amount: round2(hipEst + hipAut), kind: "cuota", status: "aplicada" });

  const d = r.donativos;
  const donBase = Math.min(a.donations, d.limitePctBase * (blGeneral + blAhorro));
  const don = Math.min(donBase, d.tramo) * d.pctTramo + Math.max(0, donBase - d.tramo) * (a.donationsRecurrent ? d.pctRestoRecurrente : d.pctResto);
  if (don > 0) lines.push({ code: "donativos", label: "Donativos a entidades acogidas a la ley de mecenazgo", amount: round2(don), kind: "cuota", status: "aplicada" });

  let autonomicas = 0;
  const baseImponible = baseGeneral + baseAhorro;
  for (const ded of terr?.deducciones ?? []) {
    if (ded.tipo !== "alquiler" || a.rentPaid <= 0) continue;
    const reasons: string[] = [];
    const ageOk =
      age == null ? false
        : (ded.edadMenorDe != null && age < ded.edadMenorDe) || (ded.edadMaxima != null && age <= ded.edadMaxima) || (ded.edadMayorDe != null && age > ded.edadMayorDe);
    if (age == null) reasons.push("indica tu año de nacimiento");
    else if (!ageOk) reasons.push("no cumples el requisito de edad");
    if (ded.maxBaseImponible != null && baseImponible > ded.maxBaseImponible) reasons.push("tu base imponible supera el límite");
    if (ded.maxBaseMenosMinimo != null && baseImponible - minAut > ded.maxBaseMenosMinimo) reasons.push("tus ingresos superan el límite");
    if (ded.alquilerMinPctBase != null && a.rentPaid <= ded.alquilerMinPctBase * baseImponible) reasons.push("el alquiler no supera el 20 % de tu base imponible");
    const amount = Math.min(a.rentPaid * ded.pct, ded.max);
    if (reasons.length) {
      lines.push({ code: ded.code, label: ded.label, amount: 0, kind: "cuota", status: "no_aplica", hint: `No aplica: ${reasons.join("; ")}.` });
    } else if (claimOptional) {
      autonomicas += amount;
      lines.push({ code: ded.code, label: ded.label, amount: round2(amount), kind: "cuota", status: "aplicada" });
    }
  }

  // Art. 67 y 77 LIRPF: hipoteca por tramos; donativos al 50 % en cada cuota.
  const dedEst = hipEst + don / 2;
  const dedAut = hipAut + don / 2 + autonomicas;
  const cle = Math.max(0, cie - dedEst);
  const cla = Math.max(0, cia - dedAut);
  const cuotaLiquida = cle + cla;

  // 6. Deducción por obtención de rendimientos del trabajo (SMI), limitada a la cuota que corresponde al trabajo.
  const s = r.deduccionSmi;
  let smi = 0;
  if (integro > 0 && integro < s.maxIntegros && otrasRentas <= s.maxOtrasRentas) {
    const bruto = integro <= s.plenoHasta ? s.importe : Math.max(0, s.importe - s.pendiente * (integro - s.plenoHasta));
    const limite = baseImponible > 0 ? (cie + cia) * (rnTrabajo / baseImponible) : 0;
    smi = Math.min(bruto, limite, cuotaLiquida);
    if (smi > 0) lines.push({ code: "smi", label: "Deducción por rendimientos del trabajo (salarios cercanos al SMI)", amount: round2(smi), kind: "cuota", status: "aplicada" });
  }
  const cuotaResultante = cuotaLiquida - smi;

  // 7. Maternidad (cuota diferencial: puede dar devolución aunque no haya cuota)
  let maternidad = 0;
  if (a.workingMother && a.childrenUnder3 > 0) {
    maternidad = a.childrenUnder3 * r.maternidad.porHijo;
    lines.push({ code: "maternidad", label: "Deducción por maternidad", amount: round2(maternidad), kind: "diferencial", status: "aplicada" });
    const guarderia = Math.min(a.nurseryCost, a.childrenUnder3 * r.maternidad.guarderiaMax);
    if (guarderia > 0 && claimOptional) {
      maternidad += guarderia;
      lines.push({ code: "guarderia", label: "Incremento por gastos de guardería", amount: round2(guarderia), kind: "diferencial", status: "aplicada" });
    }
  }

  const result = cuotaResultante - a.withholdings - maternidad;

  return {
    result,
    lines,
    approximate,
    breakdown: {
      rendimientoIntegroTrabajo: round2(integro),
      gastosDeducibles: round2(Math.min(a.socialSecurity, integro) + otrosGastos),
      reduccionTrabajo: round2(reduccion),
      rendimientoNetoTrabajo: round2(rnTrabajo),
      baseImponibleGeneral: round2(baseGeneral),
      baseImponibleAhorro: round2(baseAhorro),
      reduccionPensiones: round2(pension),
      baseLiquidableGeneral: round2(blGeneral),
      baseLiquidableAhorro: round2(blAhorro),
      minimoEstatal: round2(minEst),
      minimoAutonomico: round2(minAut),
      cuotaIntegraEstatal: round2(cie),
      cuotaIntegraAutonomica: round2(cia),
      deduccionesEstatales: round2(dedEst),
      deduccionesAutonomicas: round2(dedAut),
      cuotaLiquida: round2(cuotaLiquida),
      deduccionSmi: round2(smi),
      cuotaResultante: round2(cuotaResultante),
      retenciones: round2(a.withholdings),
      maternidad: round2(maternidad),
    } satisfies Breakdown,
  };
}

export function calculate(input: Answers, rules: TaxRules = RULES_2025): Calculation {
  const a = normalizeAnswers(input);
  const draft = compute(a, rules, { claimOptional: false });
  const best = compute(a, rules, { claimOptional: true });
  const deductions = [...best.lines];
  // No aplicadas en el cálculo final pero detectadas en el borrador (p. ej. alquiler que no cumple requisitos).
  for (const l of draft.lines) if (l.status === "no_aplica" && !deductions.some((x) => x.code === l.code)) deductions.push(l);
  if (a.pensionContrib === 0) deductions.push({ code: "pensiones_sugerida", label: "Aportaciones a planes de pensiones", amount: 0, kind: "base", status: "sugerida", hint: `Hasta ${rules.pensiones.limite.toLocaleString("es-ES")} € al año reducen tu base.` });
  if (a.donations === 0) deductions.push({ code: "donativos_sugerida", label: "Donativos", amount: 0, kind: "cuota", status: "sugerida", hint: "Los primeros 250 € donados desgravan un 80 %." });

  const resultCents = toCents(best.result);
  const draftResultCents = toCents(draft.result);
  return {
    resultCents,
    draftResultCents,
    savingsCents: Math.max(0, draftResultCents - resultCents),
    approximate: best.approximate,
    territory: a.ccaa,
    baseLiquidable: best.breakdown.baseLiquidableGeneral,
    cuotaIntegra: round2(best.breakdown.cuotaIntegraEstatal + best.breakdown.cuotaIntegraAutonomica),
    breakdown: best.breakdown,
    deductions,
    rulesYear: rules.year,
    engineVersion: "2025.1",
  };
}
