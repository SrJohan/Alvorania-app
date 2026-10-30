import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PillCta } from "@/components/ui/pill-cta";
import { CATEGORIES, type BlogPost, type BlogStyle } from "@/lib/blog";
import "./blog.css";

export const dateFmt = new Intl.DateTimeFormat("es-ES", { day: "numeric", month: "long", year: "numeric", timeZone: "Europe/Madrid" });

/**
 * Un post tal como se ve en la web. Lo usan la página pública y la vista previa del panel,
 * así que lo que Andrés ve antes de publicar es exactamente lo que se publica.
 * `bodyHtml` llega ya limpio (sanitizePostHtml en el servidor).
 */
export function PostArticle({ post, style, preview = false }: { post: BlogPost; style: BlogStyle; preview?: boolean }) {
  const cat = CATEGORIES[post.category];
  const date = post.publishedAt ?? post.updatedAt;
  return (
    <article className="post pb-20" data-estilo={style}>
      <header className={`post-hero ${post.coverUrl ? "pb-28 sm:pb-40" : "pb-14 sm:pb-20"}`}>
        <div className="mx-auto max-w-content px-4 pt-8 md:pt-12">
          {!preview && (
            <Link href="/blog" transitionTypes={["nav-back"]} className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--hero-muted)] underline-offset-4 hover:text-[var(--hero-fg)] hover:underline">
              <ArrowLeft aria-hidden className="size-4" />Blog
            </Link>
          )}
          <p className="mt-10 text-sm font-semibold text-[var(--hero-muted)]">
            <Link href={`/blog?categoria=${post.category}`} transitionTypes={["nav-back"]} className="text-[var(--hero-fg)] underline-offset-4 hover:underline">{cat.label}</Link>
            <span aria-hidden className="mx-2">/</span>
            <time dateTime={date}>{dateFmt.format(new Date(date))}</time>
          </p>
          <h1 className="post-title mt-4 max-w-[18ch] font-display font-semibold">{post.title || "Sin título"}</h1>
          {post.excerpt && <p className="mt-6 max-w-[56ch] text-lg font-normal leading-[1.55] text-[var(--hero-muted)]">{post.excerpt}</p>}
          <p className="mt-8 text-sm text-[var(--hero-muted)]">Por <span className="font-semibold text-[var(--hero-fg)]">{post.authorName}</span></p>
        </div>
      </header>

      {post.coverUrl && (
        <div className="mx-auto -mt-20 max-w-content px-4 sm:-mt-32">
          {/* eslint-disable-next-line @next/next/no-img-element -- imagen del bucket público; no pasa por el optimizador */}
          <img src={post.coverUrl} alt="" className="aspect-[16/8] w-full rounded-[24px] object-cover shadow-pop" />
        </div>
      )}

      <div className="post-body mx-auto mt-12 max-w-reading px-4" dangerouslySetInnerHTML={{ __html: post.bodyHtml }} />

      <aside className="mx-auto mt-16 max-w-reading px-4" aria-label="Siguiente paso">
        <div className="flex flex-col gap-5 rounded-[24px] bg-surface p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
          <p className="max-w-sm text-lg font-semibold leading-snug tracking-[-0.02em] text-ink">¿Quieres que un asesor se encargue de esto por ti?</p>
          <PillCta href={cat.service.href} className="self-start sm:self-auto">{cat.service.text}</PillCta>
        </div>
      </aside>
    </article>
  );
}
