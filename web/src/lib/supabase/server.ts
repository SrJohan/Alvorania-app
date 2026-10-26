import "server-only";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { requireSupabasePublic } from "@/lib/env";
import { serverEnv } from "@/server/env";

/** Cliente con la sesión del usuario (cookies). Respeta RLS: úsalo por defecto. */
export async function supabaseForUser() {
  const { url, anonKey } = requireSupabasePublic();
  const store = await cookies();
  return createServerClient(url, anonKey, {
    cookies: {
      getAll: () => store.getAll(),
      setAll: (toSet) => {
        try {
          toSet.forEach(({ name, value, options }) => store.set(name, value, { ...options, httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax" }));
        } catch {
          // Desde un Server Component no se pueden escribir cookies; el proxy ya refresca la sesión.
        }
      },
    },
  });
}

/** Cliente con service role: se salta RLS. Solo para webhooks, jobs y acciones que ya comprobaron permisos. Nunca al navegador. */
export function supabaseAdmin() {
  const { url } = requireSupabasePublic();
  return createClient(url, serverEnv().SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
