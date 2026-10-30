import { SiteFooter, SiteHeader } from "@/components/site/header";
import { ClientNavigationProvider } from "@/components/site/client-navigation";

export default function MarketingLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <SiteHeader />
      <main id="contenido" className="flex-1"><ClientNavigationProvider>{children}</ClientNavigationProvider></main>
      <SiteFooter />
    </>
  );
}
