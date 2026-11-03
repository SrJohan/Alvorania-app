"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/site/logo";
import { useEffect, useRef, useState, ViewTransition } from "react";
import { ArrowRight, CalendarCheck, ChevronDown, FilePen, FileText, Globe, Mail, PlaneTakeoff, RotateCcw, UserPlus, type LucideIcon } from "lucide-react";
import { tramiteGroups } from "@/lib/tramites";
import { useDemoState } from "@/lib/data/store";

const links = [
  { href: "/precios", label: "Precios" },
  { href: "/asesoria-gestoria", label: "Autónomos" },
  { href: "/blog", label: "Blog" },
  { href: "/empresas", label: "Empresas" },
];

// La sección de empresas es un mundo aparte: su propio logo, menú y llamada a la acción.
const empresaLinks = [
  { href: "/empresas#soluciones", label: "Soluciones" },
  { href: "/empresas#como", label: "Cómo funciona" },
  { href: "/empresas/planes", label: "Planes" },
  { href: "/inicio", label: "Particulares" },
];
const DEMO = "/empresas#demo";

const navCta = "inline-flex h-9 items-center rounded-pill bg-accent px-4 text-sm font-semibold text-on-accent transition-[transform,translate,scale,rotate,background-color] duration-200 ease-brand hover:-translate-y-px hover:bg-accent-hover active:scale-[0.98] motion-reduce:transform-none";

const navLink = "group relative text-sm text-text transition-colors hover:text-accent aria-[current]:text-accent";

/** Enlace del menú: el subrayado crece desde la izquierda en el enlace de la página o sección actual. */
function NavLink({ href, current, onClick, children }: { href: string; current?: "page" | "location"; onClick?: () => void; children: string }) {
  return (
    <Link href={href} aria-current={current} onClick={onClick} className={navLink}>
      {children}
      <span aria-hidden className="absolute inset-x-0 -bottom-1.5 h-0.5 origin-left scale-x-0 rounded-pill bg-accent transition-[scale] duration-200 ease-brand motion-reduce:transition-none group-aria-[current]:scale-x-100" />
    </Link>
  );
}

const tramiteIcons: Record<string, LucideIcon> = {
  "declaracion-renta": FileText,
  "revision-ejercicios": RotateCcw,
  "analisis-carta-hacienda": Mail,
  "respuesta-requerimiento": FilePen,
  "alta-autonomo": UserPlus,
  "gestoria-mensual": CalendarCheck,
  "modelo-720": Globe,
  "residencia-fiscal": PlaneTakeoff,
};

