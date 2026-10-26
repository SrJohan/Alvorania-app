import { AppError } from "./errors";

/**
 * Traduce el error de Supabase al pedir un enlace de acceso. El límite de envío se explica al usuario;
 * cualquier otro error queda genérico para no revelar si la cuenta existe.
 */
export function magicLinkError(error: { status?: number; code?: string; message?: string }): Error {
  if (error.status === 429 || error.code === "over_email_send_rate_limit" || error.code === "over_request_rate_limit") {
    return new AppError("Has pedido varios enlaces seguidos. Espera unos minutos y vuelve a intentarlo; revisa también tu carpeta de spam.", "rate_limited");
  }
  return new Error("magic link failed");
}
