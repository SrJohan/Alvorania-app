import Link from "next/link";
import type { ReactNode } from "react";
import { Notice } from "@/components/ui/display";
import { LEGAL } from "@/lib/legal";

const PAGES = [
  { href: "/aviso-legal", label: "Aviso legal" },
  { href: "/privacidad", label: "Privacidad" },
  { href: "/cookies", label: "Cookies" },
  { href: "/condiciones", label: "Condiciones del servicio" },
] as const;

/** Marco común de los textos legales: sobrio, con el color de marca solo en el título, los apartados y los enlaces. */
export function LegalPage({ current, title, children }: { current: (typeof PAGES)[number]["href"]; title: string; children: ReactNode }) {
  return (
    <div className="mx-auto max-w-wide px-4 py-12">
      <nav aria-label="Textos legales" className="mb-8 flex flex-wrap gap-2 text-sm">
        {PAGES.map((p) => (
          <Link
            key={p.href}
            href={p.href}
            aria-current={p.href === current ? "page" : undefined}
            className="rounded-pill border border-border px-3 py-1 text-text-muted transition-colors hover:border-accent hover:text-accent aria-[current]:border-accent aria-[current]:bg-accent-soft aria-[current]:text-on-accent-soft"
          >
            {p.label}
          </Link>
        ))}
      </nav>
      <article className="max-w-reading">
        <h1 className="border-l-4 border-accent pl-4 text-3xl font-bold">{title}</h1>
        <p className="mt-3 text-sm text-text-muted">Última actualización: {LEGAL.updated}</p>
     
        <div className="mt-8 space-y-8">{children}</div>
      </article>
    </div>
  );
}

export function LegalSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="text-xl font-semibold text-accent">{title}</h2>
      <div className="mt-2 space-y-3 leading-relaxed [&_a]:text-accent [&_a]:underline [&_a]:underline-offset-4 [&_li]:pl-1 [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-5">{children}</div>
    </section>
  );
}

/** Un dato del titular: si aún está pendiente (empieza por «[»), se resalta para que no pase desapercibido. */
export function V({ v }: { v: string }) {
  return v.startsWith("[") ? <mark className="rounded-sm bg-warning-soft px-1 text-on-warning-soft">{v}</mark> : <>{v}</>;
}
