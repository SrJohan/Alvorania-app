"use server";
// Panel del blog. Los asesores escriben borradores y los envían a revisión; el admin (Andrés) publica,
// devuelve con nota, despublica, borra y elige los estilos. Por la API nadie escribe (ver 0010_blog.sql):
// todo pasa por aquí con service role, después de comprobar rol y estado.
import { randomUUID } from "node:crypto";
import { updateTag } from "next/cache";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase/server";
import { canEdit, nextStatus, slugify, CATEGORIES, STYLES, type BlogPost, type BlogStyle, type PostAction, type Role } from "@/lib/blog";
import { requireStaff } from "./authz";
import { sanitizePostHtml } from "./blog-html";
import { BLOG_TAG, POST_COLUMNS, globalStyle, imagePrefix, toPost } from "./blog-read";
import { AppError, run, type ActionResult } from "./errors";
import { safeFileName, uuidSchema } from "./validation";

const BUCKET = "blog";

/** Como schema.parse, pero el mensaje de la regla llega a la pantalla (run() oculta los errores que no son AppError). */
function parse<T>(schema: z.ZodType<T>, value: unknown): T {
  const r = schema.safeParse(value);
  if (!r.success) throw new AppError(r.error.issues[0]?.message ?? "Datos no válidos.", "invalid");
  return r.data;
}

async function staff() {
  const { user, role } = await requireStaff();
  return { userId: user.id, role: role as Role };
}

async function loadPost(id: string): Promise<BlogPost> {
  const { data } = await supabaseAdmin().from("blog_posts").select(POST_COLUMNS).eq("id", uuidSchema.parse(id)).maybeSingle();
  if (!data) throw new AppError("No encontramos ese post.", "not_found");
  return toPost(data as never);
}

async function audit(actorId: string, action: string, postId: string) {
  await supabaseAdmin().from("audit_log").insert({ actor_id: actorId, action, entity: "blog_post", entity_id: postId });
}

export type BlogPanel = { posts: BlogPost[]; role: Role; userId: string; globalStyle: BlogStyle };

/** El admin ve todos los posts; el asesor, solo los suyos. */
export async function blogPanel(): Promise<ActionResult<BlogPanel>> {
  return run(async () => {
    const { userId, role } = await staff();
    let q = supabaseAdmin().from("blog_posts").select(POST_COLUMNS).order("updated_at", { ascending: false });
    if (role !== "admin") q = q.eq("author_id", userId);
    const { data, error } = await q;
    if (error) throw error;
    return { posts: (data as never[]).map(toPost), role, userId, globalStyle: await globalStyle() };
  });
}

export async function blogPost(id: string): Promise<ActionResult<{ post: BlogPost; role: Role; userId: string; globalStyle: BlogStyle }>> {
  return run(async () => {
    const { userId, role } = await staff();
    const post = await loadPost(id);
    if (role !== "admin" && post.authorId !== userId) throw new AppError("No encontramos ese post.", "not_found");
    return { post, role, userId, globalStyle: await globalStyle() };
  });
}

export async function blogCreate(): Promise<ActionResult<{ id: string }>> {
  return run(async () => {
    const { userId } = await staff();
    const { data, error } = await supabaseAdmin().from("blog_posts")
      .insert({ slug: `borrador-${randomUUID().slice(0, 8)}`, author_id: userId }).select("id").single();
    if (error || !data) throw error ?? new Error("insert failed");
    await audit(userId, "blog_created", data.id);
    return { id: data.id as string };
  });
}

const saveSchema = z.object({
  title: z.string().trim().max(160),
  excerpt: z.string().trim().max(300),
  bodyHtml: z.string().max(200_000),
  category: z.enum(Object.keys(CATEGORIES) as [keyof typeof CATEGORIES]),
  slug: z.string().trim().max(80),
  coverPath: z.string().max(200).nullable(),
  style: z.enum(Object.keys(STYLES) as [BlogStyle]).nullable().optional(),
});

