"use client";
import Link from "next/link";
import { Logo } from "@/components/site/logo";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, type ReactNode } from "react";
import { LogOut } from "lucide-react";
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

const fieldStyle = {
  backgroundColor: "var(--color-accent-soft)",
  backgroundImage:
    "radial-gradient(at 0% 0%, var(--color-field-a) 0, transparent 55%), radial-gradient(at 100% 10%, var(--color-field-b) 0, transparent 50%), radial-gradient(at 40% 100%, var(--color-field-c) 0, transparent 60%)",
};

const iconButton = "grid size-11 place-items-center rounded-md text-text-muted transition-colors duration-150 hover:bg-surface-raised/70 hover:text-ink";

export function AppShell({ children }: { children: ReactNode }) {
  const hydrated = useLoaded();
  const s = useDemoState();
  const router = useRouter();
  const path = usePathname();
  const navRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    navRef.current?.querySelector<HTMLAnchorElement>('[aria-current="page"]')?.scrollIntoView({
      inline: "center",
      block: "nearest",
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
    });
  }, [path, hydrated, s.user]);

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
      <header className="flex h-16 items-center justify-between gap-2 border-b border-border bg-bg px-4 md:gap-4">
        <Link href="/app/caso" className="shrink-0 rounded-md"><Logo size="sm" /></Link>
        <div className="flex min-w-0 items-center gap-1 text-sm md:gap-3">
          {s.case && <div className="min-w-0 max-w-36 [&>span]:block [&>span]:truncate md:max-w-none"><StatusBadge status={s.case.status} /></div>}
          <span className="hidden text-text-muted sm:inline">{s.user.fullName}</span>
          <button type="button" className={`${iconButton} shrink-0 md:flex md:w-auto md:gap-3 md:px-3 md:text-sm md:font-medium`} onClick={async () => { await signOut(); router.push("/acceder"); }}>
            <LogOut aria-hidden className="size-5" strokeWidth={1.75} />
            <span className="sr-only md:not-sr-only">Salir</span>
          </button>
        </div>
      </header>
      <div className="flex flex-1 flex-col md:flex-row">
        <nav aria-label="Mi cuenta" style={fieldStyle} className="min-w-0 border-b border-border md:w-64 md:shrink-0 md:border-b-0 md:border-r">
          <ul ref={navRef} className="flex gap-1 overflow-x-auto p-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden max-md:[mask-image:linear-gradient(to_right,black_calc(100%_-_24px),transparent)] md:flex-col md:p-4">
            {nav.map((n) => {
              const active = path === n.href;
              return (
                <li key={n.href} className="shrink-0">
                  <Link href={n.href} aria-current={active ? "page" : undefined} transitionTypes={[nav.findIndex((m) => m.href === n.href) > nav.findIndex((m) => m.href === path) ? "nav-forward" : "nav-back"]}
                    className={`block whitespace-nowrap rounded-md px-3 py-2.5 text-sm font-medium transition-colors duration-150 ${active ? "bg-surface-raised text-ink shadow-card" : "text-text-muted hover:bg-surface-raised/70 hover:text-ink"}`}>
                    {n.label}
                  </Link>
                </li>
              );
            })}
          </ul>
          {!isLive && <div className="hidden p-4 md:block">
            <button className="text-xs text-text-muted underline" onClick={() => { if (confirm("¿Borrar todos los datos de la demostración?")) { resetDemo(); router.push("/acceder"); } }}>
              Reiniciar demostración
            </button>
          </div>}
        </nav>
        <main id="contenido" className="mx-auto w-full max-w-4xl flex-1 p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}
