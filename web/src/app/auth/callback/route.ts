import { NextResponse } from "next/server";
import { supabaseForUser } from "@/lib/supabase/server";

// Destino del enlace mágico: intercambia el código por una sesión (cookies http-only) y redirige.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const nextParam = searchParams.get("next") ?? "/app/conectar";
  // Solo rutas internas: evita redirecciones abiertas a otro dominio.
  const next = nextParam.startsWith("/app/") ? nextParam : "/app/conectar";

  if (code) {
    const sb = await supabaseForUser();
    const { error } = await sb.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(`${origin}${next}`);
  }
  return NextResponse.redirect(`${origin}/acceder?error=enlace`);
}
