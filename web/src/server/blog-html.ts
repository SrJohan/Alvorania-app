import sanitizeHtml from "sanitize-html";

/** Prefijo público de las imágenes del bucket `blog`. Solo se aceptan imágenes de ahí. */
export const blogImagePrefix = (supabaseUrl: string) => `${supabaseUrl.replace(/\/+$/, "")}/storage/v1/object/public/blog/`;

/**
 * Deja solo la estructura que produce el editor: sin estilos, clases, scripts ni atributos on*.
 * Se aplica al guardar y otra vez al mostrar.
 */
export function sanitizePostHtml(html: string, imagePrefix: string): string {
  return sanitizeHtml(html, {
    allowedTags: ["h2", "h3", "p", "br", "strong", "em", "ul", "ol", "li", "a", "blockquote", "img", "aside"],
    allowedAttributes: { a: ["href", "rel", "target"], img: ["src", "alt"], aside: ["data-callout"] },
    allowedSchemes: ["http", "https", "mailto"],
    allowedSchemesAppliedToAttributes: ["href", "src"],
    allowProtocolRelative: false,
    exclusiveFilter: (frame) => frame.tag === "img" && !String(frame.attribs.src ?? "").startsWith(imagePrefix),
    transformTags: {
      // Los enlaces externos se abren sin dar acceso a la ventana de origen.
      a: (tagName, attribs) => {
        const external = /^https?:\/\//i.test(attribs.href ?? "");
        return { tagName, attribs: external ? { ...attribs, rel: "noopener noreferrer", target: "_blank" } : attribs };
      },
      // Títulos de nivel 1 o 4+ pegados desde otro sitio se convierten en los niveles que admite el blog.
      h1: "h2", h4: "h3", h5: "h3", h6: "h3",
    },
    allowedClasses: {},
  }).trim();
}
