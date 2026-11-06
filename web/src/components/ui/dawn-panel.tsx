import type { JSX, ReactNode } from "react";
import { CountUp } from "@/components/ui/count-up";
import { formatEuros } from "@/lib/format";

export function DawnPanel({ cents, size, savingsCents = 0, stale, delta, caption, children }: {
  cents: number;
  size: "compact" | "hero";
  savingsCents?: number;
  stale?: boolean;
  delta?: number | null;
  caption?: string;
  children?: ReactNode;
}): JSX.Element {
  const hero = size === "hero";
  const label = cents > 0 ? "A pagar" : cents < 0 ? "A devolver" : "Sin cuota";

  return (
    <div role={hero ? "status" : undefined} className={`relative isolate overflow-hidden rounded-[24px] text-on-ink shadow-pop ${hero ? "p-6 pb-10 md:p-8 md:pb-10" : "p-3 pb-6 lg:p-4 lg:pb-8"}`} style={{ background: cents === 0 ? "var(--color-ink-raised)" : "linear-gradient(120deg, var(--color-ink) 40%, var(--color-bright) 100%)" }}>
      {cents < 0 && <div aria-hidden className="pointer-events-none absolute bottom-0 right-0 -z-10 h-6 w-1/2" style={{ background: "radial-gradient(ellipse at bottom right, var(--color-field-b), var(--color-highlight) 15%, transparent 70%)" }} />}
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <p aria-live={hero ? undefined : "polite"} className="text-base font-medium">{label}</p>
        {caption && <span className="text-sm">{caption}</span>}
      </div>
      <div className="mt-2 flex flex-wrap items-baseline gap-x-4 gap-y-2">
        <p className={`min-w-0 break-words font-display font-bold leading-tight tabular-nums ${hero ? "text-[56px] md:text-[72px]" : "text-[30px] lg:text-[48px]"}`}>
          <CountUp cents={Math.abs(cents)} />
        </p>
        {delta != null && delta !== 0 && (
          <span key={delta} className="anim-pop text-sm font-semibold tabular-nums">
            <span aria-hidden>{delta > 0 ? "+" : "-"}{formatEuros(Math.abs(delta))}</span>
            <span className="sr-only">{delta > 0 ? "mejora" : "empeora"} {new Intl.NumberFormat("es-ES").format(Math.abs(delta) / 100)} euros</span>
          </span>
        )}
      </div>
      {hero && savingsCents > 0 && <p className="mt-3 text-sm">Ahorras {formatEuros(savingsCents)} con deducciones que el borrador de Hacienda no suele incluir.</p>}
      {hero && stale && <p className="mt-2 text-sm font-semibold">Has cambiado datos desde este cálculo. Vuelve a calcular.</p>}
      {children && <div className="mt-3 text-sm">{children}</div>}
    </div>
  );
}
