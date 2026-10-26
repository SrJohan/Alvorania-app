"use client";
import Link from "next/link";
import { Logo } from "@/components/site/logo";
import { useEffect, useState } from "react";
import { useDemoState } from "@/lib/data/store";

const links = [
  { href: "/precios", label: "Precios" },
  { href: "/tramites", label: "Trámites" },
  { href: "/asesoria-gestoria", label: "Autónomos" },
  { href: "/articulos", label: "Artículos" },
];

const navCta = "inline-flex h-9 items-center rounded-pill bg-accent px-4 text-sm font-semibold text-on-accent transition-[transform,background-color] duration-200 ease-brand hover:-translate-y-px hover:bg-accent-hover active:scale-[0.98] motion-reduce:transform-none";

/** Barra a todo el ancho arriba del todo; al bajar se encoge en una píldora flotante. */
export function SiteHeader() {
  const { user } = useDemoState();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className="sticky top-0 z-40 px-2 pt-2 sm:px-4">
      <div
        className={`mx-auto flex h-14 items-center justify-between gap-4 px-4 transition-all duration-300 ease-brand motion-reduce:transition-none ${
          scrolled ? "max-w-[calc(var(--container-wide)+16px)] rounded-pill bg-surface-raised/85 shadow-pop backdrop-blur-md" : "max-w-wide bg-transparent"
        }`}
      >
        <Link href="/" className="rounded-md"><Logo /></Link>
        <nav aria-label="Principal" className="hidden items-center gap-7 md:flex">
          {links.map((l) => <Link key={l.href} href={l.href} className="text-sm text-text transition-colors hover:text-accent">{l.label}</Link>)}
          {user
            ? <Link href="/app/caso" className={navCta}>Mi panel</Link>
            : <><Link href="/acceder" className="text-sm font-semibold text-ink hover:text-accent">Iniciar sesión</Link><Link href="/acceder?next=/app/conectar" className={navCta}>Empieza gratis</Link></>}
        </nav>
        <button
          className="grid size-11 place-items-center rounded-full bg-surface-raised text-ink md:hidden"
          aria-expanded={open} aria-controls="menu-movil" onClick={() => setOpen(!open)}
        >
          <span className="sr-only">{open ? "Cerrar menú" : "Abrir menú"}</span>
          <span aria-hidden>{open ? "✕" : "☰"}</span>
        </button>
      </div>
      {open && (
        <nav id="menu-movil" aria-label="Principal móvil" className="mx-auto mt-2 flex max-w-wide flex-col gap-1 rounded-lg bg-surface-raised p-3 shadow-pop md:hidden">
          {links.map((l) => <Link key={l.href} href={l.href} onClick={() => setOpen(false)} className="rounded-md px-2 py-3 font-medium">{l.label}</Link>)}
          <Link href={user ? "/app/caso" : "/acceder?next=/app/conectar"} className={`${navCta} mt-2 h-11 justify-center`}>{user ? "Mi panel" : "Empieza gratis"}</Link>
        </nav>
      )}
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-24 bg-ink text-on-ink">
      <div className="mx-auto grid max-w-wide gap-8 px-4 py-12 text-sm md:grid-cols-3">
        <div>
          <Logo size="sm" tone="light" />
          <p className="mt-3 max-w-xs text-on-ink-muted">Servicios fiscales digitales con atención profesional. Gestoría sujeta a la normativa española de protección de datos.</p>
        </div>
        <div>
          <p className="font-semibold">Servicios</p>
          <ul className="mt-2 space-y-1 text-on-ink-muted">
            <li><Link href="/precios" className="underline-offset-4 transition-colors hover:text-on-ink hover:underline">Precios</Link></li>
            <li><Link href="/tramites" className="underline-offset-4 transition-colors hover:text-on-ink hover:underline">Trámites</Link></li>
            <li><Link href="/asesoria-gestoria" className="underline-offset-4 transition-colors hover:text-on-ink hover:underline">Gestoría para autónomos</Link></li>
            <li><Link href="/articulos" className="underline-offset-4 transition-colors hover:text-on-ink hover:underline">Artículos</Link></li>
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
