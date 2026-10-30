"use client";

import { createContext, useEffect, useRef, useSyncExternalStore, type ReactNode } from "react";

export const ClientNavigationContext = createContext(false);

// Memoria de la sesión cliente, conservada al salir del layout de marketing.
const sesionEntrada = { vista: false, modalidad: "teclado" as "teclado" | "puntero" };
export const LoginMotionContext = createContext({ current: sesionEntrada });

/** La entrada de marca solo se ve una vez por sesión cliente. */
export function marcarEntradaVista() { sesionEntrada.vista = true; }

const subscribe = () => () => {};
const clientSnapshot = () => true;
const serverSnapshot = () => false;

export function ClientNavigationProvider({ children }: { children: ReactNode }) {
  // False during SSR/hydration, true when a page mounts through client navigation.
  const clientNavigation = useSyncExternalStore(subscribe, clientSnapshot, serverSnapshot);

  const entrada = useRef(sesionEntrada);
  useEffect(() => {
    const teclado = () => { entrada.current.modalidad = "teclado"; };
    const puntero = () => { entrada.current.modalidad = "puntero"; };
    document.addEventListener("keydown", teclado, true);
    document.addEventListener("pointerdown", puntero, true);
    return () => {
      document.removeEventListener("keydown", teclado, true);
      document.removeEventListener("pointerdown", puntero, true);
    };
  }, []);

  return (
    <ClientNavigationContext value={clientNavigation}>
      <LoginMotionContext value={entrada}>{children}</LoginMotionContext>
    </ClientNavigationContext>
  );
}
