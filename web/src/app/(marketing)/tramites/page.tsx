import type { Metadata } from "next";
import Link from "next/link";
import { Briefcase, FileText, Globe, Mail, type LucideIcon } from "lucide-react";
import { ViewTransition } from "react";
import { DirectionalTransition } from "@/components/site/directional-transition";
import { Tag } from "@/components/ui/display";
import { Reveal } from "@/components/ui/reveal";
import { tramiteGroups } from "@/lib/tramites";

export const metadata: Metadata = { title: "Trámites" };

const groupIcons: Record<string, LucideIcon> = { Particulares: FileText, "Hacienda y requerimientos": Mail, "Autónomos": Briefcase, Internacional: Globe };
// El grupo de Hacienda se tiñe de lila: es la puerta gratuita (el análisis de la carta no cuesta nada).
const FREE_GROUP = "Hacienda y requerimientos";

export default function Tramites() {
  return (
    <DirectionalTransition lateral>
      <div className="mx-auto max-w-content px-4 py-12">
        <h1 className="font-display text-[34px] font-semibold leading-[1.08] tracking-[-0.05em] text-ink sm:text-[56px]">¿Qué quieres resolver?</h1>
        <p className="mt-3 max-w-reading text-text-muted">Si no lo ves aquí, escríbenos: probablemente también lo llevamos.</p>
        <div className="mt-10 grid gap-x-8 gap-y-10 md:grid-cols-2">
          {tramiteGroups.map((g, i) => {
            const Icon = groupIcons[g.title] ?? FileText;
            const free = g.title === FREE_GROUP;
            return (
            <Reveal key={g.title} delay={(i % 2) * 60}>
            <section aria-labelledby={`grupo-${i}`}>
              <h2 id={`grupo-${i}`} className="flex items-center gap-3 text-lg font-semibold text-ink">
                <span aria-hidden className="grid size-9 place-items-center rounded-[10px] bg-accent-soft text-accent"><Icon className="size-[18px]" /></span>
                {g.title}
              </h2>
              <ul className={`mt-4 divide-y overflow-hidden rounded-lg border ${free ? "divide-lilac/30 border-lilac/40 bg-accent-soft" : "divide-border border-border"}`}>
                {g.items.map((it) => (
                  <li key={it.slug} className="group relative flex flex-col items-start gap-2 p-4 lg:flex-row lg:items-center lg:justify-between lg:gap-3 transition-colors duration-150 hover:bg-surface has-[a:focus-visible]:bg-surface">
                    <div>
                      {/* El ::after estira el enlace a toda la fila; su nombre accesible sigue siendo solo el del trámite. */}
                      <Link href={`/tramites/${it.slug}`} transitionTypes={["nav-forward"]} className="font-medium after:absolute after:inset-0 group-hover:underline">
                        <ViewTransition name={`tramite-${it.slug}`} share="text-morph" default="none">
                          <span>{it.name}</span>
                        </ViewTransition>
                        {it.soon && <span className="sr-only"> (próximamente)</span>}
                      </Link>
                      <p className="mt-0.5 text-sm text-text-muted">{it.summary}</p>
                      <p className="mt-1 text-sm font-semibold text-ink">{it.price}</p>
                    </div>
                    {it.soon && <span aria-hidden><Tag>Próximamente</Tag></span>}
                  </li>
                ))}
              </ul>
            </section>
            </Reveal>
            );
          })}
        </div>
      </div>
    </DirectionalTransition>
  );
}
