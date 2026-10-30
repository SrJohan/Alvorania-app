import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { publicEnv } from "@/lib/env";
import { supabaseAdmin } from "@/lib/supabase/server";
import { isCategory, isStyle, type BlogPost, type BlogStyle, type PostStatus } from "@/lib/blog";
import { blogImagePrefix, sanitizePostHtml } from "./blog-html";

export const BLOG_TAG = "blog";
export const POST_COLUMNS = "id, slug, title, excerpt, body_html, cover_path, category, style, status, review_note, author_id, published_at, updated_at, author:profiles(full_name, email)";

type Row = {
  id: string; slug: string; title: string; excerpt: string; body_html: string; cover_path: string | null; category: string; style: string | null;
  status: PostStatus; review_note: string | null; author_id: string; published_at: string | null; updated_at: string;
  author: { full_name: string | null; email: string } | { full_name: string | null; email: string }[] | null;
};

export const imagePrefix = () => blogImagePrefix(publicEnv.supabaseUrl);

export function toPost(r: Row): BlogPost {
  const author = Array.isArray(r.author) ? r.author[0] : r.author;
  return {
    id: r.id, slug: r.slug, title: r.title, excerpt: r.excerpt,
    bodyHtml: sanitizePostHtml(r.body_html, imagePrefix()),
    coverUrl: r.cover_path ? imagePrefix() + r.cover_path : null,
    category: isCategory(r.category) ? r.category : "renta",
    style: isStyle(r.style) ? r.style : null,
    status: r.status, reviewNote: r.review_note, authorId: r.author_id,
    authorName: author?.full_name || "Equipo Alvorania",
    publishedAt: r.published_at, updatedAt: r.updated_at,
  };
}

// Lecturas públicas en caché: se invalidan con updateTag(BLOG_TAG) al publicar, editar lo publicado o cambiar el estilo.
// Sin Supabase configurado (modo demo) el blog sale vacío en vez de romper la página.

export async function publishedPosts(): Promise<BlogPost[]> {
  "use cache";
  cacheTag(BLOG_TAG);
  cacheLife("hours");
  try {
    const { data, error } = await supabaseAdmin().from("blog_posts").select(POST_COLUMNS).eq("status", "publicado").order("published_at", { ascending: false });
    if (error) throw error;
    return (data as unknown as Row[]).map(toPost);
  } catch {
    return [];
  }
}

// shortcut: busca en la lista entera en caché; con cientos de posts, pasar a una consulta por slug.
export async function publishedPost(slug: string): Promise<BlogPost | null> {
  return (await publishedPosts()).find((p) => p.slug === slug) ?? null;
}

export async function globalStyle(): Promise<BlogStyle> {
  "use cache";
  cacheTag(BLOG_TAG);
  cacheLife("hours");
  try {
    const { data } = await supabaseAdmin().from("blog_settings").select("style").single();
    return isStyle(data?.style) ? data.style : "clasico";
  } catch {
    return "clasico";
  }
}
