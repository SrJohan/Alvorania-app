"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState, ErrorState, Skeleton, Tag } from "@/components/ui/display";
import { CATEGORIES, STATUS_LABEL, STYLES, type BlogStyle, type PostStatus } from "@/lib/blog";
import "@/components/blog/blog.css";
import { blogCreate, blogPanel, blogSetGlobalStyle, type BlogPanel } from "@/server/blog-actions";

type TabKey = PostStatus | "all";
const fmt = new Intl.DateTimeFormat("es-ES", { day: "numeric", month: "short", timeZone: "Europe/Madrid" });
const statusTone = { borrador: "neutral", en_revision: "warning", publicado: "success" } as const;

/** Miniatura del estilo: la cabecera del post en pequeño, con los colores reales del preset. */
function StyleSwatch({ style }: { style: BlogStyle }) {
  return (
    <span className="post block overflow-hidden rounded-md border border-border" data-estilo={style}>
      <span className="post-hero block px-3 pb-3 pt-4"><span className="block h-2 w-3/4 rounded-sm bg-current" /><span className="mt-1.5 block h-1.5 w-1/2 rounded-sm bg-current opacity-50" /></span>
      <span className="block bg-bg px-3 py-2"><span className="block h-1 w-full rounded-sm bg-border" /><span className="mt-1 block h-1 w-2/3 rounded-sm bg-border" /></span>
    </span>
  );
}

function GlobalStyle({ value, onSaved }: { value: BlogStyle; onSaved: () => void }) {
  const [busy, setBusy] = useState<BlogStyle | null>(null);
  const [error, setError] = useState("");
  async function pick(s: BlogStyle) {
    setBusy(s); setError("");
    const r = await blogSetGlobalStyle(s);
    if (!r.ok) setError(r.error); else onSaved();
    setBusy(null);
  }
  return (
    <section aria-labelledby="estilo-blog" className="rounded-[20px] bg-surface p-5 sm:p-6">
      <h2 id="estilo-blog" className="font-semibold text-ink">Estilo del blog</h2>
      <p className="mt-1 text-sm text-text-muted">Se aplica a todos los posts que no tienen un estilo propio. El cambio se ve en la web al momento.</p>
      <div role="radiogroup" aria-label="Estilo del blog" className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {(Object.keys(STYLES) as BlogStyle[]).map((s) => (
          <button
            key={s}
            type="button"
            role="radio"
            aria-checked={value === s}
            disabled={busy !== null}
            onClick={() => pick(s)}
            className={`rounded-[14px] bg-bg p-2 text-left transition-shadow ${value === s ? "ring-2 ring-accent" : "ring-1 ring-border hover:ring-lilac"}`}
          >
            <StyleSwatch style={s} />
            <span className="mt-2 block px-1 text-sm font-semibold text-ink">{STYLES[s].label}{busy === s ? "…" : ""}</span>
          </button>
        ))}
      </div>
      {error && <p role="alert" className="mt-3 text-sm text-danger">{error}</p>}
    </section>
  );
}

export default function BlogPanelPage() {
  const router = useRouter();
  const [data, setData] = useState<BlogPanel | null>(null);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<TabKey | null>(null);
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    const r = await blogPanel();
    if (r.ok) { setData(r.data); setError(""); } else setError(r.error);
  }, []);
  useEffect(() => {
    let alive = true;
    blogPanel().then((r) => { if (alive) { if (r.ok) setData(r.data); else setError(r.error); } });
    return () => { alive = false; };
  }, []);

  async function create() {
    setCreating(true);
    const r = await blogCreate();
    if (r.ok) router.push(`/asesor/blog/${r.data.id}`);
    else { setError(r.error); setCreating(false); }
  }

  const isAdmin = data?.role === "admin";
  const reviewCount = data?.posts.filter((p) => p.status === "en_revision").length ?? 0;
  const tabs: { key: TabKey; label: string }[] = isAdmin
    ? [{ key: "en_revision", label: `En revisión${reviewCount ? ` (${reviewCount})` : ""}` }, { key: "borrador", label: "Borradores" }, { key: "publicado", label: "Publicados" }, { key: "all", label: "Todos" }]
    : [{ key: "borrador", label: "Mis borradores" }, { key: "en_revision", label: "En revisión" }, { key: "publicado", label: "Publicados" }];
  // Andrés entra viendo lo que espera su revisión; si no hay nada, todo.
  const current: TabKey = tab ?? (isAdmin ? (reviewCount ? "en_revision" : "all") : "borrador");
  const rows = data?.posts.filter((p) => current === "all" || p.status === current) ?? [];

  return (
    <div className="mx-auto max-w-4xl p-4 md:p-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <Link href="/asesor" className="text-sm text-text-muted underline-offset-4 hover:underline">Casos</Link>
          <h1 className="mt-1 text-xl font-bold">Blog</h1>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/blog" target="_blank" className="text-sm underline">Ver el blog</Link>
          <Button loading={creating} onClick={create}><Plus aria-hidden className="size-4" />Nuevo post</Button>
        </div>
      </div>

      {error && <div className="mt-6"><ErrorState text={error} onRetry={load} /></div>}
      {!error && !data && <div className="mt-6 space-y-3"><Skeleton className="h-10 w-80" /><Skeleton className="h-20 w-full" /><Skeleton className="h-20 w-full" /></div>}

      {data && (
        <>
          <div role="tablist" aria-label="Estado" className="mt-6 flex flex-wrap gap-1 border-b border-border">
            {tabs.map((t) => (
              <button key={t.key} role="tab" aria-selected={current === t.key} onClick={() => setTab(t.key)}
                className={`-mb-px border-b-2 px-3 py-2 text-sm font-semibold ${current === t.key ? "border-accent text-ink" : "border-transparent text-text-muted hover:text-ink"}`}>
                {t.label}
              </button>
            ))}
          </div>

          <div role="tabpanel" className="mt-4">
            {rows.length === 0 ? (
              <EmptyState
                title={current === "en_revision" ? "Nada pendiente de revisar" : "Aún no hay posts aquí"}
                text={isAdmin ? "Cuando un asesor envíe un borrador a revisión, aparecerá en «En revisión»." : "Escribe un borrador y envíalo a revisión. Andrés lo revisa y lo publica."}
              />
            ) : (
              <ul className="divide-y divide-border rounded-[20px] border border-border bg-surface-raised">
                {rows.map((p) => (
                  <li key={p.id} className="relative flex flex-wrap items-center justify-between gap-3 p-4 hover:bg-surface">
                    <div className="min-w-0">
                      <Link href={`/asesor/blog/${p.id}`} className="font-semibold text-ink after:absolute after:inset-0">{p.title || "Sin título"}</Link>
                      <p className="mt-0.5 text-sm text-text-muted">
                        {CATEGORIES[p.category].label}{isAdmin ? `, de ${p.authorName}` : ""}. Editado el {fmt.format(new Date(p.updatedAt))}.
                        {p.reviewNote && p.status === "borrador" ? " Tiene una nota de revisión." : ""}
                      </p>
                    </div>
                    <Tag tone={statusTone[p.status]}>{STATUS_LABEL[p.status]}</Tag>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {isAdmin && <div className="mt-8"><GlobalStyle value={data.globalStyle} onSaved={load} /></div>}
        </>
      )}
    </div>
  );
}
