// Comprueba que cada cita «…» de un informe es literal y aparece en la reseña de SU enlace en reviews.csv.
//   node replica/tools/check-quotes.mjs replica/fixes.md replica/reviews.csv
// Las elipsis «…» separan trozos: cada trozo tiene que estar en la reseña, en ese orden.
import fs from "node:fs";

const [mdPath, csvPath] = process.argv.slice(2);
const csv = fs.readFileSync(csvPath, "utf8");
const rows = [];
let row = [], f = "", q = false;
for (let i = 0; i < csv.length; i++) {
  const c = csv[i];
  if (q) { if (c === '"' && csv[i + 1] === '"') { f += '"'; i++; } else if (c === '"') q = false; else f += c; }
  else if (c === '"') q = true;
  else if (c === ",") { row.push(f); f = ""; }
  else if (c === "\n") { row.push(f); rows.push(row); row = []; f = ""; }
  else f += c;
}
const byUrl = new Map(rows.slice(1).map((r) => [r[1], r[4]]));

const md = fs.readFileSync(mdPath, "utf8");
const re = /«([^»]+)»[^«\n]*?\]\((https?:\/\/[^)\s]+)\)/g;
let ok = 0, bad = 0;
for (const m of md.matchAll(re)) {
  const [quote, url] = [m[1], m[2]];
  const text = byUrl.get(url);
  if (!text) { bad++; console.log("ENLACE NO ENCONTRADO:", url, "\n   «" + quote.slice(0, 80) + "»"); continue; }
  let pos = 0, found = true;
  for (const part of quote.split("…").map((s) => s.trim()).filter(Boolean)) {
    const at = text.indexOf(part, pos);
    if (at < 0) { found = false; break; }
    pos = at + part.length;
  }
  if (found) ok++; else { bad++; console.log("NO LITERAL o enlace equivocado:", url, "\n   «" + quote.slice(0, 100) + "»"); }
}
console.log(`\n${ok} citas correctas, ${bad} con problemas`);
process.exit(bad ? 1 : 0);
