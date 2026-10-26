"use client";
import { useId, useRef, useState, type ReactNode } from "react";
import type { CaseStatus } from "@/lib/data/types";
import { formatEuros } from "@/lib/format";
import { buttonClass } from "./button";

export function Card({ children, selected, className = "" }: { children: ReactNode; selected?: boolean; className?: string }) {
  return (
    <div className={`rounded-lg bg-surface-raised p-6 shadow-card ${selected ? "border-2 border-accent bg-accent-soft p-[23px]" : "border border-border"} ${className}`}>
      {children}
    </div>
  );
}

type Tone = "neutral" | "accent" | "success" | "warning" | "danger";
const tones: Record<Tone, string> = {
  neutral: "border border-border bg-surface text-text-muted",
  accent: "bg-accent-soft text-on-accent-soft",
  success: "bg-success-soft text-on-success-soft",
  warning: "bg-warning-soft text-on-warning-soft",
  danger: "bg-danger-soft text-on-danger-soft",
};

export function Tag({ tone = "neutral", children }: { tone?: Tone; children: ReactNode }) {
  return <span className={`inline-block rounded-pill px-2 py-0.5 text-xs font-medium ${tones[tone]}`}>{children}</span>;
}

const statusMap: Record<CaseStatus, [string, Tone]> = {
  borrador: ["Borrador", "neutral"],
  calculado: ["Calculado", "accent"],
  pagado: ["Pagado", "accent"],
  en_revision: ["En revisión", "accent"],
  pendiente_aprobacion: ["Pendiente de tu aprobación", "warning"],
  presentado: ["Presentado", "success"],
  cerrado: ["Cerrado", "neutral"],
  cancelado: ["Cancelado", "danger"],
};
export const StatusBadge = ({ status }: { status: CaseStatus }) => <Tag tone={statusMap[status][1]}>{statusMap[status][0]}</Tag>;

export function Notice({ children, tone = "accent", title }: { children: ReactNode; tone?: Tone; title?: string }) {
  const role = tone === "danger" ? "alert" : "status";
  return (
    <div role={role} className={`rounded-md px-4 py-3 text-sm ${tones[tone]}`}>
      {title && <p className="font-semibold">{title}</p>}
      <div>{children}</div>
    </div>
  );
}

export function Skeleton({ className = "" }: { className?: string }) {
  return <div aria-hidden className={`animate-pulse rounded-md bg-border ${className}`} />;
}

export function EmptyState({ title, text, action }: { title: string; text: string; action?: ReactNode }) {
  return (
    <div className="rounded-lg border border-dashed border-border-input bg-surface p-8 text-center">
      <p className="text-lg font-semibold">{title}</p>
      <p className="mx-auto mt-1 max-w-reading text-text-muted">{text}</p>
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  );
}

export function ErrorState({ title = "Algo ha salido mal", text, onRetry }: { title?: string; text: string; onRetry?: () => void }) {
  return (
    <div role="alert" className="rounded-lg bg-danger-soft p-6 text-on-danger-soft">
      <p className="font-semibold">{title}</p>
      <p className="mt-1 text-sm">{text}</p>
      {onRetry && <button onClick={onRetry} className={buttonClass("secondary", "sm", "mt-3")}>Reintentar</button>}
    </div>
  );
}

export function ResultCard({ cents, savingsCents, stale }: { cents: number; savingsCents: number; stale?: boolean }) {
  const refund = cents < 0;
  const zero = cents === 0;
  const tone = zero ? "bg-surface text-text" : refund ? "bg-success-soft text-on-success-soft" : "bg-warning-soft text-on-warning-soft";
  return (
    <div role="status" className={`rounded-lg p-6 ${tone}`}>
      <p className="text-base font-medium">{zero ? "Sin cuota" : refund ? "A devolver" : "A pagar"}</p>
      <p className="text-display font-bold">{formatEuros(Math.abs(cents))}</p>
      {savingsCents > 0 && <p className="mt-1 text-sm">Ahorras {formatEuros(savingsCents)} frente al borrador.</p>}
      {stale && <p className="mt-2 text-sm font-semibold">Has cambiado datos desde este cálculo. Vuelve a calcular.</p>}
    </div>
  );
}

