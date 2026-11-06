import { calculate, type Answers, type Calculation, type DeductionLine } from "./engine";
import { isForal } from "./rules";

export type LiveSummary = { kind: "empty" } | { kind: "foral" } | { kind: "ready"; calc: Calculation; top: DeductionLine | null; partial: boolean };

export function topApplied(lines: DeductionLine[]): DeductionLine | null {
  return lines.reduce<DeductionLine | null>((top, line) => line.status === "aplicada" && (!top || line.amount > top.amount) ? line : top, null);
}

export function liveSummary(a: Answers): LiveSummary {
  if (!a.ccaa) return { kind: "empty" };
  if (isForal(a.ccaa)) return { kind: "foral" };
  if (a.grossIncome <= 0) return { kind: "empty" };
  const calc = calculate(a);
  return { kind: "ready", calc, top: topApplied(calc.deductions), partial: a.propertyIncome || a.selfEmployed };
}

export function improvementCents(prevResultCents: number, nextResultCents: number): number {
  return prevResultCents - nextResultCents;
}