function ServicesMenu({ pathname }: { pathname: string }) {
  const [open, setOpen] = useState(false);
  const button = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hoverOpened = useRef(false);

  function clearClose() {
    if (timer.current !== null) clearTimeout(timer.current);
    timer.current = null;
  }

  function close() {
    clearClose();
    hoverOpened.current = false;
    setOpen(false);
  }

  function enter() {
    clearClose();
    if (!open) hoverOpened.current = true;
    setOpen(true);
  }

  function leave() {
    clearClose();
    // El margen permite cruzar el hueco sin cerrar el panel ni interrumpir el foco.
    timer.current = setTimeout(() => {
      if (panel.current?.contains(document.activeElement) || button.current === document.activeElement) return;
      hoverOpened.current = false;
      setOpen(false);
    }, 120);
  }

  useEffect(() => {
    setOpen(false);
    hoverOpened.current = false;
    if (timer.current !== null) clearTimeout(timer.current);
    return () => { if (timer.current !== null) clearTimeout(timer.current); };
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    function dismiss() {
      if (timer.current !== null) clearTimeout(timer.current);
      hoverOpened.current = false;
      setOpen(false);
    }
    function onKey(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      event.preventDefault();
      dismiss();
      button.current?.focus();
    }
    function onOutside(event: PointerEvent) {
      if (!(event.target instanceof Node) || button.current?.contains(event.target) || panel.current?.contains(event.target)) return;
      dismiss();
    }
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onOutside);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onOutside);
    };
  }, [open]);

  return (
    <>
      <button
        ref={button} type="button" aria-expanded={open} aria-controls="menu-servicios"
        aria-current={pathname.startsWith("/tramites") ? "page" : undefined}
        className={`${navLink} inline-flex items-center gap-1.5`}
        onMouseEnter={enter} onMouseLeave={leave}
        onClick={(event) => {
          clearClose();
          // El primer clic tras abrir con el ratón mantiene el panel abierto.
          if (event.detail > 0 && hoverOpened.current) setOpen(true);
          else setOpen(!open);
          hoverOpened.current = false;
        }}
      >
        Servicios
        <ChevronDown aria-hidden className={`size-3.5 transition-[rotate] duration-200 ease-brand motion-reduce:transition-none ${open ? "rotate-180" : ""}`} />
        <span aria-hidden className="absolute inset-x-0 -bottom-1.5 h-0.5 origin-left scale-x-0 rounded-pill bg-accent transition-[scale] duration-200 ease-brand motion-reduce:transition-none group-aria-[current]:scale-x-100" />
      </button>
      {/* Sin contenedor posicionado, el panel toma el header como referencia. */}
      <div
        ref={panel} id="menu-servicios" inert={!open}
        onMouseEnter={enter} onMouseLeave={leave}
        className={`absolute inset-x-2 top-full mx-auto mt-2 max-w-wide rounded-lg bg-surface-raised p-6 shadow-pop transition-[opacity,transform,translate,scale,rotate,visibility] ease-brand motion-reduce:transition-none sm:inset-x-4 lg:p-8 ${open ? "visible translate-y-0 opacity-100 duration-200" : "invisible -translate-y-2 opacity-0 duration-150"}`}
      >
        <div className="grid gap-x-8 gap-y-6 md:grid-cols-2 lg:grid-cols-4">
          {tramiteGroups.map((group) => (
            <div key={group.title}>
              <p className="mb-3 text-sm font-semibold text-ink">{group.title}</p>
              {group.items.map((item) => {
                const Icon = tramiteIcons[item.slug];
                return (
                  <Link key={item.slug} href={`/tramites/${item.slug}`} onClick={close} className="-mx-3 block rounded-md p-3 hover:bg-accent-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent">
                    <span className="flex items-start gap-2 text-sm font-semibold text-ink">
                      <Icon aria-hidden className="mt-0.5 size-4 shrink-0 text-accent" />
                      <span>{item.name}{item.soon && <span className="ml-2 inline-block rounded-pill bg-surface px-2 text-[11px] font-semibold text-text-muted">Próximamente</span>}</span>
                    </span>
                    <span className="mt-1 line-clamp-2 text-[13px] leading-snug text-text-muted">{item.summary}</span>
                  </Link>
                );
              })}
            </div>
          ))}
        </div>
        <div className="mt-6 border-t border-border pt-4">
          <Link href="/tramites" onClick={close} className="group inline-flex items-center gap-2 text-sm font-semibold text-ink hover:text-accent">
            Ver todos los trámites
            <ArrowRight aria-hidden className="size-4 transition-transform duration-200 group-hover:translate-x-1 motion-reduce:transform-none" />
          </Link>
        </div>
      </div>
    </>
  );
}

