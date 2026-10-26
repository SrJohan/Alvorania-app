"use client";
import Link from "next/link";
import { Logo } from "@/components/site/logo";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { refreshState, signOut } from "@/lib/data/api";
import { resetDemo, useDemoState, useLoaded } from "@/lib/data/store";
import { isLive } from "@/lib/env";
import { Skeleton } from "@/components/ui/display";
import { StatusBadge } from "@/components/ui/display";

const nav = [
  { href: "/app/caso", label: "Mi caso" },
  { href: "/app/conectar", label: "Datos fiscales" },
  { href: "/app/cuestionario", label: "Cuestionario" },
  { href: "/app/resultado", label: "Resultado" },
  { href: "/app/plan", label: "Plan y pago" },
  { href: "/app/revision", label: "Revisión y aprobación" },
  { href: "/app/requerimiento", label: "Carta de Hacienda" },
  { href: "/app/suscripcion", label: "Suscripción" },
];

export function AppShell({ children }: { children: ReactNode }) {
  const hydrated = useLoaded();
  const s = useDemoState();
  const router = useRouter();
  const path = usePathname();

  // En modo live el estado viene del servidor: se carga al entrar en el área privada.
  useEffect(() => {
    if (isLive) refreshState().catch(() => undefined);
  }, []);

  useEffect(() => {
    if (hydrated && !s.user) router.replace("/acceder?next=" + encodeURIComponent(path));
  }, [hydrated, s.user, router, path]);

  if (!hydrated || !s.user) {
    return (
      <div className="mx-auto w-full max-w-content space-y-4 p-6" aria-busy="true">
        <Skeleton className="h-8 w-48" /><Skeleton className="h-40 w-full" /><span className="sr-only">Cargando…</span>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex h-16 items-center justify-between gap-4 border-b border-border bg-bg px-4">
        <Link href="/" className="rounded-md"><Logo size="sm" /></Link>
        <div className="flex items-center gap-3 text-sm">
          {s.case && <StatusBadge status={s.case.status} />}
          <span className="hidden text-text-muted sm:inline">{s.user.fullName}</span>
          <button className="font-medium underline" onClick={async () => { await signOut(); router.push("/"); }}>Salir</button>
        </div>
      </header>
      <div className="flex flex-1 flex-col md:flex-row">
        <nav aria-label="Mi cuenta" className="border-b border-border bg-surface md:w-64 md:shrink-0 md:border-b-0 md:border-r">
          <ul className="flex gap-1 overflow-x-auto p-2 md:flex-col md:p-4">
            {nav.map((n) => {
              const active = path === n.href;
              return (
                <li key={n.href} className="shrink-0">
                  <Link href={n.href} aria-current={active ? "page" : undefined}
                    className={`block whitespace-nowrap rounded-md px-3 py-2.5 text-sm ${active ? "bg-accent-soft font-semibold text-on-accent-soft" : "text-text hover:bg-border"}`}>
                    {n.label}
                  </Link>
                </li>
              );
            })}
          </ul>
          {!isLive && <div className="hidden p-4 md:block">
            <button className="text-xs text-text-muted underline" onClick={() => { if (confirm("¿Borrar todos los datos de la demostración?")) { resetDemo(); router.push("/"); } }}>
              Reiniciar demostración
            </button>
          </div>}
        </nav>
        <main id="contenido" className="mx-auto w-full max-w-4xl flex-1 p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}