export function Stepper({ steps, current }: { steps: string[]; current: number }) {
  return (
    <>
      <p className="text-sm font-medium sm:hidden">Paso {current + 1} de {steps.length}: {steps[current]}</p>
      <ol className="hidden flex-wrap items-center gap-x-3 gap-y-2 sm:flex">
        {steps.map((s, i) => {
          const done = i < current;
          const cur = i === current;
          return (
            <li key={s} aria-current={cur ? "step" : undefined} className={`flex items-center gap-2 text-sm ${cur ? "font-semibold text-text" : "text-text-muted"}`}>
              <span className={`grid size-7 place-items-center rounded-full border-2 text-xs font-semibold ${done ? "border-success bg-success text-on-accent" : cur ? "border-accent text-accent" : "border-border-input"}`}>
                {done ? <>✓<span className="sr-only"> completado</span></> : i + 1}
              </span>
              {s}
              {i < steps.length - 1 && <span aria-hidden className="ml-1 h-0.5 w-6 bg-border" />}
            </li>
          );
        })}
      </ol>
    </>
  );
}

export type TimelineItem = { title: string; detail?: string; state: "done" | "current" | "pending"; action?: ReactNode };
export function Timeline({ items }: { items: TimelineItem[] }) {
  return (
    <ol className="ml-2 border-l-2 border-border pl-4">
      {items.map((it) => (
        <li key={it.title} aria-current={it.state === "current" ? "step" : undefined} className="relative pb-5 pl-4 last:pb-0">
          <span aria-hidden className={`absolute -left-[23px] top-1 size-3 rounded-full ${it.state === "done" ? "bg-success" : it.state === "current" ? "bg-accent ring-4 ring-accent-soft" : "bg-border-input"}`} />
          <p className={it.state === "pending" ? "font-medium text-text-muted" : "font-semibold"}>
            {it.title}
            <span className="sr-only">{it.state === "done" ? " (completado)" : it.state === "current" ? " (en curso)" : " (pendiente)"}</span>
          </p>
          {it.detail && <p className="text-sm text-text-muted">{it.detail}</p>}
          {it.action && <div className="mt-2">{it.action}</div>}
        </li>
      ))}
    </ol>
  );
}

export function Accordion({ items }: { items: { q: string; a: ReactNode }[] }) {
  return (
    <div className="divide-y divide-border rounded-lg border border-border">
      {items.map((it) => (
        <details key={it.q} className="group p-4">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold">
            {it.q}
            <span aria-hidden className="text-text-muted transition-transform group-open:rotate-45">+</span>
          </summary>
          <div className="mt-2 text-text-muted">{it.a}</div>
        </details>
      ))}
    </div>
  );
}

export function FileDrop({
  onFile, busy, error, accept = ".pdf,.jpg,.jpeg,.png", maxMb = 20, label = "Sube tu documento",
}: { onFile: (f: File) => void; busy?: boolean; error?: string; accept?: string; maxMb?: number; label?: string }) {
  const ref = useRef<HTMLInputElement>(null);
  const inputId = useId();
  const [drag, setDrag] = useState(false);
  const [localError, setLocalError] = useState("");
  const pick = (f?: File) => {
    if (!f) return;
    const okType = /\.(pdf|jpe?g|png)$/i.test(f.name);
    if (!okType) return setLocalError("Formato no admitido. Usa PDF, JPG o PNG.");
    if (f.size > maxMb * 1024 * 1024) return setLocalError(`El archivo supera los ${maxMb} MB.`);
    setLocalError("");
    onFile(f);
  };
  const msg = error || localError;
  return (
    <div>
      <div
        onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => { e.preventDefault(); setDrag(false); pick(e.dataTransfer.files[0]); }}
        className={`rounded-lg border-2 border-dashed p-8 text-center ${drag ? "border-accent bg-accent-soft" : "border-border-input bg-surface"}`}
      >
        <p className="font-semibold">{label}</p>
        <p className="text-sm text-text-muted">Arrastra el archivo aquí o elígelo. PDF, JPG o PNG, hasta {maxMb} MB.</p>
        <input ref={ref} type="file" accept={accept} className="sr-only" id={inputId} onChange={(e) => pick(e.target.files?.[0])} />
        <label htmlFor={inputId} className={`${buttonClass("secondary", "md", "mt-3 cursor-pointer")} ${busy ? "pointer-events-none opacity-50" : ""}`}>
          {busy ? "Subiendo…" : "Elegir archivo"}
        </label>
        {busy && <div role="progressbar" aria-label="Subiendo archivo" className="mx-auto mt-3 h-1.5 w-48 overflow-hidden rounded-pill bg-border"><div className="h-full w-1/2 animate-pulse bg-accent" /></div>}
      </div>
      {msg && <p role="alert" className="mt-2 text-sm text-danger">{msg}</p>}
    </div>
  );
}
