// Puerto a Node de replica-entrepreneur/reviews.py (misma lógica de pesos). Solo reorganiza lo que le das:
// no escribe ni parafrasea reseñas; cada cita impresa es un fragmento literal de una fila, con su enlace.
//   node replica/tools/reviews.mjs replica/reviews.csv --themes replica/tools/themes-es.json --out replica/feedback.md [--today 2026-10-26]
// Peso: 1★ = 1,0 … 5★ = 0,2, sin estrellas = 0,6; reseñas de más de 18 meses cuentan la mitad.
// Un tema con menos de 3 reseñas o de una sola fuente se marca «débil».
import fs from "node:fs";

const args = process.argv.slice(2);
const opt = (name, def) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : def; };
const csvPath = args[0];
const themesPath = opt("--themes");
const outPath = opt("--out");
const today = new Date(opt("--today", new Date().toISOString().slice(0, 10)));
const MONTHS = Number(opt("--months", 18));

function parseCsv(text) {
  const rows = []; let row = [], f = "", q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) { if (c === '"' && text[i + 1] === '"') { f += '"'; i++; } else if (c === '"') q = false; else f += c; }
    else if (c === '"') q = true;
    else if (c === ",") { row.push(f); f = ""; }
    else if (c === "\n" || c === "\r") { if (c === "\r" && text[i + 1] === "\n") i++; row.push(f); rows.push(row); row = []; f = ""; }
    else f += c;
  }
  if (f || row.length) { row.push(f); rows.push(row); }
  return rows.filter((r) => r.some((x) => x.trim()));
}

