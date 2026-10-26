import { z } from "zod";
import { CCAA } from "@/lib/tax/rules";

const euros = z.number().finite().min(0).max(10_000_000);
const count = z.number().int().min(0).max(30);

const answersBase = z.object({
  taxYear: z.number().int().min(2015).max(2100),
  ccaa: z.union([z.enum(CCAA), z.literal("")]),
  civilStatus: z.enum(["soltero", "casado", ""]),
  payers: z.number().int().min(1).max(20),
  grossIncome: euros,
  socialSecurity: euros,
  withholdings: euros,
  children: count,
  childrenUnder3: count,
  pensionContrib: euros,
  donations: euros,
  mortgagePre2013: euros,
});

/** Para guardar mientras se escribe: valida forma y rangos, no la coherencia entre campos. */
export const answersDraftSchema = answersBase;

/** Para calcular: además exige coherencia entre campos. */
export const answersSchema = answersBase.refine((a) => a.childrenUnder3 <= a.children, { message: "Los menores de 3 años no pueden superar el número de hijos", path: ["childrenUnder3"] })
  .refine((a) => a.socialSecurity <= a.grossIncome && a.withholdings <= a.grossIncome, { message: "Importes superiores a los ingresos", path: ["grossIncome"] });

export const emailSchema = z.string().trim().toLowerCase().email().max(254);
export const nameSchema = z.string().trim().min(2).max(120);
export const planCodeSchema = z.enum(["PRO", "LIVE", "FULL"]);
export const consentKindSchema = z.enum(["terms", "privacy", "aeat_data_access", "mandate_presentacion"]);
export const stepSchema = z.number().int().min(0).max(3);
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
