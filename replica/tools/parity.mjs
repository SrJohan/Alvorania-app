// Puerto a Node de replica-diff/parity.py (misma lógica y pesos). Uso:
//   node replica/tools/parity.mjs replica/features.csv [--visual a.json b.json] [--markdown] [--json]
// Pesos: must 3, should 2, could 1. yes 1, partial 0,5, no 0. skip y lo que el original no tiene no puntúan.
// Con --visual, total = 80 % funcionalidades + 20 % estructura.
import fs from "node:fs";

const WEIGHT = { must: 3, should: 2, could: 1, p0: 3, p1: 2, p2: 1 };
const CREDIT = { yes: 1, done: 1, partial: 0.5, no: 0, "": 0, todo: 0 };
const PRIORITY_NAME = { 3: "must", 2: "should", 1: "could" };

function parseCsv(text) {
  const rows = [];
  let row = [], field = "", q = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (q) {
      if (ch === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (ch === '"') q = false;
      else field += ch;
    } else if (ch === '"') q = true;
    else if (ch === ",") { row.push(field); field = ""; }
    else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      row.push(field); rows.push(row); row = []; field = "";
    } else field += ch;
  }
  if (field || row.length) { row.push(field); rows.push(row); }
  return rows.filter((r) => r.some((c) => c.trim()));
}

function load(path) {
  const [head, ...body] = parseCsv(fs.readFileSync(path, "utf8").replace(/^﻿/, ""));
  const fields = head.map((f) => f.trim().toLowerCase());
  for (const need of ["feature", "priority", "clone"]) {
    if (!fields.includes(need)) throw new Error(`${path} has no '${need}' column`);
  }
  return body.map((cells, i) => {
    const r = { line: i + 2 };
    fields.forEach((f, j) => { r[f] = (cells[j] ?? "").trim(); });
    return r;
  }).filter((r) => r.feature);
}

function score(rows) {
  const counted = [], skipped = [], extras = [], problems = [];
  for (const row of rows) {
    const original = (row.original || "yes").toLowerCase();
    const clone = (row.clone || "").toLowerCase();
    const prio = (row.priority || "").toLowerCase();
    if (["no", "n", "false"].includes(original)) { extras.push(row); continue; }
    if (clone === "skip") { skipped.push(row); continue; }
    if (!(prio in WEIGHT)) problems.push(`line ${row.line}: priority '${row.priority}' is not must/should/could, counted as could`);
    if (!(clone in CREDIT)) problems.push(`line ${row.line}: clone '${row.clone}' is not yes/partial/no/skip, counted as no`);
    counted.push({ ...row, weight: WEIGHT[prio] ?? 1, credit: CREDIT[clone] ?? 0 });
  }
  const total = counted.reduce((s, r) => s + r.weight, 0);
  const got = counted.reduce((s, r) => s + r.weight * r.credit, 0);
  const areas = {};
  for (const r of counted) {
    const a = r.area || "(no area)";
    areas[a] ??= [0, 0, 0];
    areas[a][0] += r.weight * r.credit; areas[a][1] += r.weight; areas[a][2]++;
  }
  const byArea = Object.entries(areas).map(([area, [g, t, n]]) => ({ area, score: Math.round((1000 * g) / t) / 10, features: n }))
    .sort((a, b) => a.score - b.score);
  const brief = (r) => ({ feature: r.feature, area: r.area || "", priority: PRIORITY_NAME[r.weight ?? WEIGHT[(r.priority || "").toLowerCase()] ?? 1] ?? "could", clone: r.clone || "no", notes: r.notes || "" });
  const missing = counted.filter((r) => r.credit < 1)
    .sort((a, b) => b.weight - a.weight || a.credit - b.credit || (a.area || "").localeCompare(b.area || "") || a.feature.localeCompare(b.feature));
  const musts = counted.filter((r) => r.weight === 3);
  return {
    feature_score: Math.round((total ? (1000 * got) / total : 0)) / 10,
    counted: counted.length,
    must_have_done: musts.filter((r) => r.credit === 1).length,
    must_have_total: musts.length,
    by_area: byArea,
    missing: missing.map(brief), skipped: skipped.map(brief), extras: extras.map(brief), problems,
  };
}

function render(r, md) {
  const h = md ? "## " : "";
  const out = [`${h}Parity: ${r.overall.toFixed(1)} / 100`, "",
    `features ${r.feature_score.toFixed(1)}  (${r.counted} counted, must-haves ${r.must_have_done} of ${r.must_have_total} done)`];
  if (r.layout_score != null) out.push(`layout   ${r.layout_score.toFixed(1)}  (${r.visual.length} screens compared)`);
  if (r.must_have_done < r.must_have_total) out.push("", `Not shippable yet: ${r.must_have_total - r.must_have_done} must-have features are not done.`);
  out.push("", `${h}By area, weakest first`, ...r.by_area.map((a) => `- ${a.area.padEnd(28)} ${a.score.toFixed(1).padStart(5)}  (${a.features} features)`));
  out.push("", `${h}Missing, in build order`, ...(r.missing.length ? r.missing.map((m) => `- [${m.priority}] ${m.area || "-"}: ${m.feature}, ${m.clone}${m.notes ? `  (${m.notes})` : ""}`) : ["- nothing. Every counted feature is done."]));
  if (r.skipped.length) out.push("", `${h}Left out on purpose (not scored)`, ...r.skipped.map((m) => `- ${m.feature}: ${m.notes || "no reason given, add one"}`));
  if (r.extras.length) out.push("", `${h}Yours, not in the original (not scored)`, ...r.extras.map((m) => `- ${m.feature}`));
  if (r.visual?.length) out.push("", `${h}Screens`, ...[...r.visual].sort((a, b) => a.score - b.score).map((v) => `- ${v.file.padEnd(40)} ${v.score.toFixed(1).padStart(5)}`));
  if (r.problems.length) out.push("", `${h}Fix in the matrix`, ...r.problems.map((p) => `- ${p}`));
  return out.join("\n");
}

const args = process.argv.slice(2);
const matrix = args[0];
const vi = args.indexOf("--visual");
const visualFiles = vi >= 0 ? args.slice(vi + 1).filter((a) => !a.startsWith("--")) : [];
const result = score(load(matrix));
if (visualFiles.length) {
  result.visual = visualFiles.map((p) => { const d = JSON.parse(fs.readFileSync(p, "utf8")); return { file: d.files?.clone ?? p, score: Number(d.score), mode: d.mode ?? "layout" }; });
  result.layout_score = Math.round(10 * result.visual.reduce((s, v) => s + v.score, 0) / result.visual.length) / 10;
  result.overall = Math.round(10 * (0.8 * result.feature_score + 0.2 * result.layout_score)) / 10;
} else result.overall = result.feature_score;
console.log(args.includes("--json") ? JSON.stringify(result, null, 2) : render(result, args.includes("--markdown")));
