import { createHash } from "node:crypto";

const entidades = {
  aacute: "á", eacute: "é", iacute: "í", oacute: "ó", uacute: "ú", ntilde: "ñ", uuml: "ü",
  Aacute: "Á", Eacute: "É", Iacute: "Í", Oacute: "Ó", Uacute: "Ú", Ntilde: "Ñ", Uuml: "Ü",
  nbsp: " ", amp: "&", lt: "<", gt: ">", quot: '"', apos: "'",
};
const bloques = new Set(["div", "p", "h1", "h2", "h3", "h4", "h5", "h6", "ol", "ul", "li", "section", "article", "table", "tr", "td", "th", "br", "hr", "dl", "dt", "dd"]);
const vacios = new Set(["area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "param", "source", "track", "wbr"]);

export function textoNormalizado(html) {
  const limpio = html.replace(/<!--[\s\S]*?-->/g, "").replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1\s*>/gi, "");
  // El main de acc-main contiene la deducción real; cabecera, migas y fecha del pie quedan fuera.
  const principal = limpio.match(/<main\b[^>]*>([\s\S]*?)<\/main\s*>/i);
  if (!principal) throw new Error("No se encuentra el contenido principal de la AEAT");

  const pila = [];
  let texto = "";
  for (const parte of principal[1].matchAll(/<\/?[a-z][^>]*>|[^<]+|</gi)) {
    const fragmento = parte[0];
    if (!fragmento.startsWith("<")) {
      if (!pila.some((elemento) => elemento.excluido)) texto += fragmento;
      continue;
    }
    const etiqueta = fragmento.match(/^<(\/?)\s*([a-z][\w:-]*)/i);
    if (!etiqueta) continue;
    const nombre = etiqueta[2].toLowerCase();
    if (etiqueta[1]) {
      const indice = pila.map((elemento) => elemento.nombre).lastIndexOf(nombre);
      if (indice !== -1) pila.length = indice;
    } else if (!vacios.has(nombre)) {
      pila.push({
        nombre,
        excluido: /^(header|footer|nav|noscript|dialog)$/.test(nombre)
          || /\brole\s*=\s*["']dialog["']/i.test(fragmento)
          || /\bid\s*=\s*["'](?:htmlToPdfModal|last-update)["']/i.test(fragmento),
      });
    }
    if (bloques.has(nombre) && !pila.some((elemento) => elemento.excluido)) texto += " ";
  }

  return texto.replace(/&(#x[\da-f]+|#\d+|[a-z]+);/gi, (entidad, clave) => {
    if (!clave.startsWith("#")) return entidades[clave] ?? entidad;
    const numero = clave[1].toLowerCase() === "x" ? parseInt(clave.slice(2), 16) : Number(clave.slice(1));
    return numero > 0 && numero <= 0x10ffff && !(numero >= 0xd800 && numero <= 0xdfff)
      ? String.fromCodePoint(numero) : "\uFFFD";
  }).replace(/\s+/g, " ").trim();
}

export function hashTexto(texto) {
  return createHash("sha256").update(texto, "utf8").digest("hex");
}
