export class AppError extends Error {
  constructor(message: string, readonly code: "unauthenticated" | "forbidden" | "invalid" | "rate_limited" | "conflict" | "not_found" | "config" = "invalid") {
    super(message);
  }
}

export type ActionResult<T = void> = { ok: true; data: T } | { ok: false; error: string; code: AppError["code"] | "internal" };

/**
 * Next oculta el mensaje de las excepciones lanzadas desde una Server Action en producción,
 * así que las acciones devuelven un resultado en lugar de lanzar. Los errores inesperados se registran
 * y el usuario solo ve un mensaje genérico (nada de datos personales en los logs).
 */
export async function run<T>(fn: () => Promise<T>): Promise<ActionResult<T>> {
  try {
    return { ok: true, data: await fn() };
  } catch (e) {
    if (e instanceof AppError) return { ok: false, error: e.message, code: e.code };
    console.error("[action] unexpected error:", e instanceof Error ? e.message : "unknown");
    return { ok: false, error: "Algo ha salido mal. Inténtalo de nuevo en unos minutos.", code: "internal" };
  }
}
