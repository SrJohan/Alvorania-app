import { SiteFooter, SiteHeader } from "@/components/site/header";

export default function MarketingLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <SiteHeader />
      <main id="contenido" className="flex-1">{children}</main>
      <SiteFooter />
    </>
  );
}