/** Barra a todo el ancho arriba del todo; al bajar se encoge en una píldora flotante. */
export function SiteHeader() {
  const { user } = useDemoState();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();
  const empresas = pathname.startsWith("/empresas");
  const nav = empresas ? empresaLinks : links;
  // Al cambiar de página el scroll vuelve arriba: el cambio de estado de la barra no se anima para no competir con la transición de vista.
  const [settling, setSettling] = useState(false);
  // Sección de /empresas que cruza el centro de la pantalla.
  const [section, setSection] = useState<string | null>(null);
  const current = (href: string): "page" | "location" | undefined =>
    empresas
      ? (href === pathname ? "page" : href.split("#")[1] === section ? "location" : undefined)
      : (pathname === href || pathname.startsWith(`${href}/`) ? "page" : undefined);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!empresas) return;
    const sections = ["soluciones", "como"].flatMap((id) => document.getElementById(id)?.closest("section") ?? []);
    if (!sections.length || !("IntersectionObserver" in window)) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          const id = e.target.getAttribute("aria-labelledby") ?? "";
          if (e.isIntersecting) setSection(id);
          else if (e.boundingClientRect.top > 0) setSection((cur) => (cur === id ? null : cur));
        }
      },
      { rootMargin: "-40% 0px -55% 0px" },
    );
    sections.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [empresas, pathname]);

  useEffect(() => {
    setSettling(true);
    const id = requestAnimationFrame(() => requestAnimationFrame(() => setSettling(false)));
    return () => cancelAnimationFrame(id);
  }, [pathname]);

  return (
    <header className="sticky top-0 z-40 px-2 pt-2 sm:px-4">
      <div
        // El ancho no cambia al hacer scroll: animar max-width recalculaba el layout de la barra en cada fotograma.
        className={`mx-auto flex h-14 max-w-wide items-center justify-between gap-4 rounded-pill px-4 ${settling ? "" : "transition-[background-color,box-shadow,backdrop-filter] duration-300 ease-brand"} motion-reduce:transition-none ${
          scrolled ? "bg-surface-raised/85 shadow-pop backdrop-blur-md" : "bg-transparent"
        }`}
      >
        <ViewTransition key={empresas ? "logo-empresas" : "logo-web"} enter="fade-in" exit="fade-out" default="none">
          <Link href="/inicio" className="rounded-md"><Logo empresas={empresas} /></Link>
        </ViewTransition>
        <ViewTransition key={empresas ? "nav-empresas" : "nav-web"} enter="fade-in" exit="fade-out" default="none">
        <nav aria-label="Principal" className="hidden items-center gap-7 md:flex">
          {!empresas && <ServicesMenu pathname={pathname} />}
          {nav.map((l) => <NavLink key={l.href} href={l.href} current={current(l.href)}>{l.label}</NavLink>)}
          {empresas
            ? <Link href={DEMO} className={navCta}>Solicitar una demo</Link>
            : user
              ? <Link href="/app/caso" className={navCta}>Mi panel</Link>
              : <><Link href="/acceder" className="text-sm font-semibold text-ink hover:text-accent">Iniciar sesión</Link><Link href="/acceder?next=/app/conectar" className={navCta}>Empieza gratis</Link></>}
        </nav>
        </ViewTransition>
        <button
          className="grid size-11 place-items-center rounded-full bg-surface-raised text-ink md:hidden"
          aria-expanded={open} aria-controls="menu-movil" onClick={() => setOpen(!open)}
        >
          <span className="sr-only">{open ? "Cerrar menú" : "Abrir menú"}</span>
          <span aria-hidden className="grid place-items-center">
            <span className={`col-start-1 row-start-1 transition-[opacity,transform,translate,scale,rotate] duration-150 ease-brand motion-reduce:transition-none ${open ? "-rotate-90 scale-75 opacity-0" : ""}`}>☰</span>
            <span className={`col-start-1 row-start-1 transition-[opacity,transform,translate,scale,rotate] duration-150 ease-brand motion-reduce:transition-none ${open ? "" : "rotate-90 scale-75 opacity-0"}`}>✕</span>
          </span>
        </button>
      </div>
      {/* Siempre montado para poder animar la salida; cerrado queda invisible e inerte. */}
      <nav
        id="menu-movil" aria-label="Principal móvil" inert={!open}
        className={`absolute inset-x-2 top-full mx-auto mt-2 flex max-h-[calc(100dvh-5.5rem)] max-w-wide flex-col gap-1 overflow-y-auto overscroll-contain rounded-lg bg-surface-raised p-3 shadow-pop transition-[opacity,transform,translate,scale,rotate,visibility] ease-brand motion-reduce:transition-none sm:inset-x-4 md:hidden ${
          open ? "visible translate-y-0 opacity-100 duration-200" : "invisible -translate-y-2 opacity-0 duration-150"
        }`}
      >
        {!empresas && (
          <details className="group/services">
            <summary className="flex cursor-pointer list-none items-center justify-between rounded-md px-2 py-3 font-medium [&::-webkit-details-marker]:hidden">
              Servicios
              <ChevronDown aria-hidden className="size-3.5 transition-[rotate] duration-200 ease-brand group-open/services:rotate-180 motion-reduce:transition-none" />
            </summary>
            {tramiteGroups.map((group) => (
              <div key={group.title}>
                <p className="px-2 pt-2 text-xs font-semibold text-text-muted">{group.title}</p>
                {group.items.map((item) => {
                  const Icon = tramiteIcons[item.slug];
                  return (
                    <Link key={item.slug} href={`/tramites/${item.slug}`} onClick={() => setOpen(false)} className="flex items-center gap-2 rounded-md px-2 py-2.5 text-sm hover:bg-accent-soft">
                      <Icon aria-hidden className="size-4 shrink-0 text-accent" />
                      {item.name}
                    </Link>
                  );
                })}
              </div>
            ))}
            <Link href="/tramites" onClick={() => setOpen(false)} className="flex items-center gap-2 rounded-md px-2 py-2.5 text-sm font-semibold hover:text-accent">
              Ver todos los trámites<ArrowRight aria-hidden className="size-4" />
            </Link>
          </details>
        )}
        {nav.map((l) => <Link key={l.href} href={l.href} aria-current={current(l.href)} onClick={() => setOpen(false)} className="rounded-md px-2 py-3 font-medium aria-[current]:text-accent">{l.label}</Link>)}
        {empresas
          ? <Link href={DEMO} onClick={() => setOpen(false)} className={`${navCta} mt-2 h-11 justify-center`}>Solicitar una demo</Link>
          : <Link href={user ? "/app/caso" : "/acceder?next=/app/conectar"} onClick={() => setOpen(false)} className={`${navCta} mt-2 h-11 justify-center`}>{user ? "Mi panel" : "Empieza gratis"}</Link>}
      </nav>
    </header>
  );
}

