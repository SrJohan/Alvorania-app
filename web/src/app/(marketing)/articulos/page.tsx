import type { Metadata } from "next";
import { ArrowUpRight } from "lucide-react";
import { PillCta } from "@/components/ui/pill-cta";
import { ARTICLES_SOURCE, getArticles, type Article } from "@/lib/articles";

export const metadata: Metadata = {
  title: "Artículos",
  description: "Guías sobre la renta, autónomos y fiscalidad internacional, publicadas por Gestoría eMadrid.",
};

const headline = "font-display font-semibold tracking-[-0.06em] text-ink";
const fmt = new Intl.DateTimeFormat("es-ES", { day: "numeric", month: "long", year: "numeric", timeZone: "Europe/Madrid" });

// Bloque morado con el mismo brillo que el cierre de la portada.
const inkGlow = {
  backgroundImage: "radial-gradient(at 100% 0%, var(--color-bright) 0, transparent 55%), radial-gradient(at 0% 100%, var(--color-ink-raised) 0, transparent 60%)",
};

/** Una tarjeta del mosaico. Toda la tarjeta es clicable gracias al enlace estirado del pie. */
function ArticleCard({ a, featured = false }: { a: Article; featured?: boolean }) {
  return (
    <article
      className={`group relative flex flex-col rounded-[24px] p-6 transition-[transform,box-shadow,border-color] duration-200 ease-brand hover:-translate-y-0.5 hover:shadow-pop motion-reduce:transform-none sm:p-8 ${
        featured ? "bg-surface lg:col-span-2" : "border border-border bg-surface-raised hover:border-lilac"
      }`}
    >
      <div className="flex items-center justify-between gap-3 border-b border-border pb-4">
        <span className="text-sm font-bold tracking-[-0.02em] text-ink">{ARTICLES_SOURCE.name}</span>
        <span className="rounded-pill bg-accent-soft px-2.5 py-0.5 text-xs font-semibold text-on-accent-soft">{a.topic}</span>
      </div>
      <h2 className={`mt-5 text-pretty text-ink ${featured ? "text-[24px] font-semibold leading-[1.25] tracking-[-0.03em] sm:text-[30px]" : "text-lg font-medium leading-[1.4] text-text-muted group-hover:text-ink"}`}>
        {a.title}
      </h2>
      {a.date && <p className="mt-3 text-sm text-text-muted"><time dateTime={a.date}>{fmt.format(new Date(a.date))}</time></p>}
      <a
        href={a.url}
        target="_blank"
        rel="noopener"
        className="mt-auto inline-flex items-center gap-1 self-start pt-8 text-sm font-semibold text-accent underline-offset-4 after:absolute after:inset-0 after:rounded-[24px] hover:underline"
      >
        Leer en {ARTICLES_SOURCE.name}
        <ArrowUpRight aria-hidden className="size-4 transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 motion-reduce:transform-none" />
        <span className="sr-only"> (se abre en otra pestaña)</span>
      </a>
    </article>
  );
}

function AdvisorCard() {
  return (
    <aside className="flex flex-col justify-between gap-8 rounded-[24px] bg-ink p-6 text-on-ink sm:p-8 lg:col-span-2" style={inkGlow} aria-label="Tu renta con Alvorania">
      <div className="border-b border-on-ink-muted/30 pb-4">
        <p className="text-[24px] font-semibold leading-[1.2] tracking-[-0.03em] sm:text-[28px]">¿Prefieres que lo haga un asesor?</p>
      </div>
      <p className="max-w-md text-on-ink-muted">Calcula tu renta gratis. Un asesor con nombre la revisa y nada se presenta sin tu visto bueno.</p>
      <PillCta href="/acceder?next=/app/conectar" tone="light" className="self-start">Calcular gratis</PillCta>
    </aside>
  );
}

export default async function Articulos() {
  const articles = await getArticles();
  const [first, ...rest] = articles;
  // El bloque del asesor entra en la segunda fila, tras dos tarjetas pequeñas, como en un mosaico.
  const before = rest.slice(0, 4);
  const after = rest.slice(4);

  return (
    <div className="mx-auto max-w-wide px-4 pt-8 md:pt-12">
      <header className="flex flex-col gap-4 border-b border-border pb-8 sm:flex-row sm:items-end sm:justify-between">
        <h1 className={`${headline} text-[40px] leading-[1.05] sm:text-[64px] lg:text-[80px]`}>Guías y artículos</h1>
        <p className="flex items-center gap-2 pb-2 text-sm font-semibold uppercase tracking-[0.08em] text-ink">
          <span aria-hidden className="size-2.5 rounded-[2px] bg-accent" />
          Por {ARTICLES_SOURCE.name}
        </p>
      </header>

      {first ? (
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <ArticleCard a={first} featured />
          {before.slice(0, 2).map((a) => <ArticleCard key={a.url} a={a} />)}
          {before.slice(2).map((a) => <ArticleCard key={a.url} a={a} />)}
          <AdvisorCard />
          {after.map((a) => <ArticleCard key={a.url} a={a} />)}
        </div>
      ) : (
        <div className="mt-10 grid gap-4 lg:grid-cols-4">
          <div className="rounded-[24px] bg-surface p-8 lg:col-span-2">
            <h2 className="text-[24px] font-semibold tracking-[-0.03em] text-ink">Ahora mismo no podemos cargar los artículos.</h2>
            <p className="mt-2 text-text-muted">Puedes leerlos directamente en su web.</p>
            <a href={ARTICLES_SOURCE.url} target="_blank" rel="noopener" className="mt-6 inline-flex items-center gap-1 text-sm font-semibold text-accent underline-offset-4 hover:underline">
              Ir a {ARTICLES_SOURCE.name}<ArrowUpRight aria-hidden className="size-4" /><span className="sr-only"> (se abre en otra pestaña)</span>
            </a>
          </div>
          <AdvisorCard />
        </div>
      )}
    </div>
  );
}
