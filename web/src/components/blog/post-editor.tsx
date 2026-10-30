"use client";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, Eye, ImagePlus, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ErrorState, Notice, Skeleton, Tag } from "@/components/ui/display";
import { SelectField, TextField } from "@/components/ui/form";
import { PostArticle } from "@/components/blog/post-article";
import { IMAGE_TYPES, RichEditor, uploadBlogImage } from "@/components/blog/rich-editor";
import { CATEGORIES, STATUS_LABEL, STYLES, canEdit, effectiveStyle, slugify, type BlogPost, type BlogStyle, type Category, type PostAction, type Role } from "@/lib/blog";
import { blogDelete, blogPost, blogSave, blogTransition } from "@/server/blog-actions";

type Loaded = { post: BlogPost; role: Role; userId: string; globalStyle: BlogStyle };
type Draft = Pick<BlogPost, "title" | "excerpt" | "bodyHtml" | "category" | "slug" | "style" | "coverUrl"> & { coverPath: string | null };
type SaveState = "idle" | "saving" | "saved" | "error";

const categoryLabels = Object.values(CATEGORIES).map((c) => c.label);
const categoryByLabel = (label: string) => (Object.keys(CATEGORIES) as Category[]).find((k) => CATEGORIES[k].label === label) ?? "renta";
const statusTone = { borrador: "neutral", en_revision: "warning", publicado: "success" } as const;

/** La ruta en el bucket a partir de la URL pública (las imágenes del blog siempre viven en /public/blog/). */
const pathFromUrl = (url: string | null) => (url ? url.split("/storage/v1/object/public/blog/")[1] ?? null : null);

