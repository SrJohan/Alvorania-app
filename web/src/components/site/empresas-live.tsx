"use client";
import { useEffect, useLayoutEffect, useRef, useSyncExternalStore, type CSSProperties, type ReactNode, type Ref } from "react";
import { X } from "lucide-react";
import { DemoForm } from "@/components/site/demo-form";

const headline = "font-display font-semibold tracking-[-0.06em] text-ink";
const delay = (ms: number) => ({ "--d": `${ms}ms` }) as CSSProperties;
const reduceMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const brandEase = () => getComputedStyle(document.documentElement).getPropertyValue("--ease-brand").trim() || "ease-out";

/** Tarjeta de campaña de la portada: la cifra cuenta, la barra se llena hasta 38 de 52 y las filas suben en cascada. */
export function CampaignCard({ className = "", ref }: { className?: string; ref?: Ref<HTMLDivElement> }) {
  const figure = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = figure.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    // El HTML trae el valor final y oculto por .anim-late; aquí se reinicia a 0 mientras sigue oculto.
    const start = performance.now() + 300;
    el.textContent = "0";
    let raf = 0;
    const tick = (now: number) => {
      const p = Math.min(Math.max((now - start) / 600, 0), 1);
      el.textContent = String(Math.round(38 * (1 - (1 - p) ** 3)));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(raf); el.textContent = "38"; };
  }, []);

  return (
    <div ref={ref} className={`w-full max-w-[420px] justify-self-center lg:-rotate-1 ${className}`}>
      <div className="rounded-t-[12px] bg-ink px-4 py-1.5 text-xs font-medium text-on-ink-muted">Ejemplo ilustrativo</div>
      <div className="rounded-b-[16px] border border-t-0 border-border bg-surface-raised p-5 shadow-pop">
        <div className="flex items-start justify-between gap-3">
          <p className="font-semibold text-ink">Campaña de la renta</p>
          <span className="anim-pop shrink-0 rounded-pill bg-accent-soft px-2.5 py-0.5 text-xs font-semibold text-on-accent-soft" style={{ animationDelay: "300ms" }}>Tu equipo</span>
        </div>
        <p className={`${headline} anim-late mt-5 text-[44px] leading-none tabular-nums`}><span ref={figure}>38</span> de 52</p>
        <div className="mt-3 h-1.5 overflow-hidden rounded-pill bg-border">
          <div className="anim-fill h-full origin-left rounded-pill bg-accent" style={{ "--to": 38 / 52 } as CSSProperties} />
        </div>
        <p className="mt-2 text-sm text-text-muted">personas ya han presentado su renta</p>
        <dl className="mt-5 divide-y divide-border border-t border-border text-sm">
          <div className="anim-swap flex justify-between gap-4 py-2.5" style={delay(400)}><dt className="text-text-muted">Revisadas por un asesor</dt><dd className="font-semibold text-ink">38</dd></div>
          <div className="anim-swap flex justify-between gap-4 py-2.5" style={delay(460)}><dt className="text-text-muted">Cartas de Hacienda resueltas</dt><dd className="font-semibold text-ink">4</dd></div>
          <div className="anim-swap flex justify-between gap-4 py-2.5" style={delay(520)}><dt className="text-text-muted">Datos fiscales que ves</dt><dd className="font-semibold text-ink">Ninguno</dd></div>
        </dl>
        <p className="mt-1 text-sm text-text-muted">Cifras de ejemplo, no son datos reales.</p>
      </div>
    </div>
  );
}

// Estado del formulario de demo: lo comparten la portada y los botones de toda la página, que enlazan a #demo.
let isOpen = false;
let opened = 0;
const listeners = new Set<() => void>();
function setOpen(v: boolean) {
  if (v === isOpen) return;
  isOpen = v;
  if (v) opened++;
  listeners.forEach((l) => l());
}
const subscribe = (cb: () => void) => { listeners.add(cb); return () => { listeners.delete(cb); }; };

/**
 * Portada: el texto a la izquierda y la tarjeta de campaña a la derecha. Al pulsar cualquier enlace a #demo la tarjeta pasa
 * a la izquierda, ocupando el sitio del texto, y el formulario se abre a la derecha.
 */
