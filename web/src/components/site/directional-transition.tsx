import { ViewTransition, type ReactNode } from "react";

// `lateral`: al llegar sin tipo (desde otra pestaña) hace fundido en vez de no animar.
// Desliza la página al entrar/salir según el tipo (`nav-forward` / `nav-back`); sin tipo no anima.
export function DirectionalTransition({ children, lateral }: { children: ReactNode; lateral?: boolean }) {
  return (
    <ViewTransition
      enter={{ "nav-forward": "nav-forward", "nav-back": "nav-back", default: lateral ? "fade-in" : "none" }}
      exit={{ "nav-forward": "nav-forward", "nav-back": "nav-back", default: lateral ? "fade-out" : "none" }}
      default="none"
    >
      {children}
    </ViewTransition>
  );
}

// Navegación entre pestañas hermanas (inicio, precios...): fundido, sin profundidad espacial.
export function LateralTransition({ children }: { children: ReactNode }) {
  return <ViewTransition enter="fade-in" exit="fade-out" default="none">{children}</ViewTransition>;
}
