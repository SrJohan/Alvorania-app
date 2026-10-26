import { cacheLife } from "next/cache";

// Artículos del blog de Gestoría eMadrid, leídos de su feed RSS público.
// Solo se muestran título, fecha y tema, con enlace al original: el texto de cada artículo no se copia.
export const ARTICLES_SOURCE = { name: "Gestoría eMadrid", url: "https://gestoriaemadrid.com/", feed: "https://gestoriaemadrid.com/?format=feed&type=rss" };

export type Article = { title: string; url: string; date: string | null; topic: string };

const ENTITIES: Record<string, string> = { "&amp;": "&", "&lt;": "<", "&gt;": ">", "&quot;": '"', "&#39;": "'", "&apos;": "'" };
const decode = (s: string) => s.replace(/&(amp|lt|gt|quot|apos|#39);/g, (m) => ENTITIES[m]);

function tag(item: string, name: string) {
  const a = item.indexOf(`<${name}>`);
  const b = item.indexOf(`</${name}>`);
  if (a < 0 || b < a) return "";
  return item.slice(a + name.length + 2, b).replace(/<!\[CDATA\[|\]\]>/g, "").trim();
}

// El feed trae también traducciones al inglés y al alemán: nos quedamos con los títulos en castellano.
const SPANISH = /\b(de|del|la|las|el|los|en|para|y|con|sin|cómo)\b/gi;
const isSpanish = (title: string) => (title.match(SPANISH)?.length ?? 0) >= 2;

const TOPICS: [RegExp, string][] = [
  [/renta|irpf/i, "Renta"],
  [/aut[oó]nom/i, "Autónomos"],
  [/720|extranjer|internacional|rep[uú]blica|residen/i, "Internacional"],
  [/empresa|sociedad|\bnif\b/i, "Empresas"],
];
export const topicOf = (title: string) => TOPICS.find(([rx]) => rx.test(title))?.[1] ?? "Fiscalidad";

/** Convierte el RSS en artículos: solo noticias en castellano, sin duplicados, de la más reciente a la más antigua. */
export function parseFeed(xml: string): Article[] {
  const seen = new Set<string>();
  const out: Article[] = [];
  for (const item of xml.split("<item>").slice(1)) {
    const title = decode(tag(item, "title")).replace(/\s*\|\s*Gestor[ií]a Madrid\s*$/i, "").trim();
    const url = decode(decodeURIComponent(tag(item, "link")));
    if (!title || !url.includes("/noticias/") || !isSpanish(title) || seen.has(url)) continue;
    seen.add(url);
    const time = Date.parse(tag(item, "pubDate"));
    out.push({ title, url, date: Number.isNaN(time) ? null : new Date(time).toISOString(), topic: topicOf(title) });
  }
  return out.sort((a, b) => (b.date ?? "").localeCompare(a.date ?? ""));
}

/** Lee el feed como mucho una vez cada pocas horas. Si la web no responde, devuelve una lista vacía y la página lo explica. */
export async function getArticles(): Promise<Article[]> {
  "use cache";
  cacheLife("hours");
  try {
    const res = await fetch(ARTICLES_SOURCE.feed, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return [];
    return parseFeed(await res.text());
  } catch {
    return [];
  }
}
