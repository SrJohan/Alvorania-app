"use client";
import { useRouter } from "next/navigation";
import { useRef, useState, type CSSProperties } from "react";
import { ArrowRight, Check, FileCheck, FileUp, PenLine, ShieldCheck } from "lucide-react";
import { Button, buttonClass } from "@/components/ui/button";
import { FlowHeader } from "@/components/site/flow-header";
import { Tag } from "@/components/ui/display";
import { Checkbox, TextField } from "@/components/ui/form";
import { FileDrop } from "@/components/ui/file-drop";
import { createCase, recordConsent, saveAeatReference, setDataSource } from "@/lib/data/api";
import { cleanId, isValidNif, isValidReferencia } from "@/lib/aeat";
import { getState, useDemoState } from "@/lib/data/store";

const delay = (ms: number) => ({ "--d": `${ms}ms` }) as CSSProperties;

// Las formas de aportar los datos son tarjetas grandes y elegibles: la elegida se marca con aro y fondo lila.
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
  const [nif, setNif] = useState("");
  const [referencia, setReferencia] = useState("");
  const [validated, setValidated] = useState(false);
  const [saving, setSaving] = useState(false);
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

  function saveReference() {
    if (busy) return;
    setValidated(true);
    setError("");
    if (!isValidNif(nif) || !isValidReferencia(referencia)) return;
    setBusy(true);
    setSaving(true);
    pending.current = (async () => {
      try {
        await createCase();
        await saveAeatReference(cleanId(nif), cleanId(referencia));
      } catch (e) {
        setError(e instanceof Error ? e.message : "No hemos podido guardar la referencia.");
      } finally {
        setBusy(false);
        setSaving(false);
      }
    })();
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
    <div className="space-y-6 md:space-y-8">
      <FlowHeader step={1} title="Tus datos fiscales" subtitle="Con tus datos fiscales del ejercicio 2025 calculamos tu resultado. Descárgalos de la sede de la Agencia Tributaria o introdúcelos tú." />

      <div className="grid gap-4 md:grid-cols-2">
        <section aria-labelledby="op-aeat" className={`${option} anim-rise md:col-span-2 ${source === "aeat" ? chosen : idle}`} style={delay(0)}>
          <div className="flex items-start justify-between gap-3">
            <span aria-hidden className={`${tile} ${source === "aeat" ? "bg-surface-raised" : "bg-accent-soft"}`}><ShieldCheck className="size-6" /></span>
            <div className="flex items-center gap-3"><Tag>Recomendado</Tag><SelectBadge on={source === "aeat"} /></div>
          </div>
          <h2 id="op-aeat" className="mt-5 font-display text-[22px] font-semibold leading-tight tracking-[-0.03em] text-ink">Con la Agencia Tributaria</h2>
          <p className="mt-1.5 text-sm text-text-muted">Es lo más cómodo: pides una referencia en la web de Hacienda y nosotros nos encargamos del resto.</p>
          <ol className="mt-5 grid list-inside list-decimal gap-6 md:grid-cols-2">
            <li className="text-sm font-semibold text-ink">
              Obtén tu referencia en la web de Hacienda
              <div className="mt-3">
                <a className={buttonClass("secondary", "md", "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent")} href="https://sede.agenciatributaria.gob.es/static_files/common/html/selector_acceso/SelectorAccesos.html?ref=%2Fwlpl%2FDABJ-REN0%2FObtenerReferenciaServlet&aut=CPD" target="_blank" rel="noopener noreferrer">Obtener referencia</a>
                <p className="mt-2 text-xs font-normal text-text-muted">Entras con tu Cl@ve en la web de la Agencia Tributaria. Nosotros nunca vemos tu Cl@ve.</p>
              </div>
            </li>
            <li className="text-sm font-semibold text-ink">
              Vuelve aquí e introduce tus datos
              <form className="mt-3 font-normal" onSubmit={(e) => { e.preventDefault(); saveReference(); }}>
                <fieldset disabled={busy} className="space-y-3" aria-live="polite">
                  <TextField label="NIF" placeholder="12345678Z" autoComplete="off" value={nif} onChange={(e) => setNif(e.target.value.toUpperCase())} error={validated && !isValidNif(nif) ? "Revisa el NIF" : undefined} className="focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent" />
                  <TextField label="Referencia" placeholder="QBW2X9" autoComplete="off" maxLength={10} value={referencia} onChange={(e) => setReferencia(e.target.value.toUpperCase())} error={validated && !isValidReferencia(referencia) ? "La referencia son 6 letras y números" : undefined} className="focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent" />
                  <Button type="submit" loading={saving} className="focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent">Guardar</Button>
                </fieldset>
              </form>
            </li>
          </ol>
          {source === "aeat" && <p role="status" className="mt-5 flex flex-wrap items-center gap-3 text-sm"><Tag tone="success">Guardada</Tag>Referencia guardada. Tu asesor la usará para traer tus datos.</p>}
        </section>
        <h2 className="text-sm font-semibold text-text-muted md:col-span-2">Otras formas de aportar tus datos</h2>
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
          <Button className="mt-auto self-start" variant={source === "manual" ? "primary" : "secondary"} disabled={busy} loading={busy && !saving && !file} onClick={() => choose("manual")}>
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
