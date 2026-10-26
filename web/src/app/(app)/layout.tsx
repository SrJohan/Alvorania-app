import { AppShell } from "@/components/site/app-shell";

// El área autenticada depende del estado del navegador (capa de datos de demostración), no es instantánea.
export const instant = false;

export default function AppLayout({ children }: LayoutProps<"/">) {
  return <AppShell>{children}</AppShell>;
}
