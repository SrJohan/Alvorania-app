import { describe, expect, it } from "vitest";
import { sanitizePostHtml } from "@/server/blog-html";
import { canEdit, effectiveStyle, nextStatus, slugify } from "./blog";

const PREFIX = "https://x.supabase.co/storage/v1/object/public/blog/";

describe("limpieza del HTML de un post", () => {
  it("quita scripts, estilos, clases y atributos on*", () => {
    const out = sanitizePostHtml(
      `<p style="color:red" class="x" onclick="alert(1)">Hola<script>alert(1)</script></p><style>p{}</style><iframe src="https://evil"></iframe>`,
      PREFIX,
    );
    expect(out).toBe("<p>Hola</p>");
  });
  it("conserva el formato del editor y la caja destacada", () => {
    const html = `<h2>Plazos</h2><p><strong>Ojo</strong> <em>ya</em></p><ul><li>Uno</li></ul><blockquote><p>Cita</p></blockquote><aside data-callout="true"><p>Plazo: 30 de junio</p></aside>`;
    expect(sanitizePostHtml(html, PREFIX)).toBe(html);
  });
  it("descarta enlaces javascript: e imágenes de otros dominios", () => {
    const out = sanitizePostHtml(`<a href="javascript:alert(1)">x</a><img src="https://evil.com/a.png"><img src="${PREFIX}a.webp" alt="Foto">`, PREFIX);
    expect(out).toBe(`<a>x</a><img src="${PREFIX}a.webp" alt="Foto" />`);
  });
  it("los enlaces externos se abren aparte y sin acceso a la ventana", () => {
    expect(sanitizePostHtml(`<a href="https://aeat.es">AEAT</a>`, PREFIX)).toBe(`<a href="https://aeat.es" rel="noopener noreferrer" target="_blank">AEAT</a>`);
    expect(sanitizePostHtml(`<a href="/precios">Precios</a>`, PREFIX)).toBe(`<a href="/precios">Precios</a>`);
  });
  it("convierte h1 en h2", () => {
    expect(sanitizePostHtml("<h1>T</h1>", PREFIX)).toBe("<h2>T</h2>");
  });
});

describe("slug", () => {
  it("quita acentos, eñes y signos", () => {
    expect(slugify("Declaración de la Renta 2025: ¿qué cambia?")).toBe("declaracion-de-la-renta-2025-que-cambia");
    expect(slugify("Año nuevo, España")).toBe("ano-nuevo-espana");
  });
  it("nunca queda vacío", () => {
    expect(slugify("¿¡!?")).toBe("post");
  });
});

describe("estilo efectivo", () => {
  it("usa el del post o, si no hay, el global", () => {
    expect(effectiveStyle("tinta", "clasico")).toBe("tinta");
    expect(effectiveStyle(null, "calido")).toBe("calido");
    expect(effectiveStyle("neon", "clasico")).toBe("clasico");
  });
});

describe("flujo de revisión", () => {
  it("el asesor solo envía a revisión", () => {
    expect(nextStatus("advisor", "borrador", "submit")).toBe("en_revision");
    expect(nextStatus("advisor", "en_revision", "publish")).toBeNull();
    expect(nextStatus("advisor", "borrador", "publish")).toBeNull();
    expect(nextStatus("advisor", "publicado", "unpublish")).toBeNull();
  });
  it("el admin publica, devuelve y despublica", () => {
    expect(nextStatus("admin", "en_revision", "publish")).toBe("publicado");
    expect(nextStatus("admin", "borrador", "publish")).toBe("publicado");
    expect(nextStatus("admin", "en_revision", "return")).toBe("borrador");
    expect(nextStatus("admin", "publicado", "unpublish")).toBe("borrador");
    expect(nextStatus("admin", "publicado", "publish")).toBeNull();
  });
  it("el asesor solo edita sus borradores", () => {
    expect(canEdit("advisor", { status: "borrador", authorId: "a" }, "a")).toBe(true);
    expect(canEdit("advisor", { status: "en_revision", authorId: "a" }, "a")).toBe(false);
    expect(canEdit("advisor", { status: "borrador", authorId: "b" }, "a")).toBe(false);
    expect(canEdit("admin", { status: "publicado", authorId: "b" }, "a")).toBe(true);
  });
});