export function SiteFooter() {
  const empresas = usePathname().startsWith("/empresas");
  return (
    <footer className="mt-24 bg-ink text-on-ink">
      <div className="mx-auto grid max-w-wide gap-8 px-4 py-12 text-sm md:grid-cols-3">
        <div>
          <Logo size="sm" tone="light" empresas={empresas} />
          <p className="mt-3 max-w-xs text-on-ink-muted">Servicios fiscales digitales con atención profesional. Gestoría sujeta a la normativa española de protección de datos.</p>
        </div>
        <div>
          <p className="font-semibold">Servicios</p>
          <ul className="mt-2 space-y-1 text-on-ink-muted">
            <li><Link href="/precios" className="underline-offset-4 transition-colors hover:text-on-ink hover:underline">Precios</Link></li>
            <li><Link href="/tramites" className="underline-offset-4 transition-colors hover:text-on-ink hover:underline">Trámites</Link></li>
            <li><Link href="/asesoria-gestoria" className="underline-offset-4 transition-colors hover:text-on-ink hover:underline">Gestoría para autónomos</Link></li>
            <li><Link href="/blog" className="underline-offset-4 transition-colors hover:text-on-ink hover:underline">Blog</Link></li>
            <li><Link href="/empresas" className="underline-offset-4 transition-colors hover:text-on-ink hover:underline">Empresas</Link></li>
          </ul>
        </div>
        <div>
          <p className="font-semibold">Legal</p>
          <ul className="mt-2 space-y-1 text-on-ink-muted">
            <li><Link href="/aviso-legal" className="underline-offset-4 transition-colors hover:text-on-ink hover:underline">Aviso legal</Link></li>
            <li><Link href="/privacidad" className="underline-offset-4 transition-colors hover:text-on-ink hover:underline">Política de privacidad</Link></li>
            <li><Link href="/cookies" className="underline-offset-4 transition-colors hover:text-on-ink hover:underline">Política de cookies</Link></li>
            <li><Link href="/condiciones" className="underline-offset-4 transition-colors hover:text-on-ink hover:underline">Condiciones del servicio</Link></li>
          </ul>
        </div>
      </div>
    </footer>
  );
}
