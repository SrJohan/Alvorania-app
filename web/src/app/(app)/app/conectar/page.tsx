"use client";
import { useRouter } from "next/navigation";
import { useRef, useState, type CSSProperties } from "react";
import { ArrowRight, Check, FileCheck, FileUp, PenLine, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tag } from "@/components/ui/display";
import { Checkbox } from "@/components/ui/form";
import { FileDrop } from "@/components/ui/file-drop";
import { createCase, recordConsent, setDataSource } from "@/lib/data/api";
import { getState, useDemoState } from "@/lib/data/store";

const delay = (ms: number) => ({ "--d": `${ms}ms` }) as CSSProperties;

// Lavado de color de la cabecera: los mismos tonos de campo de la portada, que se disuelven hacia abajo y a los lados.
const wash = {
  backgroundImage:
    "linear-gradient(to bottom, transparent 40%, var(--color-bg) 100%), radial-gradient(at 12% 0%, var(--color-field-c) 0, transparent 55%), radial-gradient(at 88% 10%, var(--color-field-a) 0, transparent 50%)",
  maskImage: "linear-gradient(to right, transparent 0%, #000 18%, #000 82%, transparent 100%)",
  WebkitMaskImage: "linear-gradient(to right, transparent 0%, #000 18%, #000 82%, transparent 100%)",
};

// Las dos formas de aportar los datos son tarjetas grandes y elegibles: la elegida se marca con aro y fondo lila.
const option = "flex flex-col rounded-[24px] border p-5 transition-[translate,box-shadow,border-color,background-color] duration-200 ease-brand motion-reduce:transition-none sm:p-6";
const idle = "border-border bg-surface-raised shadow-card hover:-translate-y-0.5 hover:shadow-pop motion-reduce:transform-none";
const chosen = "border-accent bg-accent-soft shadow-pop ring-1 ring-accent";
const tile = "grid size-12 place-items-center rounded-[14px] text-accent transition-colors duration-200 motion-reduce:transition-none";

