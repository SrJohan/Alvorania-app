"use client";
import { useLayoutEffect, useRef } from "react";
import { formatEuros } from "@/lib/format";

/**
 * Importe en euros que cuenta hasta su valor al aparecer y, si cambia, desde el valor anterior.
 * El texto animado va oculto a lectores de pantalla: solo se anuncia la cifra final, no cada fotograma.
 */
export function CountUp({ cents, duration = 700 }: { cents: number; duration?: number }) {
  const el = useRef<HTMLSpanElement>(null);
  const from = useRef(0);

  useLayoutEffect(() => {
    const node = el.current;
    if (!node) return;
    const start = from.current;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) { from.current = cents; return; }
    const t0 = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const p = Math.min((now - t0) / duration, 1);
      node.textContent = formatEuros(Math.round(start + (cents - start) * (1 - (1 - p) ** 4)));
      if (p < 1) raf = requestAnimationFrame(tick);
      else from.current = cents; // solo al terminar: el doble montaje de desarrollo vuelve a contar desde el inicio
    };
    node.textContent = formatEuros(start);
    raf = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(raf); node.textContent = formatEuros(cents); };
  }, [cents, duration]);

  return (
    <>
      <span ref={el} aria-hidden className="tabular-nums">{formatEuros(cents)}</span>
      <span className="sr-only">{formatEuros(cents)}</span>
    </>
  );
}
