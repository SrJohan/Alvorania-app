"use client";
import { useEffect, useRef, useState, useSyncExternalStore, type CSSProperties } from "react";
import { Check } from "lucide-react";
import { LinkButton } from "@/components/ui/button";
import { Card, Tag } from "@/components/ui/display";
import { Reveal } from "@/components/ui/reveal";

const START = "/acceder?next=/app/conectar";
const headline = "font-display font-semibold tracking-[-0.06em] text-ink";
const delay = (ms: number) => ({ "--d": `${ms}ms` }) as CSSProperties;

/** Tarjeta de ejemplo de la portada: el importe cuenta de 0 al valor, la etiqueta aparece y las filas suben en cascada. */
export function ExampleCard() {
  const figure = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const el = figure.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    // El HTML llega con el valor final y oculto por .anim-late; aquí se reinicia a 0 mientras sigue oculto.
    const fmt = (n: number) => `${String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ".")} €`;
    const start = performance.now() + 300;
    el.textContent = fmt(0);
    let raf = 0;
    const tick = (now: number) => {
      const p = Math.min(Math.max((now - start) / 600, 0), 1);
      el.textContent = fmt(1280 * (1 - (1 - p) ** 3));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(raf); el.textContent = fmt(1280); };
  }, []);

  return (
    <div className="w-full max-w-[420px] justify-self-center transition-[rotate] duration-200 ease-brand motion-reduce:transform-none lg:-rotate-1 lg:justify-self-end lg:hover:rotate-0">
      <div className="rounded-t-[12px] bg-ink px-4 py-1.5 text-xs font-medium text-on-ink-muted">Ejemplo ilustrativo</div>
      <div className="rounded-b-[16px] border border-t-0 border-border bg-surface-raised p-5 shadow-pop">
        <div className="flex items-start justify-between gap-3">
          <p className="font-semibold text-ink">Trimestre 2 · IVA</p>
          <span className="anim-pop shrink-0 rounded-pill bg-accent-soft px-2.5 py-0.5 text-xs font-semibold text-on-accent-soft" style={{ animationDelay: "300ms" }}>Plazo en 9 días</span>
        </div>
        <p ref={figure} className={`${headline} anim-late mt-5 text-[44px] leading-none`}>1.280 €</p>
        <p className="mt-1 text-sm text-text-muted">a ingresar</p>
        <dl className="mt-5 divide-y divide-border border-t border-border text-sm">
          <div className="anim-swap flex justify-between gap-4 py-2.5" style={delay(400)}><dt className="text-text-muted">Facturas revisadas</dt><dd className="font-semibold text-ink">22</dd></div>
          <div className="anim-swap flex justify-between gap-4 py-2.5" style={delay(460)}><dt className="text-text-muted">Gastos deducibles</dt><dd className="font-semibold text-ink">3.940 €</dd></div>
          <div className="anim-swap flex justify-between gap-4 py-2.5" style={delay(520)}><dt className="text-text-muted">Revisión</dt><dd className="font-semibold text-ink">Asesor fiscal</dd></div>
        </dl>
        <p className="mt-1 text-sm text-text-muted">Cifras de ejemplo, no son datos reales.</p>
      </div>
    </div>
  );
}

const quarters = [
  { q: "1.er trimestre", months: "Enero a marzo", due: "20 de abril", at: [3, 20] },
  { q: "2.º trimestre", months: "Abril a junio", due: "20 de julio", at: [6, 20] },
  { q: "3.er trimestre", months: "Julio a septiembre", due: "20 de octubre", at: [9, 20] },
  { q: "4.º trimestre", months: "Octubre a diciembre", due: "30 de enero", at: [0, 30] },
];

