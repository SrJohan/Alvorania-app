"use client";
import { useState } from "react";
import { FileDrop } from "@/components/ui/file-drop";
import { Card, Notice, Tag } from "@/components/ui/display";
import { uploadLetter } from "@/lib/data/api";
import { useDemoState } from "@/lib/data/store";
import { formatDateTime } from "@/lib/format";

const prices = [
  ["Análisis de la carta", "Gratis"],
  ["Respuesta a un requerimiento básico", "50 €"],
  ["Respuesta a un requerimiento complejo", "Desde 239 €"],
];

export default function Requerimiento() {
  const s = useDemoState();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const letters = s.documents.filter((d) => d.kind === "carta_hacienda");

  async function onFile(f: File) {
    setBusy(true);
    setError("");
    try { await uploadLetter(f); } catch (e) { setError(e instanceof Error ? e.message : "No hemos podido subir el archivo. Inténtalo de nuevo."); }
    setBusy(false);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold">He recibido una carta de Hacienda</h1>
        <p className="mt-1 max-w-reading text-text-muted">Sube la carta. Un asesor la lee, te explica qué piden y cuánto cuesta responder. Analizarla es gratis.</p>
      </div>

      <FileDrop label="Sube tu carta" busy={busy} error={error} onFile={onFile} />

      {letters.length > 0 && (
        <Card>
          <h2 className="text-lg font-semibold">Cartas recibidas</h2>
          <ul className="mt-3 divide-y divide-border">
            {letters.map((d) => (
              <li key={d.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                <div><p className="font-medium">{d.name}</p><p className="text-sm text-text-muted">{formatDateTime(d.at)} · {(d.sizeBytes / 1024).toFixed(0)} KB</p></div>
                <Tag tone="accent">Pendiente de análisis del asesor</Tag>
              </li>
            ))}
          </ul>
          <div className="mt-4"><Notice>Te responderemos en un máximo de 24 horas laborables. Hasta entonces no tienes que hacer nada.</Notice></div>
        </Card>
      )}

      <Card>
        <h2 className="text-lg font-semibold">Precios</h2>
        <dl className="mt-3 divide-y divide-border">
          {prices.map(([k, v]) => <div key={k} className="flex justify-between gap-3 py-2"><dt>{k}</dt><dd className="font-semibold">{v}</dd></div>)}
        </dl>
      </Card>
    </div>
  );
}
