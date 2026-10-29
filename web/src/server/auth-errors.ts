import { AppError } from "./errors";

type SupabaseAuthError = { status?: number; code?: string; message?: string };

const limited = (e: SupabaseAuthError) => e.status === 429 || e.code === "over_email_send_rate_limit" || e.code === "over_request_rate_limit";

/** Errores de entrar o crear cuenta con contraseña. Credenciales erróneas y cuenta inexistente dan el mismo mensaje. */
export function passwordAuthError(error: SupabaseAuthError): Error {
  if (limited(error)) return new AppError("Demasiados intentos. Espera unos minutos y vuelve a intentarlo.", "rate_limited");
  if (error.code === "email_not_confirmed") return new AppError("Confirma tu correo antes de entrar: te hemos enviado un enlace.", "unauthenticated");
  if (error.code === "weak_password") return new AppError("Esa contraseña es demasiado fácil de adivinar. Elige otra de al menos 8 caracteres.", "invalid");
  if (error.code === "invalid_credentials") return new AppError("Correo o contraseña incorrectos.", "unauthenticated");
  if (error.code === "user_already_exists" || error.code === "email_exists") {
    return new AppError("No hemos podido crear la cuenta. Si ya tienes una, entra con tu contraseña.", "conflict");
  }
  return new Error("password auth failed");
}
