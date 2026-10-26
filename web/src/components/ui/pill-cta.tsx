import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { ReactNode } from "react";

/**
 * Botón principal en píldora: texto en mayúsculas y un círculo claro con flecha a la derecha.
 * Al pasar el ratón sube 1px, se oscurece y la flecha avanza; al pulsar se hunde un poco.
 */
export function PillCta({ href, children, tone = "ink", className = "" }: { href: string; children: ReactNode; tone?: "ink" | "light"; className?: string }) {
  const skin = tone === "ink"
    ? "bg-accent text-on-accent hover:bg-accent-hover"
    : "bg-surface-raised text-ink hover:bg-accent-soft";
  const dot = tone === "ink" ? "bg-surface-raised text-accent" : "bg-accent text-on-accent";
  return (
    <Link
      href={href}
      className={`group inline-flex h-11 items-center gap-4 rounded-pill py-1.5 pl-5 pr-1.5 text-[13px] font-semibold uppercase tracking-[0.04em] transition-[transform,background-color,box-shadow] duration-200 ease-brand hover:-translate-y-px hover:shadow-pop active:translate-y-0 active:scale-[0.98] motion-reduce:transform-none ${skin} ${className}`}
    >
      {children}
      <span aria-hidden className={`grid size-8 place-items-center rounded-full transition-transform duration-200 ease-brand group-hover:translate-x-0.5 group-hover:-rotate-45 motion-reduce:transform-none ${dot}`}>
        <ArrowRight className="size-4" />
      </span>
    </Link>
  );
}
