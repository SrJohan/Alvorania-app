import { formatEuros } from "../format";
import type { Calculation } from "./engine";

const eur = (v: number) => formatEuros(Math.round(v * 100));

/**
 * Una frase que dice por qué el resultado sale a pagar o a devolver.
 * No repite la cifra final, solo sus piezas (retenciones, maternidad e impuesto que corresponde):
 * así no puede desajustarse por un céntimo de redondeo. Devuelve null si el cálculo no trae desglose.
 */
export function explainResult(c: Calculation): string | null {
  const b = c.breakdown;
  if (!b) return null;
  const cuota = b.cuotaResultante;
  const retenciones = b.retenciones;

  if (c.resultCents === 0) return "Tus retenciones cubren justo el impuesto que te corresponde.";
  if (c.resultCents > 0) {
    return retenciones > 0
      ? `Sale a pagar porque tus retenciones (${eur(retenciones)}) no cubren todo el impuesto que te corresponde (${eur(cuota)}).`
      : `Sale a pagar porque no consta ninguna retención: el impuesto que te corresponde es de ${eur(cuota)}.`;
  }

  const aFavor = [
    retenciones > 0 && `tus retenciones (${eur(retenciones)})`,
    b.maternidad > 0 && `la deducción por maternidad (${eur(b.maternidad)})`,
  ].filter(Boolean) as string[];
  if (aFavor.length === 0) return null;

  if (cuota <= 0) {
    return `Este año no te corresponde pagar impuesto, así que ${retenciones > 0 ? "recuperas" : "cobras"} ${aFavor.join(" y ")}.`;
  }
  return `Te devuelven porque has pagado de más: ${aFavor.join(" y ")} ${aFavor.length === 1 && retenciones === 0 ? "supera" : "superan"} el impuesto que te corresponde (${eur(cuota)}).`;
}