// La fecha de hoy solo existe en el navegador: en el servidor es null y no se marca nada.
const subscribe = () => () => {};
const today = () => { const d = new Date(); return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`; };
const noToday = () => null;

/** Calendario de plazos: marca el próximo y dibuja el año hasta hoy. */
export function PlazosVivos() {
  const now = useSyncExternalStore(subscribe, today, noToday);
  const line = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = line.current;
    if (!el || !("IntersectionObserver" in window)) { if (el) el.dataset.on = "true"; return; }
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { el.dataset.on = "true"; io.disconnect(); } }, { threshold: 0.6 });
    io.observe(el);
    return () => io.disconnect();
  }, [now]);

  let nextIndex = -1, days = 0, p = 0;
  const ticks = quarters.map(() => 0);
  if (now) {
    const [y, m, d] = now.split("-").map(Number);
    const t = Date.UTC(y, m, d);
    const start = Date.UTC(y, 0, 1);
    const len = Date.UTC(y + 1, 0, 1) - start;
    p = (t - start) / len;
    quarters.forEach((q, i) => { ticks[i] = (Date.UTC(y, q.at[0], q.at[1]) - start) / len; });
    // El 4.º trimestre vence el 30 de enero: es el primero del año y, pasado octubre, el del año siguiente.
    const upcoming = quarters
      .map((q, i) => ({ i, at: Date.UTC(y, q.at[0], q.at[1]) }))
      .concat([{ i: 3, at: Date.UTC(y + 1, 0, 30) }])
      .filter((e) => e.at >= t)
      .sort((a, b) => a.at - b.at)[0];
    nextIndex = upcoming.i;
    days = Math.round((upcoming.at - t) / 86400000);
  }

  return (
    <>
      {now && (
        <div
          ref={line}
          role="img"
          aria-label="Posición de hoy en el año, con los cuatro plazos marcados"
          className="group relative mt-8 h-1.5 rounded-pill bg-border"
          style={{ "--p": p.toFixed(3) } as CSSProperties}
        >
          <span className="absolute inset-0 origin-left scale-x-0 rounded-pill bg-accent transition-[scale] duration-[600ms] ease-brand motion-reduce:transition-none group-data-[on=true]:scale-x-[var(--p)]" />
          {ticks.map((t, i) => <span key={quarters[i].due} className="absolute top-1/2 size-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-ink" style={{ left: `${(t * 100).toFixed(2)}%` }} />)}
          <span className="absolute inset-0 flex -translate-x-full items-center justify-end transition-[translate] duration-[600ms] ease-brand motion-reduce:transition-none group-data-[on=true]:[translate:calc((var(--p)-1)*100%)]">
            <span className="size-3.5 translate-x-1/2 rounded-full bg-accent ring-4 ring-bg" />
          </span>
        </div>
      )}
      <ol className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {quarters.map((q, i) => (
          <li
            key={q.q}
            aria-current={i === nextIndex ? "date" : undefined}
            className={`rounded-[20px] bg-surface p-6 ring-2 transition-shadow duration-300 ease-brand motion-reduce:transition-none ${i === nextIndex ? "ring-accent" : "ring-transparent"}`}
          >
            <p className={`${headline} text-[28px] leading-[1.1]`}>{q.due}</p>
            <p className="mt-1 text-sm text-text-muted">fecha límite</p>
            <p className="mt-5 font-semibold text-ink">{q.q}</p>
            <p className="text-sm text-text-muted">{q.months}</p>
            <p className="mt-3 min-h-5 text-sm font-semibold text-accent">
              {i === nextIndex && <span key={now} className="anim-swap block">Próximo plazo · {days === 0 ? "hoy" : days === 1 ? "mañana" : `en ${days} días`}</span>}
            </p>
          </li>
        ))}
      </ol>
    </>
  );
}

type Plan = { name: string; price: string; list: string[]; rec?: boolean };
type Row = { label: string; values: [string | boolean, string | boolean] };

const Cell = ({ v }: { v: string | boolean }) =>
  typeof v === "string" ? <>{v}</> : v ? <><Check aria-hidden className="size-4 text-accent" /><span className="sr-only">Incluido</span></> : <><span aria-hidden>–</span><span className="sr-only">No incluido</span></>;

/** Planes y tabla comparativa: señalar un plan tiñe su columna y atenúa la otra. */
export function PlanesYTabla({ plans, compare }: { plans: Plan[]; compare: Row[] }) {
  const [active, setActive] = useState<string | null>(null);
  const col = (name: string) =>
    `p-3 transition-[background-color,opacity] duration-150 ease-brand motion-reduce:transition-none ${active === null ? "" : active === name ? "bg-accent-soft" : "opacity-50"}`;

  return (
    <>
      <div className="mt-8 grid gap-4 md:grid-cols-2">
        {plans.map((p, i) => (
          <div
            key={p.name}
            id={p.rec ? "premium" : undefined}
            className="anim-target flex scroll-mt-24 rounded-lg"
            onMouseEnter={() => setActive(p.name)}
            onFocus={() => setActive(p.name)}
          >
            <Reveal delay={i * 60} className="flex w-full">
              <Card selected={p.rec} className="flex w-full flex-col transition-[transform,translate,scale,rotate,box-shadow] duration-200 ease-brand hover:-translate-y-1 hover:shadow-pop motion-reduce:transform-none">
                <div className="flex items-center justify-between"><h3 className="text-lg font-semibold">{p.name}</h3>{p.rec && <Tag tone="accent">Recomendado</Tag>}</div>
                <p className="mt-3 text-xl font-bold">{p.price}<span className="text-sm font-normal text-text-muted"> al mes</span></p>
                <ul className="mt-4 flex-1 space-y-1 text-sm">{p.list.map((l) => <li key={l} className="flex gap-2"><Check aria-hidden className="mt-0.5 size-4 shrink-0 text-accent" />{l}</li>)}</ul>
                <p className="mt-4 text-sm text-text-muted">Compromiso mínimo de 3 meses.</p>
                <div className="mt-4"><LinkButton href={START} variant={p.rec ? "primary" : "secondary"}>Contratar {p.name}</LinkButton></div>
              </Card>
            </Reveal>
          </div>
        ))}
      </div>

      <div className="relative mt-8">
        <table className="w-full border-collapse text-sm">
          <caption className="sr-only">Comparativa de los planes para autónomos</caption>
          <thead>
            <tr className="bg-surface text-left">
              <th scope="col" className="p-3">Incluye</th>
              {plans.map((p) => <th key={p.name} scope="col" className={col(p.name)}>{p.name}</th>)}
            </tr>
          </thead>
          <tbody>
            {compare.map((r) => (
              <tr key={r.label} className="border-b border-border transition-colors duration-150 hover:bg-accent-soft">
                <th scope="row" className="p-3 text-left font-normal">
                  {r.label}{r.values[0] === false && r.values[1] === true && <span className="ml-2 align-middle"><Tag tone="accent">Premium</Tag></span>}
                </th>
                {r.values.map((v, i) => <td key={i} className={col(plans[i].name)}><Cell v={v} /></td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

/** Barra de contratar en móvil: entra cuando los botones de la portada salen de pantalla y se va al llegar al cierre. */
export function BarraContratar({ href = START, label = "Contratar desde 29,90 € al mes", endId = "cierre" }: { href?: string; label?: string; endId?: string }) {
  const bar = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = bar.current;
    const hero = document.getElementById("hero-cta");
    const end = document.getElementById(endId);
    if (!el || !hero || !end || !("IntersectionObserver" in window)) return;
    let heroGone = false, endReached = false;
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (e.target === hero) heroGone = !e.isIntersecting && e.boundingClientRect.top < 0;
        else endReached = e.isIntersecting || e.boundingClientRect.top < 0;
      }
      el.dataset.show = String(heroGone && !endReached);
    });
    io.observe(hero);
    io.observe(end);
    return () => io.disconnect();
  }, [endId]);

  return (
    <div
      ref={bar}
      data-show="false"
      className="invisible fixed inset-x-0 bottom-0 z-30 translate-y-full opacity-0 transition-[opacity,translate,visibility] duration-200 ease-brand motion-reduce:transition-none data-[show=true]:visible data-[show=true]:translate-y-0 data-[show=true]:opacity-100 md:hidden"
    >
      <div className="mx-2 mb-2 rounded-[20px] bg-surface-raised p-3 shadow-pop">
        <LinkButton href={href} className="w-full">{label}</LinkButton>
      </div>
    </div>
  );
}
