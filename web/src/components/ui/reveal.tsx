"use client";
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";

/**
 * Hace aparecer su contenido (sube y se aclara) la primera vez que entra en pantalla.
 * El contenido es visible de entrada: solo se oculta, tras montar, lo que está por debajo de la pantalla,
 * así que sin JavaScript o con "reducir movimiento" no se esconde nada.
 */
export function Reveal({ children, delay = 0, className = "" }: { children: ReactNode; delay?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<"visible" | "hidden" | "in">("visible");

  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) return;
    if (el.getBoundingClientRect().top < window.innerHeight * 0.92) return;
    setState("hidden");
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setState("in");
        io.disconnect();
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.05 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={ref} data-reveal={state === "visible" ? undefined : state} style={{ "--d": `${delay}ms` } as CSSProperties} className={className}>
      {children}
    </div>
  );
}
