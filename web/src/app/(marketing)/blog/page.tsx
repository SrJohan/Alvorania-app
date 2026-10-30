import type { Metadata } from "next";
import Link from "next/link";
import { Suspense, ViewTransition } from "react";
import { PillCta } from "@/components/ui/pill-cta";
import { Skeleton } from "@/components/ui/display";
import { DirectionalTransition } from "@/components/site/directional-transition";
import { dateFmt } from "@/components/blog/post-article";
import { CATEGORIES, isCategory, type BlogPost, type Category } from "@/lib/blog";
import { publishedPosts } from "@/server/blog-read";

export const metadata: Metadata = {
  title: "Blog",
  description: "Guías claras sobre la renta, autónomos, empresas y trámites, escritas por el equipo de asesores de Alvorania.",
};

const headline = "font-display font-semibold tracking-[-0.06em] text-ink";

// Bloque morado con el mismo brillo que el cierre de la portada.
const inkGlow = {
  backgroundImage: "radial-gradient(at 100% 0%, var(--color-bright) 0, transparent 55%), radial-gradient(at 0% 100%, var(--color-ink-raised) 0, transparent 60%)",
};

/** Una tarjeta del mosaico. Toda la tarjeta es clicable gracias al enlace estirado del título. */
function PostCard({ p, featured = false }: { p: BlogPost; featured?: boolean }) {
  const date = p.publishedAt ?? p.updatedAt;
  return (
    // La sombra y el borde lila del hover viven en ::before y solo cambian de opacidad: animar box-shadow repinta la tarjeta en cada fotograma.
    // Sin overflow-hidden (recortaría la sombra del ::before): la portada redondea sus propias esquinas.
    <article
      className={`group relative flex flex-col rounded-[24px] transition-[translate] duration-200 ease-brand hover:-translate-y-0.5 motion-reduce:translate-none before:pointer-events-none before:absolute before:rounded-[24px] before:shadow-pop before:opacity-0 before:transition-opacity before:duration-200 before:ease-brand hover:before:opacity-100 ${
        featured ? "bg-surface before:inset-0 sm:col-span-2" : "border border-border bg-surface-raised before:-inset-px before:border before:border-lilac"
      }`}
    >
      {p.coverUrl && (
        // eslint-disable-next-line @next/next/no-img-element -- imagen del bucket público; no pasa por el optimizador
        <img src={p.coverUrl} alt="" className={`w-full object-cover ${featured ? "aspect-[16/7] rounded-t-[24px]" : "aspect-[16/9] rounded-t-[23px]"}`} />
      )}
      <div className="flex flex-1 flex-col p-6 sm:p-8">
        <div className="flex items-center justify-between gap-3 border-b border-border pb-4 text-sm">
          <span className="font-bold tracking-[-0.02em] text-ink">{CATEGORIES[p.category].label}</span>
          <time dateTime={date} className="text-text-muted">{dateFmt.format(new Date(date))}</time>
        </div>
        <h2 className={`mt-5 text-pretty text-ink ${featured ? "text-[26px] font-semibold leading-[1.2] tracking-[-0.035em] sm:text-[34px]" : "text-lg font-semibold leading-[1.35] tracking-[-0.02em]"}`}>
          <Link href={`/blog/${p.slug}`} transitionTypes={["nav-forward"]} className="after:absolute after:inset-0 after:rounded-[24px] focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:outline-focus-ring">
            {p.title}
          </Link>
        </h2>
        {p.excerpt && <p className={`mt-3 text-text-muted ${featured ? "max-w-xl text-base" : "line-clamp-3 text-sm"}`}>{p.excerpt}</p>}
        <p className="mt-auto pt-6 text-sm text-text-muted">Por {p.authorName}</p>
      </div>
    </article>
  );
}

