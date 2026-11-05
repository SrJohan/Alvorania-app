import { execFile } from "node:child_process";
import { promisify } from "node:util";

export const URL_MANUAL = "https://sede.agenciatributaria.gob.es/Sede/Ayuda/25Manual/100/deducciones-autonomicas.html";

export function parseCatalogo(html) {
  const comunidades = new Map();
  const enlaces = /\bhref\s*=\s*(["'])(\/[^"'\s]*\/irpf-2025-deducciones-autonomicas\/([^/"'\s]+)\/([^/"'\s]+)\.html)\1/gi;

  for (const [, , href, carpeta, slug] of html.matchAll(enlaces)) {
    if (carpeta === "guia-deducciones-autonomicas" || carpeta === "normativa-autonomica-irpf") continue;
    if (!comunidades.has(carpeta)) comunidades.set(carpeta, new Map());
    comunidades.get(carpeta).set(slug, { slug, url: `https://sede.agenciatributaria.gob.es${href}` });
  }

  if (comunidades.size === 0) {
    throw new Error("No se encontraron comunidades con deducciones en el catalogo de la AEAT");
  }
  return Object.fromEntries([...comunidades].map(([carpeta, entradas]) => [carpeta, [...entradas.values()]]));
}

// shortcut: la cadena TLS de la AEAT (Sectigo) no la valida el fetch de Node (UNABLE_TO_GET_ISSUER_CERT) pero si curl; se usa curl solo en ese caso, siempre verificando el certificado. Quitar cuando Node la valide.
async function descargarConCurl(url) {
  const { stdout } = await promisify(execFile)(
    "curl", ["-sS", "--fail", "-L", "-A", "Mozilla/5.0", url], { maxBuffer: 20 * 1024 * 1024 },
  ).catch((error) => { throw new Error(`Error al descargar ${url}: ${error.stderr?.trim() || error.message}`); });
  return stdout;
}

export async function fetchTexto(url) {
  let texto;
  try {
    const respuesta = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
    if (respuesta.status !== 200) {
      throw new Error(`Error al descargar ${url}: estado HTTP ${respuesta.status}`);
    }
    texto = await respuesta.text();
  } catch (error) {
    if (error.cause?.code !== "UNABLE_TO_GET_ISSUER_CERT") throw error;
    texto = await descargarConCurl(url);
  }
  if (!texto.trim()) throw new Error(`Respuesta vacia al descargar ${url}`);
  return texto;
}
