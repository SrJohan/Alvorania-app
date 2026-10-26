"use client";
import { createBrowserClient } from "@supabase/ssr";
import { requireSupabasePublic } from "@/lib/env";

/** Cliente del navegador, solo con la clave anónima. Se usa para subir archivos con URLs firmadas. */
export function supabaseBrowser() {
  const { url, anonKey } = requireSupabasePublic();
  return createBrowserClient(url, anonKey);
}
