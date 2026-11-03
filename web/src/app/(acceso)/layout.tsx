import { ClientNavigationProvider } from "@/components/site/client-navigation";

export default function AccesoLayout({ children }: LayoutProps<"/">) {
  return <main id="contenido" className="flex-1"><ClientNavigationProvider>{children}</ClientNavigationProvider></main>;
}
