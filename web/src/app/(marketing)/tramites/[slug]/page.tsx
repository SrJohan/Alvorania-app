import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Check, FileText } from "lucide-react";
import { ViewTransition } from "react";
import { DirectionalTransition } from "@/components/site/directional-transition";
import { LinkButton } from "@/components/ui/button";
import { Tag } from "@/components/ui/display";
import { tramites } from "@/lib/tramites";

export const generateStaticParams = () => tramites.map(({ slug }) => ({ slug }));

export async function generateMetadata({ params }: PageProps<"/tramites/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  return { title: tramites.find((t) => t.slug === slug)?.name ?? "Trámite no encontrado" };
}

export default async function TramiteDetalle({ params }: PageProps<"/tramites/[slug]">) {
  const { slug } = await params;
  const t = tramites.find((x) => x.slug === slug);
  if (!t) notFound();

  return (
    <DirectionalTransition>
      <div className="mx-auto max-w-content px-4 py-12">
        <Link href="/tramites" transitionTypes={["nav-back"]} className="-my-3 inline-flex min-h-11 items-center gap-1 py-3 text-sm text-text-muted hover:underline"><span aria-hidden>←</span> Todos los trámites</Link>
        <ViewTransition name={`tramite-${t.slug}`} share="text-morph" default="none">
          <h1 className="mt-4 w-fit font-display text-[28px] font-semibold leading-[1.1] tracking-[-0.04em] text-ink sm:text-[40px]">{t.name}</h1>
        </ViewTransition>
        <p className="mt-3 max-w-reading text-lg text-text-muted">{t.summary}</p>

        <div className="mt-6 max-w-reading">
          <p className="text-lg font-bold text-ink sm:text-xl">{t.price}</p>
          <p className="mt-1 text-sm text-text-muted">{t.priceNote}</p>
        </div>

        <div className="mt-6">
          {t.href ? <LinkButton href={t.href} size="lg">{t.cta}</LinkButton> : <Tag>Próximamente</Tag>}
          {t.href?.startsWith("/acceder") && <p className="mt-2 text-sm text-text-muted">Antes de empezar te pedimos que entres o crees tu cuenta.</p>}
        </div>

        <div className="mt-10 grid gap-8 sm:grid-cols-2">
          <section aria-labelledby="incluye">
            <h2 id="incluye" className="text-lg font-semibold text-ink">Qué incluye</h2>
            <ul className="mt-3 space-y-2">
              {t.includes.map((x) => <li key={x} className="flex gap-2"><Check aria-hidden className="mt-0.5 size-5 shrink-0 text-accent" />{x}</li>)}
            </ul>
          </section>
          {t.need && (
            <section aria-labelledby="necesitas">
              <h2 id="necesitas" className="text-lg font-semibold text-ink">Qué necesitas</h2>
              <ul className="mt-3 space-y-2">
                {t.need.map((x) => <li key={x} className="flex gap-2"><FileText aria-hidden className="mt-0.5 size-5 shrink-0 text-accent" />{x}</li>)}
              </ul>
            </section>
          )}
        </div>
      </div>
    </DirectionalTransition>
  );
}