function AdvisorCard() {
  return (
    <aside className="flex flex-col justify-between gap-8 rounded-[24px] bg-ink p-6 text-on-ink sm:col-span-2 sm:p-8" style={inkGlow} aria-label="Tu renta con Alvorania">
      <div className="border-b border-on-ink-muted/30 pb-4">
        <p className="text-[24px] font-semibold leading-[1.2] tracking-[-0.03em] sm:text-[28px]">¿Prefieres que lo haga un asesor?</p>
      </div>
      <p className="max-w-md text-on-ink-muted">Calcula tu renta gratis. Un asesor con nombre la revisa y nada se presenta sin tu visto bueno.</p>
      <PillCta href="/acceder?next=/app/conectar" tone="light" className="self-start">Calcular gratis</PillCta>
    </aside>
  );
}

function CategoryNav({ active }: { active: Category | null }) {
  const pill = (on: boolean) =>
    `inline-flex h-9 items-center rounded-pill px-4 text-sm font-semibold transition-colors ${on ? "bg-ink text-on-ink" : "bg-surface text-ink hover:bg-accent-soft"}`;
  return (
    <nav aria-label="Categorías" className="flex flex-wrap gap-2 pb-2">
      <Link href="/blog" className={pill(!active)} aria-current={!active ? "page" : undefined}>Todo</Link>
      {(Object.keys(CATEGORIES) as Category[]).map((c) => (
        <Link key={c} href={`/blog?categoria=${c}`} className={pill(active === c)} aria-current={active === c ? "page" : undefined}>{CATEGORIES[c].label}</Link>
      ))}
    </nav>
  );
}

async function BlogGrid({ searchParams }: { searchParams: PageProps<"/blog">["searchParams"] }) {
  const raw = (await searchParams).categoria;
  const active = isCategory(raw) ? raw : null;
  const all = await publishedPosts();
  const posts = active ? all.filter((p) => p.category === active) : all;
  // Arriba va el último post marcado como «Destacado»; si no hay, el más reciente.
  const first = posts.find((p) => p.style === "destacado") ?? posts[0];
  const rest = posts.filter((p) => p !== first);

  return (
    <>
      <div className="mt-6"><CategoryNav active={active} /></div>
      {/* Al cambiar de categoría la página sigue montada: la cuadrícula hace su propio fundido corto. */}
      <ViewTransition key={active ?? "todo"} enter="grid-in" exit="grid-out" default="none">
      {first ? (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <PostCard p={first} featured />
          {rest.slice(0, 4).map((p) => <PostCard key={p.id} p={p} />)}
          <AdvisorCard />
          {rest.slice(4).map((p) => <PostCard key={p.id} p={p} />)}
        </div>
      ) : (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-[24px] bg-surface p-8 sm:col-span-2">
            <h2 className="text-[24px] font-semibold tracking-[-0.03em] text-ink">
              {active ? `Aún no hay guías de ${CATEGORIES[active].label.toLowerCase()}.` : "Pronto publicaremos las primeras guías."}
            </h2>
            <p className="mt-2 text-text-muted">Mientras tanto, nuestros asesores resuelven tus dudas en tu caso.</p>
            {active && <Link href="/blog" className="mt-6 inline-flex text-sm font-semibold text-accent underline-offset-4 hover:underline">Ver todas las guías</Link>}
          </div>
          <AdvisorCard />
        </div>
      )}
      </ViewTransition>
    </>
  );
}

export default function Blog({ searchParams }: PageProps<"/blog">) {
  return (
    <DirectionalTransition lateral><div className="mx-auto max-w-wide px-4 pt-8 md:pt-12">
      <header className="flex flex-col gap-4 border-b border-border pb-8 sm:flex-row sm:items-end sm:justify-between">
        <h1 className={`${headline} text-[40px] leading-[1.05] sm:text-[64px] lg:text-[80px]`}>Blog</h1>
        <p className="max-w-sm pb-2 text-text-muted">Guías claras sobre impuestos y trámites, escritas por nuestros asesores.</p>
      </header>
      <Suspense fallback={<div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4" aria-busy="true"><Skeleton className="h-72 sm:col-span-2" /><Skeleton className="h-72" /><Skeleton className="h-72" /></div>}>
        <BlogGrid searchParams={searchParams} />
      </Suspense>
    </div></DirectionalTransition>
  );
}
