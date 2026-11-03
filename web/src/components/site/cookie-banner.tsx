"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

export function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let saved = false;
    try { saved = localStorage.getItem("alvorania-cookies") !== null; } catch {}
    const frame = requestAnimationFrame(() => setVisible(!saved));
    return () => cancelAnimationFrame(frame);
  }, []);

  function choose(choice: "all" | "necessary") {
    try { localStorage.setItem("alvorania-cookies", choice); } catch {}
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div role="dialog" aria-label="Preferencias de cookies" aria-describedby="cookie-description" className="fixed inset-x-4 bottom-4 z-50 mx-auto max-w-reading rounded-lg border border-border bg-surface-raised p-4 shadow-pop">
      <p id="cookie-description" className="text-sm text-text-muted">
        Usamos cookies necesarias para que la web funcione y, si nos dejas, otras para entender cómo se usa. Consulta nuestra{" "}
        <Link href="/cookies" className="font-semibold text-accent underline">política de cookies</Link>.
      </p>
      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <Button onClick={() => choose("all")}>Aceptar todas</Button>
        <Button variant="secondary" onClick={() => choose("necessary")}>Solo las necesarias</Button>
      </div>
    </div>
  );
}
