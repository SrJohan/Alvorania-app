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

export async function fetchTexto(url) {
  const respuesta = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
  if (respuesta.status !== 200) {
    throw new Error(`Error al descargar ${url}: estado HTTP ${respuesta.status}`);
  }
  const texto = await respuesta.text();
  if (!texto.trim()) throw new Error(`Respuesta vacia al descargar ${url}`);
  return texto;
}
