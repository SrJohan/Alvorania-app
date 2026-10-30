"use client";

import { createContext, useSyncExternalStore, type ReactNode } from "react";

export const ClientNavigationContext = createContext(false);

const subscribe = () => () => {};
const clientSnapshot = () => true;
const serverSnapshot = () => false;

export function ClientNavigationProvider({ children }: { children: ReactNode }) {
  // False during SSR/hydration, true when a page mounts through client navigation.
  const clientNavigation = useSyncExternalStore(subscribe, clientSnapshot, serverSnapshot);

  return (
    <ClientNavigationContext value={clientNavigation}>
      {children}
    </ClientNavigationContext>
  );
}
