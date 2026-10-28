"use client";
import { useId, useRef, useState } from "react";
import { buttonClass } from "./button";

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
        className={`rounded-lg border-2 border-dashed p-8 text-center transition-colors duration-150 ${drag ? "border-accent bg-accent-soft" : "border-border-input bg-surface"}`}
      >
        <p className="font-semibold">{label}</p>
        <p className="text-sm text-text-muted">Arrastra el archivo aquí o elígelo. PDF, JPG o PNG, hasta {maxMb} MB.</p>
        <input ref={ref} type="file" accept={accept} className="sr-only" id={inputId} onChange={(e) => pick(e.target.files?.[0])} />
        <label htmlFor={inputId} className={`${buttonClass("secondary", "md", "mt-3 cursor-pointer")} ${busy ? "pointer-events-none opacity-50" : ""}`}>
          {busy ? "Subiendo…" : "Elegir archivo"}
        </label>
        {busy && <div role="progressbar" aria-label="Subiendo archivo" className="mx-auto mt-3 h-1.5 w-48 overflow-hidden rounded-pill bg-border"><div className="anim-indeterminate h-full w-2/5 rounded-pill bg-accent" /></div>}
      </div>
      {msg && <p role="alert" className="mt-2 text-sm text-danger">{msg}</p>}
    </div>
  );
}
