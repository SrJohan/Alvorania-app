"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { ArrowUpRight, BriefcaseBusiness, LogOut, Newspaper, Users } from "lucide-react";
import { Logo } from "@/components/site/logo";
import { signOut } from "@/lib/data/api";
import { staffRole } from "@/server/team-actions";
import type { Role } from "@/server/authz";

const StaffRoleContext = createContext<Role | null>(null);

export function useStaffRole(): Role | null {
  return useContext(StaffRoleContext);
}

const nav = [
  { href: "/asesor", label: "Casos", icon: BriefcaseBusiness, adminOnly: false },
  { href: "/asesor/blog", label: "Blog", icon: Newspaper, adminOnly: false },
  { href: "/asesor/equipo", label: "Equipo", icon: Users, adminOnly: true },
];

const isActive = (href: string, path: string) => (href === "/asesor" ? path === "/asesor" || /^\/asesor\/[0-9a-f-]{36}$/.test(path) : path.startsWith(href));

// El mismo campo de color de la portada y de /acceder, para que el panel se sienta parte de la web.
const fieldStyle = {
  backgroundColor: "var(--color-accent-soft)",
  backgroundImage:
    "radial-gradient(at 0% 0%, var(--color-field-a) 0, transparent 55%), radial-gradient(at 100% 10%, var(--color-field-b) 0, transparent 50%), radial-gradient(at 40% 100%, var(--color-field-c) 0, transparent 60%)",
};

const iconButton = "grid size-11 place-items-center rounded-md text-text-muted transition-colors duration-150 hover:bg-surface-raised/70 hover:text-ink";

/**
 * Marco del panel interno (asesores y administración). Barra lateral con el campo de color de la web;
 * el contenido va sobre fondo claro y denso.
 */
export function StaffShell({ children }: { children: ReactNode }) {
  const path = usePathname();
  const router = useRouter();
  const [role, setRole] = useState<Role | null>(null);

  useEffect(() => {
    let alive = true;
    staffRole().then((r) => { if (alive && r.ok) setRole(r.data); });
    return () => { alive = false; };
  }, []);

  const items = nav.filter((n) => !n.adminOnly || role === "admin");
  const exit = async () => { await signOut(); router.push("/inicio"); };
  const linkClass = (active: boolean) =>
    `flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors duration-150 ${
      active ? "bg-surface-raised text-ink shadow-card" : "text-text-muted hover:bg-surface-raised/70 hover:text-ink"
    }`;

  return (
    <StaffRoleContext.Provider value={role}>
    <div className="min-h-screen bg-surface md:grid md:grid-cols-[240px_1fr]">
      <aside style={fieldStyle} className="text-ink md:sticky md:top-0 md:flex md:h-screen md:flex-col md:border-r md:border-border">
        <div className="flex h-16 items-center justify-between gap-3 px-4 md:h-auto md:px-5 md:pb-8 md:pt-6">
          <Link href="/asesor" className="rounded-md"><Logo size="sm" /></Link>
          {/* En móvil, salir y ver la web van como iconos para que el menú quepa sin barra de desplazamiento. */}
          <div className="flex items-center gap-1 md:hidden">
            <Link href="/inicio" target="_blank" className={iconButton}><ArrowUpRight aria-hidden className="size-5" strokeWidth={1.75} /><span className="sr-only">Ver la web (se abre en otra pestaña)</span></Link>
            <button type="button" onClick={exit} className={iconButton}><LogOut aria-hidden className="size-5" strokeWidth={1.75} /><span className="sr-only">Salir</span></button>
          </div>
        </div>
        <nav aria-label="Panel interno" className="border-t border-border px-2 py-2 md:flex-1 md:border-t-0 md:px-3 md:py-0">
          <ul className="flex gap-1 overflow-x-auto [scrollbar-width:none] md:flex-col">
            {items.map(({ href, label, icon: Icon }) => {
              const active = isActive(href, path);
              return (
                <li key={href} className="shrink-0">
                  <Link href={href} aria-current={active ? "page" : undefined} className={linkClass(active)}>
                    <Icon aria-hidden className="size-4" strokeWidth={1.75} />{label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
        <div className="hidden space-y-1 border-t border-border p-3 md:block">
          <p className="px-3 pb-2 text-xs text-text-muted">{role === "admin" ? "Administración" : role ? "Asesoría" : " "}</p>
          <Link href="/inicio" target="_blank" className={linkClass(false)}><ArrowUpRight aria-hidden className="size-4" strokeWidth={1.75} />Ver la web<span className="sr-only"> (se abre en otra pestaña)</span></Link>
          <button type="button" onClick={exit} className={`${linkClass(false)} w-full`}><LogOut aria-hidden className="size-4" strokeWidth={1.75} />Salir</button>
        </div>
      </aside>
      <main id="contenido" className="min-w-0">{children}</main>
    </div>
    </StaffRoleContext.Provider>
  );
}

/** Cabecera de cada pantalla del panel: título, una frase de contexto y las acciones a la derecha. */
export function StaffPage({ title, description, actions, back, children, width = "max-w-5xl" }: {
  title: ReactNode; description?: ReactNode; actions?: ReactNode; back?: { href: string; label: string }; children: ReactNode; width?: string;
}) {
  return (
    <div className={`mx-auto w-full ${width} px-4 pb-16 pt-6 md:px-8 md:pt-10`}>
      <header className="flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          {back && <Link href={back.href} className="mb-3 inline-block text-sm text-text-muted underline-offset-4 hover:text-ink hover:underline">{back.label}</Link>}
          <h1 className="font-display text-[28px] font-semibold leading-tight tracking-[-0.035em] text-ink sm:text-[32px]">{title}</h1>
          {description && <p className="mt-1.5 max-w-2xl text-sm text-text-muted">{description}</p>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-3">{actions}</div>}
      </header>
      <div className="pt-6">{children}</div>
    </div>
  );
}
