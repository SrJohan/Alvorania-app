"use client";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, Notice, Tag } from "@/components/ui/display";
import { Checkbox } from "@/components/ui/form";
import { FileDrop } from "@/components/ui/display";
import { createCase, recordConsent, setDataSource } from "@/lib/data/api";
import { getState, useDemoState } from "@/lib/data/store";

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
    router.push("/app/cuestionario");
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-text-muted">Paso 1 de 4</p>
        <h1 className="text-xl font-bold">Tus datos fiscales</h1>
        <p className="mt-1 max-w-reading text-text-muted">Con tus datos fiscales del ejercicio 2025 calculamos tu resultado. Descárgalos de la sede de la Agencia Tributaria o introdúcelos tú.</p>
      </div>

      <Notice title="Tus datos están protegidos">
        Se guardan cifrados. Solo los ven tú y el asesor que lleve tu caso, y cada acceso queda registrado.
      </Notice>

      <div className="grid gap-4 md:grid-cols-2">
        <Card selected={source === "documento"}>
          <h2 className="text-lg font-semibold">Subir mi fichero de datos fiscales</h2>
          <p className="mb-4 mt-1 text-sm text-text-muted">Es el más rápido: extraemos los datos por ti.</p>
          {source === "documento" && file ? (
            <p role="status"><Tag tone="success">Recibido</Tag> <span className="text-sm">{file}</span></p>
          ) : (
            <FileDrop busy={busy} label="Sube tu fichero" onFile={(f) => choose("documento", f.name)} />
          )}
        </Card>
        <Card selected={source === "manual"}>
          <h2 className="text-lg font-semibold">Introducirlos a mano</h2>
          <p className="mb-4 mt-1 text-sm text-text-muted">Responde unas preguntas con las cifras de tu certificado de retenciones.</p>
          <Button variant={source === "manual" ? "primary" : "secondary"} loading={busy && !file} onClick={() => choose("manual")}>
            {source === "manual" ? "Elegido ✓" : "Prefiero introducirlos"}
          </Button>
        </Card>
      </div>

      <fieldset className="space-y-3">
        <legend className="mb-1 font-semibold">Antes de seguir</legend>
        <Checkbox checked={s.consents.terms} onChange={(e) => recordConsent("terms", e.target.checked)} label="Acepto las condiciones del servicio." />
        <Checkbox checked={s.consents.privacy} onChange={(e) => recordConsent("privacy", e.target.checked)} label="He leído la política de privacidad." />
        <Checkbox checked={s.consents.aeatDataAccess} onChange={(e) => recordConsent("aeatDataAccess", e.target.checked)} label="Autorizo el tratamiento de mis datos fiscales para preparar mi declaración." />
      </fieldset>

      {error && <p role="alert" className="text-sm text-danger">{error}</p>}
      <Button size="lg" onClick={next}>Continuar al cuestionario</Button>
    </div>
  );
}
