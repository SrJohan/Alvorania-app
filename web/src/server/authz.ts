import "server-only";
import { headers } from "next/headers";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import { supabaseAdmin, supabaseForUser } from "@/lib/supabase/server";
import { AppError } from "./errors";

export type Role = "client" | "advisor" | "admin";

/** Usuario autenticado y cliente con su sesión (respeta RLS). Valida el token contra Supabase, no solo la cookie. */
export async function requireUser(): Promise<{ sb: SupabaseClient; user: User }> {
  const sb = await supabaseForUser();
  const { data: { user }, error } = await sb.auth.getUser();
  if (error || !user) throw new AppError("Inicia sesión para continuar.", "unauthenticated");
  return { sb, user };
}

export async function roleOf(userId: string): Promise<Role> {
  const { data } = await supabaseAdmin().from("profiles").select("role").eq("id", userId).single();
  return (data?.role as Role) ?? "client";
}

export async function requireStaff() {
  const ctx = await requireUser();
  const role = await roleOf(ctx.user.id);
  if (role === "client") throw new AppError("No tienes permiso para hacer esto.", "forbidden");
  return { ...ctx, role };
}

/**
 * Pregunta única de permisos: ¿puede este usuario actuar sobre este caso?
 *  - owner: el dueño del caso
 *  - staff: el asesor asignado, o un admin
 * Devuelve el caso o lanza. Se comprueba además de RLS (defensa en profundidad) porque las acciones privilegiadas usan service role.
 */
export async function requireCaseAccess(userId: string, caseId: string, as: "owner" | "staff") {
  const admin = supabaseAdmin();
  const { data: c } = await admin.from("cases").select("*").eq("id", caseId).maybeSingle();
  if (!c) throw new AppError("Caso no encontrado.", "not_found");
  if (as === "owner") {
    if (c.user_id !== userId) throw new AppError("Caso no encontrado.", "not_found"); // no revela que existe
    return c;
  }
  const role = await roleOf(userId);
  if (role === "admin" || (role === "advisor" && c.advisor_id === userId)) return c;
  throw new AppError("No tienes permiso para hacer esto.", "forbidden");
}

export async function clientIp(): Promise<string> {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "unknown";
}

/** Límite de uso por clave. Lanza si se supera. Falla cerrado: si la base no responde, no deja pasar el envío de emails. */
export async function rateLimit(key: string, max: number, windowSeconds: number) {
  const { data, error } = await supabaseAdmin().rpc("hit_rate_limit", { p_key: key, p_max: max, p_window_seconds: windowSeconds });
  if (error) throw new Error("rate limit unavailable");
  if (!data) throw new AppError("Demasiados intentos. Espera unos minutos e inténtalo de nuevo.", "rate_limited");
}
