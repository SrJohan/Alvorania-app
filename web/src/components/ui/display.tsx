import { Plus } from "lucide-react";
import type { ReactNode } from "react";
import type { CaseStatus } from "@/lib/data/types";
import { formatEuros } from "@/lib/format";
import { buttonClass } from "./button";
import { CountUp } from "./count-up";

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
export const StatusBadge = ({ status, staff = false }: { status: CaseStatus; staff?: boolean }) => <Tag tone={statusMap[status][1]}>{staff && status === "pendiente_aprobacion" ? "Pendiente del cliente" : statusMap[status][0]}</Tag>;

export function Notice({ children, tone = "accent", title }: { children: ReactNode; tone?: Tone; title?: string }) {
  const role = tone === "danger" ? "alert" : "status";
  return (
    <div role={role} className={`anim-swap rounded-md px-4 py-3 text-sm ${tones[tone]}`}>
      {title && <p className="font-semibold">{title}</p>}
      <div>{children}</div>
    </div>
  );
}

export function Skeleton({ className = "" }: { className?: string }) {
  return <div aria-hidden className={`motion-safe:animate-pulse rounded-md bg-border ${className}`} />;
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

export function ResultCard({ cents, savingsCents, stale, count }: { cents: number; savingsCents: number; stale?: boolean; count?: boolean }) {
  const refund = cents < 0;
  const zero = cents === 0;
  const tone = zero ? "bg-surface text-text" : refund ? "bg-success-soft text-on-success-soft" : "bg-warning-soft text-on-warning-soft";
  return (
    <div role="status" className={`rounded-lg p-6 ${tone}`}>
      <p className="text-base font-medium">{zero ? "Sin cuota" : refund ? "A devolver" : "A pagar"}</p>
      <p className="text-display font-bold">{count ? <CountUp cents={Math.abs(cents)} /> : formatEuros(Math.abs(cents))}</p>
      {savingsCents > 0 && <p className="mt-1 text-sm">Ahorras {formatEuros(savingsCents)} con deducciones que el borrador de Hacienda no suele incluir.</p>}
      {stale && <p className="mt-2 text-sm font-semibold">Has cambiado datos desde este cálculo. Vuelve a calcular.</p>}
    </div>
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
        <details key={it.q} className="group">
          <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-4 p-4 font-semibold">
            {it.q}
            <Plus aria-hidden className="size-4 shrink-0 text-accent transition-transform duration-200 group-open:rotate-45 motion-reduce:transition-none" />
          </summary>
          <div className="px-4 pb-4 text-text-muted">{it.a}</div>
        </details>
      ))}
    </div>
  );
}