export function HeroDemo({ children }: { children: ReactNode }) {
  const open = useSyncExternalStore(subscribe, () => isOpen, () => false);
  const fresh = useSyncExternalStore(subscribe, () => opened, () => 0);
  const panel = useRef<HTMLElement>(null);
  const grid = useRef<HTMLElement>(null);
  const card = useRef<HTMLDivElement>(null);
  const spot = useRef<{ x: number; y: number } | null>(null);
  const slide = useRef<Animation>(null);
  const text = useRef<HTMLDivElement>(null);
  const exit = useRef<Animation>(null);

  // FLIP de la tarjeta: al cambiar de columna desliza desde donde estaba. Se mide respecto a la rejilla para que el scroll no cuente.
  // Con una sola columna (móvil) no cambia de x y no se anima. Solo `translate`, que no pisa el `rotate` de la tarjeta.
  // El formulario y el texto de la portada entran con la misma receta (sube, se aclara y se enfoca); en la carga inicial no se anima nada.
  useLayoutEffect(() => {
    slide.current?.cancel();
    // La salida del formulario se queda en su último fotograma hasta aquí, antes de pintar, para que no parpadee.
    exit.current?.cancel();
    exit.current = null;
    if (!card.current || !grid.current) return;
    const c = card.current.getBoundingClientRect();
    const g = grid.current.getBoundingClientRect();
    const now = { x: c.left - g.left, y: c.top - g.top };
    const from = spot.current;
    spot.current = now;
    if (!from || reduceMotion()) return;
    const ease = brandEase();
    const enter = [{ opacity: 0, transform: "translateY(12px)", filter: "blur(4px)" }, { opacity: 1, transform: "none", filter: "blur(0)" }];
    if (open) panel.current?.animate(enter, { duration: 220, delay: 140, easing: ease, fill: "backwards" });
    else text.current?.animate(enter, { duration: 220, easing: ease });
    if (from.x === now.x) return;
    slide.current = card.current.animate(
      [{ translate: `${from.x - now.x}px ${from.y - now.y}px` }, { translate: "0 0" }],
      { duration: 380, easing: ease },
    );
  }, [open]);

  useEffect(() => {
    if (location.hash === "#demo") setOpen(true);
    const onHash = () => setOpen(location.hash === "#demo");
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      if (!(e.target instanceof Element) || !e.target.closest("a[href$='#demo']")) return;
      e.preventDefault();
      setOpen(true);
      history.replaceState(null, "", "#demo");
      // El formulario no existe en pantalla hasta que React pinta el cambio.
      setTimeout(() => {
        panel.current?.scrollIntoView({ block: "center", behavior: "smooth" });
        panel.current?.querySelector("input")?.focus({ preventScroll: true });
      }, 0);
    };
    window.addEventListener("hashchange", onHash);
    document.addEventListener("click", onClick, true);
    return () => {
      window.removeEventListener("hashchange", onHash);
      document.removeEventListener("click", onClick, true);
      setOpen(false);
    };
  }, []);

  // Al cerrar, el formulario sale más corto y discreto que su entrada; con Escape (teclado) se cierra sin animar.
  const close = (animated = true) => {
    const done = () => { setOpen(false); history.replaceState(null, "", location.pathname + location.search); };
    const el = panel.current;
    if (!animated || !el || reduceMotion()) return done();
    if (exit.current) return;
    exit.current = el.animate([{ opacity: 1 }, { opacity: 0, transform: "translateY(-4px)", filter: "blur(2px)" }], { duration: 160, easing: brandEase(), fill: "forwards" });
    // Un temporizador y no `onfinish`: si la pestaña no pinta fotogramas, el formulario se cierra igual.
    setTimeout(done, 160);
  };

  return (
    <section ref={grid} className={`grid gap-10 lg:items-center ${open ? "lg:grid-cols-2" : "lg:grid-cols-[1.1fr_0.9fr]"}`}>
      <div ref={text} className={open ? "hidden" : "lg:col-start-1 lg:row-start-1"}>{children}</div>
      <CampaignCard ref={card} className={open ? "order-2 lg:order-none lg:col-start-1 lg:row-start-1 lg:justify-self-start" : "lg:col-start-2 lg:row-start-1 lg:justify-self-end"} />
      <section
        id="demo"
        ref={panel}
        aria-labelledby="demo-titulo"
        onKeyDown={(e) => { if (e.key === "Escape") close(false); }}
        className={`relative w-full max-w-[560px] scroll-mt-28 justify-self-center rounded-[24px] border border-border bg-surface-raised p-6 shadow-pop sm:p-8 lg:col-start-2 lg:row-start-1 lg:justify-self-end ${open ? "order-1 lg:order-none" : "hidden"}`}
      >
        <button type="button" onClick={() => close()} aria-label="Cerrar el formulario" className="absolute right-4 top-4 grid size-9 place-items-center rounded-full text-text-muted transition-colors duration-150 hover:bg-accent-soft hover:text-ink">
          <X aria-hidden className="size-5" />
        </button>
        <h2 id="demo-titulo" className="pr-10 font-display text-[28px] font-semibold leading-[1.1] tracking-[-0.05em] text-ink sm:text-[34px]">Te lo enseñamos con tu caso.</h2>
        <p className="mb-6 mt-2 text-text-muted">Cuéntanos quién eres y a quién quieres ofrecérselo, y preparamos la demo a tu medida.</p>
        <DemoForm key={fresh} />
      </section>
    </section>
  );
}
