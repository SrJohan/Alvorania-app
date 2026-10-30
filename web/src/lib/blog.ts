// Reglas del blog compartidas por el panel, las acciones de servidor y las páginas públicas.

export const CATEGORIES = {
  renta: { label: "Renta", service: { href: "/precios", text: "Ver planes para tu renta" } },
  autonomos: { label: "Autónomos", service: { href: "/precios", text: "Ver planes para autónomos" } },
  empresas: { label: "Empresas", service: { href: "/empresas", text: "Ver servicios para empresas" } },
  tramites: { label: "Trámites", service: { href: "/tramites", text: "Ver trámites" } },
} as const;
export type Category = keyof typeof CATEGORIES;

export const STYLES = {
  clasico: { label: "Clásico", hint: "Fondo claro y títulos en morado." },
  tinta: { label: "Tinta", hint: "Cabecera morada oscura." },
  calido: { label: "Cálido", hint: "Cabecera en tono melocotón." },
  destacado: { label: "Destacado", hint: "Cabecera oscura y grande. Sale primero en el blog." },
} as const;
export type BlogStyle = keyof typeof STYLES;

export type PostStatus = "borrador" | "en_revision" | "publicado";
export const STATUS_LABEL: Record<PostStatus, string> = { borrador: "Borrador", en_revision: "En revisión", publicado: "Publicado" };

export type BlogPost = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  bodyHtml: string;
  coverUrl: string | null;
  category: Category;
  style: BlogStyle | null;
  status: PostStatus;
  reviewNote: string | null;
  authorId: string;
  authorName: string;
  publishedAt: string | null;
  updatedAt: string;
};

export const isCategory = (v: unknown): v is Category => typeof v === "string" && v in CATEGORIES;
export const isStyle = (v: unknown): v is BlogStyle => typeof v === "string" && v in STYLES;

/** El estilo con el que se pinta un post: el suyo, o el global si no tiene (o si el valor no es conocido). */
export const effectiveStyle = (post: BlogStyle | string | null, global: BlogStyle): BlogStyle => (isStyle(post) ? post : global);

/** «Declaración de la Renta 2025: ¿qué cambia?» → «declaracion-de-la-renta-2025-que-cambia». */
export function slugify(title: string): string {
  return title
    .normalize("NFKD").replace(/[̀-ͯ]/g, "")
    .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")
    .slice(0, 80).replace(/-+$/, "") || "post";
}

export type Role = "advisor" | "admin";
export type PostAction = "submit" | "publish" | "return" | "unpublish";

/**
 * Qué puede hacer cada rol según el estado. El asesor solo escribe borradores propios y los envía a revisión;
 * el admin (Andrés) lo edita todo, publica, devuelve con nota y despublica.
 */
export function canEdit(role: Role, post: { status: PostStatus; authorId: string }, userId: string): boolean {
  return role === "admin" || (post.authorId === userId && post.status === "borrador");
}

export function nextStatus(role: Role, from: PostStatus, action: PostAction): PostStatus | null {
  if (action === "submit") return from === "borrador" ? "en_revision" : null;
  if (role !== "admin") return null;
  if (action === "publish") return from === "publicado" ? null : "publicado";
  if (action === "return") return from === "en_revision" ? "borrador" : null;
  return from === "publicado" ? "borrador" : null; // unpublish
}
