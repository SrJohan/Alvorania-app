"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/site/logo";
import { useEffect, useState, ViewTransition } from "react";
import { useDemoState } from "@/lib/data/store";

const links = [
  { href: "/precios", label: "Precios" },
  { href: "/tramites", label: "Trámites" },
  { href: "/asesoria-gestoria", label: "Autónomos" },
  { href: "/articulos", label: "Artículos" },
  { href: "/empresas", label: "Empresas" },
];

// La sección de empresas es un mundo aparte: su propio logo, menú y llamada a la acción.
const empresaLinks = [
  { href: "/empresas#soluciones", label: "Soluciones" },
  { href: "/empresas#como", label: "Cómo funciona" },
  { href: "/empresas#planes", label: "Planes" },
  { href: "/", label: "Particulares" },
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
      ? (href.split("#")[1] === section ? "location" : undefined)
      : (pathname === href || pathname.startsWith(`${href}/`) ? "page" : undefined);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!empresas) return;
    const sections = ["soluciones", "como", "planes"].flatMap((id) => document.getElementById(id)?.closest("section") ?? []);
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
        className={`mx-auto flex h-14 items-center justify-between gap-4 rounded-pill px-4 ${settling ? "" : "transition-[background-color,box-shadow,max-width,backdrop-filter] duration-300 ease-brand"} motion-reduce:transition-none ${
          scrolled ? "max-w-[calc(var(--container-wide)+16px)] bg-surface-raised/85 shadow-pop backdrop-blur-md" : "max-w-wide bg-transparent"
        }`}
      >
        <ViewTransition key={empresas ? "logo-empresas" : "logo-web"} enter="fade-in" exit="fade-out" default="none">
          <Link href={empresas ? "/empresas" : "/"} className="rounded-md"><Logo empresas={empresas} /></Link>
        </ViewTransition>
        <ViewTransition key={empresas ? "nav-empresas" : "nav-web"} enter="fade-in" exit="fade-out" default="none">
        <nav aria-label="Principal" className="hidden items-center gap-7 md:flex">
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
        className={`absolute inset-x-2 top-full mx-auto mt-2 flex max-w-wide flex-col gap-1 rounded-lg bg-surface-raised p-3 shadow-pop transition-[opacity,transform,translate,scale,rotate,visibility] ease-brand motion-reduce:transition-none sm:inset-x-4 md:hidden ${
          open ? "visible translate-y-0 opacity-100 duration-200" : "invisible -translate-y-2 opacity-0 duration-150"
        }`}
      >
        {nav.map((l) => <Link key={l.href} href={l.href} aria-current={current(l.href)} onClick={() => setOpen(false)} className="rounded-md px-2 py-3 font-medium aria-[current]:text-accent">{l.label}</Link>)}
        {empresas
          ? <Link href={DEMO} onClick={() => setOpen(false)} className={`${navCta} mt-2 h-11 justify-center`}>Solicitar una demo</Link>
          : <Link href={user ? "/app/caso" : "/acceder?next=/app/conectar"} className={`${navCta} mt-2 h-11 justify-center`}>{user ? "Mi panel" : "Empieza gratis"}</Link>}
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
            <li><Link href="/articulos" className="underline-offset-4 transition-colors hover:text-on-ink hover:underline">Artículos</Link></li>
            <li><Link href="/empresas" className="underline-offset-4 transition-colors hover:text-on-ink hover:underline">Empresas</Link></li>
          </ul>
        </div>
        <div>
          <p className="font-semibold">Legal</p>
          <ul className="mt-2 space-y-1 text-on-ink-muted">
            <li>Aviso legal (pendiente)</li>
            <li>Política de privacidad (pendiente)</li>
            <li>Condiciones del servicio (pendiente)</li>
          </ul>
        </div>
      </div>
    </footer>
  );
}