export default function Conectar() {
  const router = useRouter();
  const s = useDemoState();
  const [busy, setBusy] = useState(false);
  const [file, setFile] = useState<string>("");
  const [error, setError] = useState("");
  // La elección se guarda de forma asíncrona: «Continuar» espera a que termine en vez de dar un error falso.
  const pending = useRef<Promise<void> | null>(null);
  const source = s.case?.dataSource;

  function choose(kind: "manual" | "documento", name?: string) {
    setBusy(true);
    setError("");
    pending.current = (async () => {
      try {
        await createCase();
        await setDataSource(kind);
        if (name) setFile(name);
      } catch (e) {
        setError(e instanceof Error ? e.message : "No hemos podido guardar tu elección.");
      } finally {
        setBusy(false);
      }
    })();
    return pending.current;
  }

  async function next() {
    if (pending.current) await pending.current;
    const latest = getState();
    if (!latest.consents.terms || !latest.consents.privacy || !latest.consents.aeatDataAccess) {
      setError("Acepta las condiciones y el tratamiento de tus datos para continuar.");
      return;
    }
    if (!latest.case?.dataSource) {
      setError("Elige cómo quieres aportar tus datos fiscales.");
      return;
    }
    setError("");
    router.push("/app/cuestionario", { transitionTypes: ["nav-forward"] });
  }

  return (
    // El lavado de color de la cabecera sale del padding de <main> para llegar a sus bordes, como el de la portada.
    <div className="relative -m-4 space-y-6 p-4 md:-m-8 md:space-y-8 md:p-8">
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[340px]" style={wash} />

      <header className="anim-rise">
        <p className="sr-only">Paso 1 de 4</p>
        <div aria-hidden className="flex w-40 gap-1.5">
          {[0, 1, 2, 3].map((i) => <span key={i} className={`h-1.5 flex-1 rounded-pill ${i === 0 ? "bg-accent" : "bg-border-input/60"}`} />)}
        </div>
        <h1 className="mt-4 font-display text-[34px] font-semibold leading-[1.08] tracking-[-0.05em] text-ink md:text-[44px]">Tus datos fiscales</h1>
        <p className="mt-3 max-w-reading text-text-muted">Con tus datos fiscales del ejercicio 2025 calculamos tu resultado. Descárgalos de la sede de la Agencia Tributaria o introdúcelos tú.</p>
      </header>

      <div className="grid gap-4 md:grid-cols-2">
        <section aria-labelledby="op-documento" className={`${option} anim-rise ${source === "documento" ? chosen : idle}`} style={delay(60)}>
          <div className="flex items-start justify-between gap-3">
            <span aria-hidden className={`${tile} ${source === "documento" ? "bg-surface-raised" : "bg-accent-soft"}`}><FileUp className="size-6" /></span>
            <SelectBadge on={source === "documento"} />
          </div>
          <h2 id="op-documento" className="mt-5 font-display text-[22px] font-semibold leading-tight tracking-[-0.03em] text-ink">Subir mi fichero de datos fiscales</h2>
          <p className="mb-5 mt-1.5 text-sm text-text-muted">Es el más rápido: extraemos los datos por ti.</p>
          {source === "documento" && file ? (
            <p role="status" className="flex items-center gap-3 rounded-[16px] bg-surface-raised px-4 py-3 text-sm shadow-card">
              <FileCheck aria-hidden className="size-5 shrink-0 text-success" />
              <span className="min-w-0 flex-1 truncate font-medium text-ink">{file}</span>
              <Tag tone="success">Recibido</Tag>
            </p>
          ) : (
            <FileDrop busy={busy} label="Sube tu fichero" onFile={(f) => choose("documento", f.name)} />
          )}
        </section>

        <section aria-labelledby="op-manual" className={`${option} anim-rise ${source === "manual" ? chosen : idle}`} style={delay(120)}>
          <div className="flex items-start justify-between gap-3">
            <span aria-hidden className={`${tile} ${source === "manual" ? "bg-surface-raised" : "bg-accent-soft"}`}><PenLine className="size-6" /></span>
            <SelectBadge on={source === "manual"} />
          </div>
          <h2 id="op-manual" className="mt-5 font-display text-[22px] font-semibold leading-tight tracking-[-0.03em] text-ink">Introducirlos a mano</h2>
          <p className="mb-5 mt-1.5 text-sm text-text-muted">Responde unas preguntas con las cifras de tu certificado de retenciones.</p>
          <Button className="mt-auto self-start" variant={source === "manual" ? "primary" : "secondary"} loading={busy && !file} onClick={() => choose("manual")}>
            {source === "manual" ? <><Check aria-hidden className="size-4" strokeWidth={3} />Elegido</> : "Prefiero introducirlos"}
          </Button>
        </section>
      </div>

      <div className="anim-rise flex items-start gap-3 rounded-[20px] bg-surface-raised/70 p-4 text-sm shadow-card" style={delay(180)}>
        <span aria-hidden className="grid size-10 shrink-0 place-items-center rounded-[12px] bg-accent-soft text-accent"><ShieldCheck className="size-5" /></span>
        <div>
          <p className="font-semibold text-ink">Tus datos están protegidos</p>
          <p className="text-text-muted">Se guardan cifrados. Solo los ven tú y el asesor que lleve tu caso, y cada acceso queda registrado.</p>
        </div>
      </div>

      <fieldset className="anim-rise rounded-[24px] border border-border bg-surface-raised p-4 shadow-card sm:p-6" style={delay(240)}>
        <legend className="float-left mb-3 font-display text-[22px] font-semibold tracking-[-0.03em] text-ink">Antes de seguir</legend>
        <div className="clear-both space-y-1">
          {([
            ["terms", "Acepto las condiciones del servicio."],
            ["privacy", "He leído la política de privacidad."],
            ["aeatDataAccess", "Autorizo el tratamiento de mis datos fiscales para preparar mi declaración."],
          ] as const).map(([key, label]) => (
            <div key={key} className="rounded-[12px] px-3 py-2.5 transition-colors duration-150 hover:bg-surface">
              <Checkbox checked={s.consents[key]} onChange={(e) => recordConsent(key, e.target.checked)} label={label} />
            </div>
          ))}
        </div>
      </fieldset>

      {error && <p role="alert" className="text-sm text-danger">{error}</p>}
      <Button size="lg" onClick={next} className="group">
        Continuar al cuestionario
        <ArrowRight aria-hidden className="size-5 transition-[translate] duration-200 ease-brand group-hover:translate-x-0.5 motion-reduce:transition-none" />
      </Button>
    </div>
  );
}

// Insignia de selección de cada opción: círculo vacío que se rellena con el check al elegirla.
function SelectBadge({ on }: { on: boolean }) {
  return (
    <span aria-hidden className={`grid size-7 shrink-0 place-items-center rounded-full border-2 transition-[background-color,border-color] duration-200 ease-brand motion-reduce:transition-none ${on ? "border-accent bg-accent" : "border-border-input bg-surface-raised"}`}>
      <Check strokeWidth={3} className={`size-3.5 text-on-accent transition-[opacity,scale] duration-200 ease-brand motion-reduce:transition-none ${on ? "scale-100 opacity-100" : "scale-75 opacity-0"}`} />
    </span>
  );
}
