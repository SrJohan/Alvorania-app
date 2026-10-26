import "server-only";
import { z } from "zod";
import { AppError } from "./errors";

// Variables secretas. Este archivo solo puede importarse desde código de servidor (el compilador lo impide en el cliente).
// Cada servicio se valida por separado y solo cuando se usa: sin Stripe se puede entrar, calcular y subir documentos.

const coreSchema = z.object({
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(20, "falta SUPABASE_SERVICE_ROLE_KEY"),
  REQUIRE_REVIEWED_TAX_RULES: z.enum(["true", "false"]).default("false"),
});

const stripeSchema = z.object({
  STRIPE_SECRET_KEY: z.string().startsWith("sk_", "STRIPE_SECRET_KEY debe empezar por sk_"),
  STRIPE_WEBHOOK_SECRET: z.string().startsWith("whsec_", "STRIPE_WEBHOOK_SECRET debe empezar por whsec_"),
  STRIPE_PRICE_PRO: z.string().startsWith("price_"),
  STRIPE_PRICE_LIVE: z.string().startsWith("price_"),
  STRIPE_PRICE_FULL: z.string().startsWith("price_"),
});

const resendSchema = z.object({
  RESEND_API_KEY: z.string().startsWith("re_", "RESEND_API_KEY debe empezar por re_"),
  EMAIL_FROM: z.string().min(5),
});

const cronSchema = z.object({
  CRON_SECRET: z.string().min(24, "CRON_SECRET debe tener al menos 24 caracteres"),
});

function load<S extends z.ZodTypeAny>(schema: S, service: string, userMessage: string): z.infer<S> {
  const parsed = schema.safeParse(process.env);
  if (!parsed.success) {
    const detail = parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
    console.error(`[config] ${service} no está configurado (${detail}). Revisa .env.local con .env.example.`);
    throw new AppError(userMessage, "config");
  }
  return parsed.data;
}

export const serverEnv = () => load(coreSchema, "Supabase (clave de servicio)", "El servidor no está configurado todavía.");
export const stripeEnv = () => load(stripeSchema, "Stripe", "Los pagos todavía no están configurados.");
export const resendEnv = () => load(resendSchema, "Resend", "El envío de correos todavía no está configurado.");
export const cronEnv = () => load(cronSchema, "Tareas programadas (CRON_SECRET)", "Las tareas programadas no están configuradas.");