const [head, ...body] = parseCsv(fs.readFileSync(csvPath, "utf8").replace(/^﻿/, ""));
const cols = head.map((h) => h.trim().toLowerCase());
const seen = new Set();
let dropped = 0, dupes = 0;
const reviews = [];
for (const cells of body) {
  const r = Object.fromEntries(cols.map((c, i) => [c, (cells[i] ?? "").trim()]));
  if (!r.url || !r.text || !/^https?:\/\//.test(r.url)) { dropped++; continue; }
  const key = r.text.toLowerCase().replace(/\W+/gu, " ").trim();
  if (seen.has(key)) { dupes++; continue; }
  seen.add(key);
  const rating = r.rating && Number(r.rating) >= 1 && Number(r.rating) <= 5 ? Number(r.rating) : null;
  reviews.push({ source: r.source || new URL(r.url).host, url: r.url, date: r.date ? new Date(r.date) : null, rating, text: r.text });
}

const T = JSON.parse(fs.readFileSync(themesPath, "utf8"));
const themes = T.themes.map((t) => ({ ...t, re: t.patterns.map((p) => new RegExp(p, "iu")) }));
const requestRe = T.request_patterns.map((p) => new RegExp(p, "iu"));

const weight = (rv) => {
  let w = rv.rating == null ? 0.6 : (6 - rv.rating) / 5;
  if (rv.date && (today - rv.date) / 864e5 > MONTHS * 30.4) w *= 0.5;
  return w;
};
const SENT = /(?<=[.!?])\s+|\n+/u;
function snippet(text, re, limit = 220) {
  for (const s0 of text.split(SENT)) {
    if (re.test(s0)) {
      let s = s0.trim();
      if (s.length > limit) { const m = s.search(re); const start = Math.max(0, m - limit / 2); s = (start > 0 ? "…" : "") + s.slice(start, start + limit).trim() + "…"; }
      return s;
    }
  }
  return text.length <= limit ? text : text.slice(0, limit).trim() + "…";
}

const results = Object.fromEntries(themes.map((t) => [t.id, { ...t, items: [], score: 0 }]));
const requests = [], unthemed = [];
for (const rv of reviews) {
  const w = weight(rv);
  let matched = false;
  for (const t of themes) {
    const hit = t.re.find((re) => re.test(rv.text));
    if (!hit) continue;
    matched = true;
    results[t.id].score += w;
    results[t.id].items.push({ rv, quote: snippet(rv.text, hit) });
  }
  const req = requestRe.find((re) => re.test(rv.text));
  if (req && (rv.rating == null || rv.rating <= 4)) requests.push({ quote: snippet(rv.text, req), url: rv.url, source: rv.source, rating: rv.rating });
  if (!matched && rv.rating != null && rv.rating <= 2) unthemed.push(rv);
}

const total = reviews.length || 1;
const ranked = Object.values(results).filter((r) => r.items.length).map((r) => {
  const rated = r.items.map((x) => x.rv.rating).filter((x) => x != null);
  const sources = [...new Set(r.items.map((x) => x.rv.source))].sort();
  r.items.sort((a, b) => (a.rv.rating ?? 3) - (b.rv.rating ?? 3) || a.quote.length - b.quote.length);
  return {
    id: r.id, label: r.label, kind: r.kind, score: Math.round(r.score * 100) / 100, count: r.items.length,
    share: Math.round((1000 * r.items.length) / total) / 10, avg: rated.length ? Math.round((100 * rated.reduce((s, x) => s + x, 0)) / rated.length) / 100 : null,
    sources, thin: r.items.length < 3 || sources.length < 2,
    bySource: Object.fromEntries(sources.map((s) => [s, r.items.filter((x) => x.rv.source === s).length])),
    quotes: r.items.slice(0, 4).map((x) => ({ quote: x.quote, url: x.rv.url, source: x.rv.source, rating: x.rv.rating })),
  };
}).sort((a, b) => b.score - a.score || b.count - a.count);

const negatives = reviews.filter((r) => r.rating != null && r.rating <= 2).length;
const stars = (r) => (r == null ? "-" : `${r}★`);
const out = ["# Qué critican y qué piden los usuarios de TaxDown", ""];
const srcCount = Object.entries(reviews.reduce((m, r) => ((m[r.source] = (m[r.source] || 0) + 1), m), {})).map(([s, n]) => `${s} ${n}`).join(", ");
out.push(`${reviews.length} reseñas de ${new Set(reviews.map((r) => r.source)).size} fuentes (${srcCount}). ${reviews.filter((r) => r.rating != null).length} con estrellas; ${negatives} de 1 o 2 estrellas.`);
if (dropped) out.push(`${dropped} filas descartadas por no tener enlace o texto.`);
if (dupes) out.push(`${dupes} reseñas duplicadas eliminadas.`);
out.push("", "Sesgo de la muestra: las de Trustpilot y Google Play se leyeron filtradas o por relevancia (más negativas que la media); las del App Store son las 500 más recientes sin filtrar.", "");
for (const kind of ["complaint", "request"]) {
  out.push(kind === "complaint" ? "## Quejas, por peso" : "## Peticiones y casos que fallan, por peso", "");
  for (const t of ranked.filter((x) => x.kind === kind)) {
    out.push(`### ${t.label}${t.thin ? " · DÉBIL" : ""}`, "");
    out.push(`${t.count} reseñas (${t.share} %), peso ${t.score}, media ${t.avg ?? "-"}★ · fuentes: ${Object.entries(t.bySource).map(([s, n]) => `${s} ${n}`).join(", ")}`, "");
    for (const q of t.quotes) out.push(`- «${q.quote}» — ${q.source}, ${stars(q.rating)}, [enlace](${q.url})`);
    out.push("");
  }
}
out.push("## Peticiones literales (reseñas de 4★ o menos)", "");
for (const r of requests.slice(0, 40)) out.push(`- «${r.quote}» — ${r.source}, ${stars(r.rating)}, [enlace](${r.url})`);
out.push("", `## Reseñas de 1–2★ que no encajan en ningún tema (${unthemed.length}) — léelas a mano`, "");
for (const r of unthemed.slice(0, 40)) out.push(`- ${stars(r.rating)} ${r.source}: «${r.text.length > 220 ? r.text.slice(0, 220) + "…" : r.text}» [enlace](${r.url})`);
const md = out.join("\n") + "\n";
if (outPath) fs.writeFileSync(outPath, md);
console.log(ranked.map((t) => `${t.kind === "complaint" ? "queja " : "pide  "} ${String(t.score).padStart(6)}  ${String(t.count).padStart(3)}  ${t.thin ? "débil" : "     "}  ${t.label}  [${Object.entries(t.bySource).map(([s, n]) => `${s}:${n}`).join(" ")}]`).join("\n"));
console.log(`\n${reviews.length} reseñas · ${negatives} de 1–2★ · ${unthemed.length} negativas sin tema · ${requests.length} peticiones`);