export async function blogSave(id: string, input: unknown): Promise<ActionResult<{ slug: string }>> {
  return run(async () => {
    const { userId, role } = await staff();
    const post = await loadPost(id);
    if (!canEdit(role, post, userId)) throw new AppError(post.status === "borrador" ? "Este post no es tuyo." : "Este post ya está en revisión: solo Andrés puede cambiarlo.", "forbidden");
    const f = parse(saveSchema, input);
    if (f.style !== undefined && role !== "admin") throw new AppError("Solo un administrador cambia el estilo.", "forbidden");
    if (f.coverPath && !/^[\w-]+\/[\w.-]+$/.test(f.coverPath)) throw new AppError("Imagen de portada no válida.", "invalid");
    const slug = slugify(f.slug || f.title);
    const row: Record<string, unknown> = {
      title: f.title, excerpt: f.excerpt, category: f.category, slug, cover_path: f.coverPath,
      body_html: sanitizePostHtml(f.bodyHtml, imagePrefix()),
    };
    if (f.style !== undefined) row.style = f.style;
    // El estado (y para el asesor, la autoría) se vuelve a exigir en el UPDATE: si entretanto se envió o publicó, no se pisa.
    let q = supabaseAdmin().from("blog_posts").update(row).eq("id", post.id).eq("status", post.status);
    if (role !== "admin") q = q.eq("author_id", userId);
    const { data: done, error } = await q.select("id");
    if (error?.code === "23505") throw new AppError("Ya hay otro post con esa dirección. Cambia el título o la dirección.", "conflict");
    if (error) throw error;
    if (!done?.length) throw new AppError("El post ha cambiado de estado mientras escribías. Recarga la página.", "conflict");
    if (post.status === "publicado") updateTag(BLOG_TAG);
    return { slug };
  });
}

const AUDIT: Record<PostAction, string> = { submit: "blog_submitted", publish: "blog_published", return: "blog_returned", unpublish: "blog_unpublished" };

export async function blogTransition(id: string, action: PostAction, note?: string): Promise<ActionResult> {
  return run(async () => {
    const { userId, role } = await staff();
    const post = await loadPost(id);
    if (role !== "admin" && post.authorId !== userId) throw new AppError("Este post no es tuyo.", "forbidden");
    const to = nextStatus(role, post.status, action);
    if (!to) throw new AppError("Esta acción no está disponible ahora.", "conflict");
    if (action === "submit" || action === "publish") {
      if (!post.title.trim()) throw new AppError("Ponle un título antes de seguir.", "invalid");
      if (!post.bodyHtml.trim()) throw new AppError("El post está vacío.", "invalid");
    }
    const row: Record<string, unknown> = { status: to };
    if (action === "publish") { row.review_note = null; if (!post.publishedAt) row.published_at = new Date().toISOString(); }
    if (action === "return") row.review_note = parse(z.string().trim().min(1, "Escribe una nota para el autor.").max(1000), note ?? "");
    const { data: done, error } = await supabaseAdmin().from("blog_posts").update(row).eq("id", post.id).eq("status", post.status).select("id");
    if (error) throw error;
    if (!done?.length) throw new AppError("Otra persona ha cambiado este post a la vez. Recarga la página.", "conflict");
    await audit(userId, AUDIT[action], post.id);
    if (action === "publish" || action === "unpublish") updateTag(BLOG_TAG);
  });
}

export async function blogDelete(id: string): Promise<ActionResult> {
  return run(async () => {
    const { userId, role } = await staff();
    if (role !== "admin") throw new AppError("Solo un administrador borra posts.", "forbidden");
    const post = await loadPost(id);
    const { error } = await supabaseAdmin().from("blog_posts").delete().eq("id", post.id);
    if (error) throw error;
    await audit(userId, "blog_deleted", post.id);
    if (post.status === "publicado") updateTag(BLOG_TAG);
  });
}

export async function blogSetGlobalStyle(style: unknown): Promise<ActionResult> {
  return run(async () => {
    const { role } = await staff();
    if (role !== "admin") throw new AppError("Solo un administrador cambia el estilo del blog.", "forbidden");
    const s = z.enum(Object.keys(STYLES) as [BlogStyle]).parse(style);
    const { error } = await supabaseAdmin().from("blog_settings").update({ style: s }).eq("id", true);
    if (error) throw error;
    updateTag(BLOG_TAG);
  });
}

const imageSchema = z.object({
  name: z.string().trim().min(1).max(200),
  mime: z.enum(["image/jpeg", "image/png", "image/webp"], { message: "La imagen debe ser JPG, PNG o WebP." }),
  sizeBytes: z.number().int().min(1).max(5 * 1024 * 1024, "La imagen pesa más de 5 MB."),
});

/** URL firmada para subir una imagen al bucket público del blog. Devuelve también la URL pública final. */
export async function blogImageUploadUrl(input: unknown): Promise<ActionResult<{ path: string; token: string; url: string }>> {
  return run(async () => {
    await staff();
    const f = parse(imageSchema, input);
    const path = `${new Date().getFullYear()}/${randomUUID().slice(0, 8)}-${safeFileName(f.name).toLowerCase()}`;
    const { data, error } = await supabaseAdmin().storage.from(BUCKET).createSignedUploadUrl(path);
    if (error || !data) throw new Error("signed upload failed");
    return { path, token: data.token, url: imagePrefix() + path };
  });
}