export function PostEditor() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [data, setData] = useState<Loaded | null>(null);
  const [loadError, setLoadError] = useState("");
  const [draft, setDraft] = useState<Draft | null>(null);
  const [save, setSave] = useState<SaveState>("idle");
  const [saveError, setSaveError] = useState("");
  const [preview, setPreview] = useState(false);
  const [busy, setBusy] = useState<PostAction | "delete" | "cover" | null>(null);
  const [actionError, setActionError] = useState("");
  const [returning, setReturning] = useState(false);
  const [note, setNote] = useState("");
  const slugTouched = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pending = useRef<Draft | null>(null);

  const load = useCallback(async () => {
    const r = await blogPost(id);
    if (!r.ok) return setLoadError(r.error);
    setData(r.data);
    const p = r.data.post;
    setDraft({ title: p.title, excerpt: p.excerpt, bodyHtml: p.bodyHtml, category: p.category, slug: p.slug, style: p.style, coverUrl: p.coverUrl, coverPath: pathFromUrl(p.coverUrl) });
    slugTouched.current = !p.slug.startsWith("borrador-");
    setLoadError("");
  }, [id]);
  useEffect(() => { void load(); }, [load]); // eslint-disable-line react-hooks/set-state-in-effect -- carga inicial desde el servidor

  // Durante publicar, enviar o devolver no se edita: lo escrito entonces se perdería al recargar.
  const canWrite = !!data && canEdit(data.role, data.post, data.userId);
  const editable = canWrite && (busy === null || busy === "cover");
  const isAdmin = data?.role === "admin";
  const queue = useRef<Promise<boolean>>(Promise.resolve(true));
  const saving = useRef(false);

  const saveNow = useCallback(async () => {
    const d = pending.current;
    if (!d || !data) return true;
    pending.current = null;
    saving.current = true;
    setSave("saving");
    const r = await blogSave(id, {
      title: d.title, excerpt: d.excerpt, bodyHtml: d.bodyHtml, category: d.category, coverPath: d.coverPath,
      // Mientras nadie toque la dirección, se rehace a partir del título.
      slug: slugTouched.current ? d.slug : "",
      ...(isAdmin ? { style: d.style } : {}),
    });
    saving.current = false;
    if (!r.ok) { pending.current = pending.current ?? d; setSave("error"); setSaveError(r.error); return false; }
    if (!slugTouched.current) setDraft((cur) => (cur ? { ...cur, slug: r.data.slug } : cur));
    setSave(pending.current ? "saving" : "saved");
    setSaveError("");
    return true;
  }, [data, id, isAdmin]);

  // Los guardados van en fila: flush() espera al que esté en curso y luego guarda lo pendiente.
  const flush = useCallback(() => {
    if (timer.current) { clearTimeout(timer.current); timer.current = null; }
    const next = queue.current.then(saveNow);
    queue.current = next.catch(() => false);
    return next;
  }, [saveNow]);

  // Autoguardado: un segundo y medio después del último cambio. Si falla, el texto sigue en pantalla y se reintenta al volver a escribir.
  function change(patch: Partial<Draft>) {
    setDraft((cur) => {
      if (!cur) return cur;
      const next = { ...cur, ...patch };
      if (patch.title !== undefined && !slugTouched.current) next.slug = slugify(patch.title);
      pending.current = next;
      return next;
    });
    setSave("saving");
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => { void flush(); }, 1500);
  }

  // Avisar antes de cerrar la pestaña con cambios sin guardar.
  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => { if (pending.current || saving.current) e.preventDefault(); };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, []);

  async function cover(file?: File) {
    if (!file) return;
    setBusy("cover"); setActionError("");
    try {
      const { path, url } = await uploadBlogImage(file);
      change({ coverPath: path, coverUrl: url });
    } catch (e) {
      setActionError((e as Error).message);
    } finally {
      setBusy(null);
    }
  }

  async function act(action: PostAction) {
    setBusy(action); setActionError("");
    if (!(await flush())) { setBusy(null); return; }
    const r = await blogTransition(id, action, action === "return" ? note : undefined);
    if (!r.ok) { setActionError(r.error); setBusy(null); return; }
    setReturning(false); setNote("");
    if (action === "submit" || action === "return") return router.push("/asesor/blog");
    await load();
    setBusy(null);
  }

  async function remove() {
    if (!window.confirm("¿Borrar este post para siempre? No se puede deshacer.")) return;
    setBusy("delete");
    const r = await blogDelete(id);
    if (r.ok) router.push("/asesor/blog");
    else { setActionError(r.error); setBusy(null); }
  }

  if (loadError) return <div className="mx-auto max-w-5xl p-4 md:p-8"><ErrorState text={loadError} onRetry={load} /></div>;
  if (!data || !draft) return <div className="mx-auto max-w-5xl space-y-4 p-4 md:p-8" aria-busy="true"><Skeleton className="h-10 w-64" /><Skeleton className="h-96 w-full" /></div>;

  const { post } = data;
  const shown: BlogPost = { ...post, ...draft };
  const style = effectiveStyle(draft.style, data.globalStyle);
  const saveLabel = { idle: "", saving: "Guardando…", saved: "Guardado", error: "No se ha guardado" }[save];

  return (
    <div className="mx-auto max-w-5xl p-4 md:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link href="/asesor/blog" onClick={() => void flush()} className="inline-flex items-center gap-1.5 text-sm text-text-muted underline-offset-4 hover:underline">
          <ArrowLeft aria-hidden className="size-4" />Todos los posts
        </Link>
        <div className="flex items-center gap-3">
          <p aria-live="polite" className={`text-sm ${save === "error" ? "text-danger" : "text-text-muted"}`}>{saveLabel}</p>
          <Tag tone={statusTone[post.status]}>{STATUS_LABEL[post.status]}</Tag>
          {post.status === "publicado" && <Link href={`/blog/${post.slug}`} target="_blank" className="text-sm underline">Ver en la web</Link>}
        </div>
      </div>

      {save === "error" && <p role="alert" className="mt-3 text-sm text-danger">{saveError} Tus cambios siguen aquí; se volverá a intentar al seguir escribiendo.</p>}
      {post.reviewNote && post.status === "borrador" && <div className="mt-4"><Notice tone="warning" title="Nota de revisión">{post.reviewNote}</Notice></div>}
      {!canWrite && (
        <div className="mt-4"><Notice title={post.status === "en_revision" ? "En revisión" : "Solo lectura"}>
          {post.status === "en_revision" ? "Andrés lo está revisando. Si te lo devuelve con cambios, podrás editarlo de nuevo." : "Este post no se puede editar desde tu cuenta."}
        </Notice></div>
      )}

      <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_280px]">
        <div className="min-w-0 space-y-5">
          <div className="flex gap-1 rounded-pill bg-surface p-1 text-sm font-semibold" role="tablist" aria-label="Modo">
            <button role="tab" aria-selected={!preview} onClick={() => setPreview(false)} className={`inline-flex h-9 flex-1 items-center justify-center gap-2 rounded-pill ${!preview ? "bg-bg text-ink shadow-card" : "text-text-muted"}`}><Pencil aria-hidden className="size-4" />Escribir</button>
            <button role="tab" aria-selected={preview} onClick={() => setPreview(true)} className={`inline-flex h-9 flex-1 items-center justify-center gap-2 rounded-pill ${preview ? "bg-bg text-ink shadow-card" : "text-text-muted"}`}><Eye aria-hidden className="size-4" />Vista previa</button>
          </div>

          {preview ? (
            <div className="overflow-hidden rounded-[20px] border border-border"><PostArticle post={shown} style={style} preview /></div>
          ) : (
            <>
              <TextField label="Título" value={draft.title} disabled={!editable} maxLength={160} onChange={(e) => change({ title: e.target.value })} placeholder="Por ejemplo: Qué gastos puede deducirse un autónomo en 2026" />
              <div>
                <label htmlFor="excerpt" className="mb-1 block text-sm font-medium">Resumen</label>
                <textarea id="excerpt" aria-describedby="excerpt-help" value={draft.excerpt} disabled={!editable} maxLength={300} rows={2} onChange={(e) => change({ excerpt: e.target.value })}
                  className="w-full rounded-md border border-border-input bg-bg px-3 py-2 text-base text-text disabled:opacity-60" />
                <p id="excerpt-help" className="mt-1 text-sm text-text-muted">Una o dos frases. Sale en el listado del blog y en Google.</p>
              </div>
              <RichEditor initialHtml={draft.bodyHtml} editable={editable} onChange={(html) => change({ bodyHtml: html })} onError={setActionError} />
            </>
          )}
        </div>

        <aside className="space-y-6" aria-label="Ajustes del post">
          <section className="space-y-3">
            {post.status === "borrador" && canWrite && (
              <Button className="w-full" loading={busy === "submit" || busy === "publish"} disabled={busy !== null} onClick={() => (isAdmin ? act("publish") : act("submit"))}>
                {isAdmin ? "Publicar" : "Enviar a revisión"}
              </Button>
            )}
            {isAdmin && post.status === "en_revision" && (
              <>
                <Button className="w-full" loading={busy === "publish"} disabled={busy !== null} onClick={() => act("publish")}>Publicar</Button>
                {returning ? (
                  <div className="space-y-2 rounded-[14px] bg-surface p-3">
                    <label htmlFor="note" className="block text-sm font-medium">Nota para {post.authorName}</label>
                    <textarea id="note" rows={3} value={note} onChange={(e) => setNote(e.target.value)} className="w-full rounded-md border border-border-input bg-bg px-3 py-2 text-sm" placeholder="Qué debe cambiar antes de publicarlo" />
                    <div className="flex gap-2">
                      <Button size="sm" loading={busy === "return"} disabled={!note.trim() || busy !== null} onClick={() => act("return")}>Devolver</Button>
                      <Button size="sm" variant="ghost" onClick={() => setReturning(false)}>Cancelar</Button>
                    </div>
                  </div>
                ) : (
                  <Button className="w-full" variant="secondary" disabled={busy !== null} onClick={() => setReturning(true)}>Devolver al autor con nota</Button>
                )}
              </>
            )}
            {isAdmin && post.status === "publicado" && (
              <Button className="w-full" variant="secondary" loading={busy === "unpublish"} disabled={busy !== null} onClick={() => act("unpublish")}>Despublicar</Button>
            )}
            {actionError && <p role="alert" className="text-sm text-danger">{actionError}</p>}
          </section>

          <section className="space-y-4 border-t border-border pt-5">
            <SelectField label="Categoría" options={categoryLabels} value={CATEGORIES[draft.category].label} disabled={!editable} onChange={(e) => change({ category: categoryByLabel(e.target.value) })} />
            <div>
              <p className="mb-1 text-sm font-medium">Portada</p>
              {draft.coverUrl ? (
                <div className="space-y-2">
                  {/* eslint-disable-next-line @next/next/no-img-element -- imagen del bucket público */}
                  <img src={draft.coverUrl} alt="" className="aspect-[16/9] w-full rounded-[14px] object-cover" />
                  {editable && <Button size="sm" variant="ghost" onClick={() => change({ coverPath: null, coverUrl: null })}>Quitar portada</Button>}
                </div>
              ) : (
                <label className={`flex cursor-pointer items-center justify-center gap-2 rounded-[14px] border-2 border-dashed border-border-input p-5 text-sm font-semibold text-accent hover:bg-accent-soft ${!editable || busy === "cover" ? "pointer-events-none opacity-60" : ""}`}>
                  <ImagePlus aria-hidden className="size-4" />{busy === "cover" ? "Subiendo…" : "Elegir imagen"}
                  <input type="file" accept={IMAGE_TYPES.join(",")} className="sr-only" disabled={!editable} onChange={(e) => cover(e.target.files?.[0])} />
                </label>
              )}
              <p className="mt-1 text-sm text-text-muted">JPG, PNG o WebP, hasta 5 MB. Mejor apaisada.</p>
            </div>
            <TextField label="Dirección" help={`alvorania.com/blog/${draft.slug}`} value={draft.slug} disabled={!editable} maxLength={80}
              onChange={(e) => { slugTouched.current = true; change({ slug: e.target.value.toLowerCase() }); }} />
          </section>

          {isAdmin && (
            <section className="space-y-2 border-t border-border pt-5">
              <fieldset>
                <legend className="mb-2 text-sm font-medium">Estilo de este post</legend>
                <div className="space-y-1.5">
                  {([null, ...Object.keys(STYLES)] as (BlogStyle | null)[]).map((s) => (
                    <label key={s ?? "global"} className="flex cursor-pointer items-start gap-2 rounded-md p-1.5 text-sm hover:bg-surface">
                      <input type="radio" name="estilo" className="mt-1 accent-[var(--color-accent)]" checked={draft.style === s} disabled={!editable} onChange={() => change({ style: s })} />
                      <span><span className="font-semibold text-ink">{s ? STYLES[s].label : `El del blog (${STYLES[data.globalStyle].label})`}</span>
                        <span className="block text-text-muted">{s ? STYLES[s].hint : "Cambia si cambias el estilo del blog."}</span></span>
                    </label>
                  ))}
                </div>
              </fieldset>
            </section>
          )}

          {isAdmin && (
            <section className="border-t border-border pt-5">
              <Button variant="ghost" size="sm" className="text-danger hover:bg-danger-soft" loading={busy === "delete"} disabled={busy !== null} onClick={remove}><Trash2 aria-hidden className="size-4" />Borrar post</Button>
            </section>
          )}
        </aside>
      </div>
    </div>
  );
}
