import { z } from "zod";
import { CCAA } from "@/lib/tax/rules";

const euros = z.number().finite().min(0).max(10_000_000);
const count = z.number().int().min(0).max(30);

const answersBase = z.object({
  taxYear: z.number().int().min(2015).max(2100),
  ccaa: z.union([z.enum(CCAA), z.literal("")]),
  civilStatus: z.enum(["soltero", "casado", ""]),
  birthYear: z.number().int().refine((y) => y === 0 || (y >= 1900 && y <= 2025), "Año de nacimiento no válido"),
  disability: z.union([z.literal(0), z.literal(33), z.literal(65)]),
  payers: z.number().int().min(1).max(20),
  grossIncome: euros,
  socialSecurity: euros,
  withholdings: euros,
  savingsIncome: euros,
  savingsGains: euros,
  ascendientes: count,
  ascendientes75: count,
  children: count,
  childrenUnder3: count,
  workingMother: z.boolean(),
  nurseryCost: euros,
  rentPaid: euros,
  pensionContrib: euros,
  donations: euros,
  donationsRecurrent: z.boolean(),
  // Opcionales: las respuestas guardadas antes de estos campos se completan con normalizeAnswers.
  donationsRegional: euros.default(0),
  bornThisYear: count.default(0),
  familiaNumerosa: z.enum(["", "general", "especial"]).default(""),
  mortgagePre2013: euros,
  propertyIncome: z.boolean(),
  selfEmployed: z.boolean(),
});

/** Para guardar mientras se escribe: valida forma y rangos, no la coherencia entre campos. */
export const answersDraftSchema = answersBase;

/** Para calcular: además exige coherencia entre campos. */
export const answersSchema = answersBase.refine((a) => a.childrenUnder3 <= a.children, { message: "Los menores de 3 años no pueden superar el número de hijos", path: ["childrenUnder3"] })
  .refine((a) => a.ascendientes75 <= a.ascendientes, { message: "Los mayores de 75 no pueden superar el número de ascendientes", path: ["ascendientes75"] })
  .refine((a) => a.socialSecurity <= a.grossIncome && a.withholdings <= a.grossIncome, { message: "Importes superiores a los ingresos", path: ["grossIncome"] });

export const emailSchema = z.string().trim().toLowerCase().email().max(254);
export const nameSchema = z.string().trim().min(2).max(120);
// 72: límite de bytes de bcrypt, que es lo que usa Supabase; más largo se truncaría en silencio.
export const newPasswordSchema = z.string().min(8).max(72);
export const passwordSchema = z.string().min(1).max(72);
export const planCodeSchema = z.enum(["PRO", "LIVE", "FULL"]);
export const consentKindSchema = z.enum(["terms", "privacy", "aeat_data_access", "mandate_presentacion"]);
export const stepSchema = z.number().int().min(0).max(5);
export const messageSchema = z.string().trim().min(1).max(4000);
export const uuidSchema = z.string().uuid();

export const uploadSchema = z.object({
  name: z.string().trim().min(1).max(200),
  mime: z.enum(["application/pdf", "image/jpeg", "image/png"]),
  sizeBytes: z.number().int().min(1).max(20 * 1024 * 1024),
  kind: z.enum(["carta_hacienda", "justificante", "otro"]),
});

/** Nombre de archivo seguro para la ruta de Storage: sin separadores, sin caracteres raros, longitud acotada. */
export function safeFileName(name: string): string {
  const cleaned = name.normalize("NFKD").replace(/[^\w.\- ]+/g, "").replace(/\s+/g, "-").replace(/^\.+/, "");
  return cleaned.slice(-100) || "documento";
}
