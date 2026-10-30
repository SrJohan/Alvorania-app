"use server";
// Equipo de la gestoría: el admin da de alta asesores. Todo con service role tras comprobar que quien llama es admin;
// el trigger guard_profile_update ya impide que nadie más cambie un rol por la API.
import { randomBytes } from "node:crypto";
import { supabaseAdmin } from "@/lib/supabase/server";
import { requireAdmin, requireStaff, type Role } from "./authz";
import { AppError, run, type ActionResult } from "./errors";
import { emailSchema, nameSchema } from "./validation";

export type TeamMember = { id: string; fullName: string; email: string; role: Role; createdAt: string };

/** Rol de quien mira el panel: decide si se enseña el enlace a Equipo. */
export async function staffRole(): Promise<ActionResult<Role>> {
  return run(async () => (await requireStaff()).role);
}

export async function teamMembers(): Promise<ActionResult<TeamMember[]>> {
  return run(async () => {
    await requireAdmin();
    const { data, error } = await supabaseAdmin().from("profiles").select("id,full_name,email,role,created_at")
      .in("role", ["advisor", "admin"]).is("deleted_at", null).order("created_at");
    if (error) throw error;
    return data.map((p) => ({ id: p.id, fullName: p.full_name, email: p.email, role: p.role as Role, createdAt: p.created_at }));
  });
}

/**
 * Da de alta un asesor. Si el correo es nuevo, crea la cuenta con una contraseña temporal que se devuelve una sola vez
 * para que el admin se la pase; el asesor la cambia con «¿Olvidaste tu contraseña?». Si ya existe como cliente, lo promueve.
 */
export async function addAdvisor(input: { fullName: string; email: string }): Promise<ActionResult<{ temporaryPassword: string | null }>> {
  return run(async () => {
    const { user } = await requireAdmin();
    const r = { email: emailSchema.safeParse(input.email), fullName: nameSchema.safeParse(input.fullName) };
    if (!r.fullName.success) throw new AppError("Escribe el nombre del asesor.", "invalid");
    if (!r.email.success) throw new AppError("Introduce un correo válido.", "invalid");
    const email = r.email.data, fullName = r.fullName.data;
    const admin = supabaseAdmin();

    const { data: existing } = await admin.from("profiles").select("id,role,deleted_at").eq("email", email).maybeSingle();
    let id: string, temporaryPassword: string | null = null;
    if (existing) {
      if (existing.deleted_at) throw new AppError("Esa cuenta está dada de baja.", "conflict");
      if (existing.role !== "client") throw new AppError("Esa persona ya forma parte del equipo.", "conflict");
      id = existing.id;
    } else {
      temporaryPassword = randomBytes(12).toString("base64url");
      const { data, error } = await admin.auth.admin.createUser({ email, password: temporaryPassword, email_confirm: true, user_metadata: { full_name: fullName } });
      if (error || !data.user) throw new AppError("No se ha podido crear la cuenta. Puede que ese correo ya esté registrado.", "conflict");
      id = data.user.id;
    }
    // El perfil lo crea el trigger handle_new_user al insertar en auth.users; aquí solo se le da el rol.
    const { error } = await admin.from("profiles").update({ role: "advisor" }).eq("id", id);
    if (error) throw error;
    await admin.from("audit_log").insert({ actor_id: user.id, action: existing ? "advisor_promoted" : "advisor_created", entity: "profile", entity_id: id });
    return { temporaryPassword };
  });
}
