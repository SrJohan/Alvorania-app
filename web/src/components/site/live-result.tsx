"use client";
import { useEffect, useId, useMemo, useRef, useState, type JSX } from "react";
import { DawnPanel } from "@/components/ui/dawn-panel";
import { formatEuros } from "@/lib/format";
import type { Answers } from "@/lib/tax/engine";
import { improvementCents, liveSummary } from "@/lib/tax/live";

export function LiveResult({ answers }: { answers: Answers }): JSX.Element | null {
  const summary = useMemo(() => liveSummary(answers), [answers]);
  const cents = summary.kind === "ready" ? summary.calc.resultCents : null;
  const previous = useRef<number | null>(null);
  const accumulated = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [delta, setDelta] = useState(0);
  const [open, setOpen] = useState(false);
  const detailId = useId();

  useEffect(() => {
    let update: ReturnType<typeof setTimeout> | undefined;
    if (cents === null) {
      previous.current = null;
      accumulated.current = 0;
      if (timer.current) clearTimeout(timer.current);
      update = setTimeout(() => setDelta(0), 0);
    } else if (previous.current !== cents) {
      if (previous.current !== null) {
        const improvement = improvementCents(previous.current, cents);
        accumulated.current += improvement;
        const nextDelta = accumulated.current;
        update = setTimeout(() => setDelta(nextDelta), 0);
        if (timer.current) clearTimeout(timer.current);
        timer.current = setTimeout(() => { accumulated.current = 0; setDelta(0); }, 2000);
      }
      previous.current = cents;
    }
    return () => clearTimeout(update);
  }, [cents]);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  if (summary.kind === "foral") return null;
  if (summary.kind === "empty") return <div data-testid="live-result" className="hidden rounded-[24px] border border-border bg-surface-raised p-5 text-sm text-text-muted lg:block">Rellena tus ingresos y tu comunidad y verás aquí tu resultado</div>;
  const { calc, top, partial } = summary;
  const caption = calc.approximate ? "Estimación" : partial ? "No incluye todos tus ingresos" : undefined;

  return (
    <aside data-testid="live-result" className="fixed inset-x-0 bottom-0 z-40 mx-3 mb-[max(0.75rem,env(safe-area-inset-bottom))] lg:sticky lg:inset-auto lg:top-6 lg:z-auto lg:m-0 lg:self-start">
      <DawnPanel size="compact" cents={calc.resultCents} delta={delta} caption={caption}>
        <button type="button" aria-expanded={open} aria-controls={detailId} onClick={() => setOpen(!open)} className="min-h-11 rounded-md underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 lg:hidden">Ver detalle del resultado</button>
        <div id={detailId} className={`${open ? "block" : "hidden"} max-h-[40dvh] space-y-3 overflow-y-auto lg:block lg:max-h-none`}>
          {top && <p>{top.label}: {formatEuros(Math.round(top.amount * 100))}</p>}
          {partial && <p>Esta cifra aún no incluye esos ingresos; tu asesor los suma al revisar</p>}
          <p>Un asesor lo revisará antes de presentarlo</p>
        </div>
      </DawnPanel>
    </aside>
  );
}
