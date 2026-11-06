// Validación de lo que el usuario nos da para que el asesor abra su expediente en Renta WEB.
// shortcut: formato de la referencia sin confirmar con la AEAT (solo vimos un ejemplo de 6 caracteres), por eso se acepta 6 a 10; afinar al ver referencias reales.

const LETTERS = "TRWAGMYFPDXBNJZSQVHLCKE";

/** Limpia espacios y guiones y pasa a mayúsculas. */
export const cleanId = (v: string) => v.replace(/[\s-]/g, "").toUpperCase();

/** DNI o NIE con su letra de control correcta. */
export function isValidNif(raw: string): boolean {
  const v = cleanId(raw);
  const m = /^([XYZ]|\d)(\d{7})([A-Z])$/.exec(v);
  if (!m) return false;
  const digits = ("XYZ".indexOf(m[1]) >= 0 ? String("XYZ".indexOf(m[1])) : m[1]) + m[2];
  return LETTERS[Number(digits) % 23] === m[3];
}

export const isValidReferencia = (raw: string) => /^[A-Z0-9]{6,10}$/.test(cleanId(raw));
