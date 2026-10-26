#!/usr/bin/env node
// Barrido de marca de replica-brand, portado de sweep.py a Node (en esta máquina no hay Python).
// Busca en el código el nombre, los dominios y los colores del original. Sale con 1 si encuentra algo.
//
//   node replica/tools/sweep.mjs . --config replica/brand.json
//   node replica/tools/sweep.mjs . --avoid "TaxDown" --domains taxdown.es --colors "#5974d4"
//
// Los nombres coinciden sin mayúsculas y dentro de identificadores (TaxDownButton, tax-down).
// Los colores coinciden también en forma corta (#06f = #0066ff). Revisa nombres de archivo y carpeta.
// Omite .git, node_modules, carpetas de build, lockfiles, binarios y la carpeta replica/ (salvo --include-replica).
import fs from "node:fs";
import path from "node:path";

const SKIP_DIRS = new Set([".git", "node_modules", ".next", ".next-e2e", ".nuxt", ".svelte-kit", "dist", "build",
  "out", ".vercel", ".turbo", ".cache", "coverage", "__pycache__", ".venv", "venv", "Pods", ".expo",
  "DerivedData", ".gradle", "playwright-report", "test-results"]);
const SKIP_FILES = new Set(["package-lock.json", "yarn.lock", "pnpm-lock.yaml", "bun.lockb", "Podfile.lock", "Cargo.lock", "poetry.lock"]);
const BINARY_EXT = new Set([".png", ".jpg", ".jpeg", ".gif", ".webp", ".ico", ".icns", ".pdf", ".zip", ".gz", ".woff",
  ".woff2", ".ttf", ".otf", ".eot", ".mp4", ".mov", ".mp3", ".wav", ".avif", ".heic", ".psd", ".sketch", ".fig", ".jar", ".so", ".dylib"]);
const HEX = /#(?:[0-9a-fA-F]{6}|[0-9a-fA-F]{3})(?![0-9a-zA-Z])/g;
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, (m) => "\\" + m);
const normHex = (h) => { h = h.toLowerCase().replace(/^#/, ""); return "#" + (h.length === 3 ? [...h].map((c) => c + c).join("") : h); };

function patterns(avoid, domains) {
  const pats = [];
  for (const raw of avoid) {
    const name = raw.trim();
    if (!name) continue;
    // "Tax Down" también encuentra TaxDown y tax-down
    const parts = name.split(/[\s_-]+/).filter(Boolean).map(esc);
    pats.push({ kind: "name", label: name, rx: new RegExp(parts.join("[\\s_-]?"), "i") });
  }
  for (const raw of domains) {
    const d = raw.trim().toLowerCase();
    if (d) pats.push({ kind: "domain", label: d, rx: new RegExp(esc(d), "i") });
  }
  return pats;
}

function isBinary(file) {
  if (BINARY_EXT.has(path.extname(file).toLowerCase())) return true;
  try {
    const fd = fs.openSync(file, "r");
    const buf = Buffer.alloc(4096);
    const n = fs.readSync(fd, buf, 0, 4096, 0);
    fs.closeSync(fd);
    return buf.subarray(0, n).includes(0);
  } catch { return true; }
}

export function sweep(root, { avoid = [], domains = [], colors = [], includeReplica = false, maxSize = 2_000_000 } = {}) {
  const pats = patterns(avoid, domains);
  const cols = new Set(colors.map((c) => c.trim()).filter((c) => /^#(?:[0-9a-fA-F]{6}|[0-9a-fA-F]{3})$/.test(c)).map(normHex));
  const hits = [];
  root = path.resolve(root);
  const walk = (dir) => {
    const relDir = path.relative(root, dir) || ".";
    const entries = fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name));
    for (const e of entries) {
      const full = path.join(dir, e.name);
      const rel = path.normalize(path.join(relDir, e.name));
      if (e.isDirectory()) {
        if (SKIP_DIRS.has(e.name) || (e.name === "replica" && relDir === "." && !includeReplica)) continue;
        for (const p of pats) if (p.kind === "name" && p.rx.test(e.name)) hits.push({ file: rel + "/", line: 0, kind: "path", match: p.label, text: "nombre de carpeta" });
        walk(full);
        continue;
      }
      if (!e.isFile() || SKIP_FILES.has(e.name)) continue;
      for (const p of pats) if (p.kind === "name" && p.rx.test(e.name)) hits.push({ file: rel, line: 0, kind: "path", match: p.label, text: "nombre de archivo" });
      let lines;
      try {
        if (fs.statSync(full).size > maxSize || isBinary(full)) continue;
        lines = fs.readFileSync(full, "utf8").split(/\r?\n/);
      } catch { continue; }
      lines.forEach((line, i) => {
        for (const p of pats) if (p.rx.test(line)) hits.push({ file: rel, line: i + 1, kind: p.kind, match: p.label, text: line.trim().slice(0, 160) });
        if (cols.size) for (const m of line.matchAll(HEX)) {
          const h = normHex(m[0]);
          if (cols.has(h)) hits.push({ file: rel, line: i + 1, kind: "color", match: h, text: line.trim().slice(0, 160) });
        }
      });
    }
  };
  walk(root);
  return hits;
}

function render(hits) {
  if (!hits.length) return "Limpio. No queda nada del nombre, dominio ni colores del original.";
  const byKind = {};
  const out = hits.map((h) => {
    byKind[h.kind] = (byKind[h.kind] ?? 0) + 1;
    const loc = h.line ? `${h.file}:${h.line}` : h.file;
    return `${h.kind.padEnd(7)} ${h.match.slice(0, 18).padEnd(18)} ${loc}  ${h.text}`;
  });
  out.push("", `${hits.length} coincidencias (${Object.entries(byKind).sort().map(([k, v]) => `${k} ${v}`).join(", ")}). Sustituye todas antes de lanzar.`);
  return out.join("\n");
}

if (process.argv[1]?.endsWith("sweep.mjs")) {
  const args = process.argv.slice(2);
  const opt = (k) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : ""; };
  const list = (s) => (s || "").split(",").map((x) => x.trim()).filter(Boolean);
  const root = args[0] && !args[0].startsWith("--") ? args[0] : ".";
  const avoid = list(opt("--avoid")), domains = list(opt("--domains")), colors = list(opt("--colors"));
  if (opt("--config")) {
    try {
      const cfg = JSON.parse(fs.readFileSync(opt("--config"), "utf8"));
      avoid.push(...(cfg.avoid ?? [])); domains.push(...(cfg.domains ?? [])); colors.push(...(cfg.colors ?? []));
    } catch (e) { console.error(`sweep: ${e.message}`); process.exit(2); }
  }
  if (!avoid.length && !domains.length && !colors.length) { console.error("sweep: nada que buscar. Pasa --avoid con el nombre del original."); process.exit(2); }
  const hits = sweep(root, { avoid, domains, colors, includeReplica: args.includes("--include-replica") });
  console.log(args.includes("--json") ? JSON.stringify(hits, null, 2) : render(hits));
  process.exit(hits.length ? 1 : 0);
}
