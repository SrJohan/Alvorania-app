// Puerto de replica-diff/imgdiff.py (modo layout) que corre dentro de Chromium con Playwright.
// Captura cada pantalla pública del original y del clon al mismo tamaño y compara su ESTRUCTURA:
// mapas de bordes, cuadrícula de 12 columnas, solo celdas con contenido. El color se ignora a propósito.
//
// Uso (desde web/, que tiene Playwright):  node ../replica/tools/layout-diff.mjs [http://localhost:3000]
// Salida: replica/screens/*.png (original), replica/clone-screens/*.png, replica/diffs/*.json y *.png
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

// Playwright vive en web/node_modules: se carga desde la carpeta de trabajo, no desde la del script.
const { chromium } = createRequire(path.join(process.cwd(), "package.json"))("@playwright/test");

const CLONE = process.argv[2] ?? "http://localhost:3000";
// --only S01,S03 limita las pantallas (y las visitas al original) a las indicadas.
const onlyArg = process.argv.indexOf("--only");
const ONLY = onlyArg > 0 ? process.argv[onlyArg + 1].split(",") : null;
const ORIGINAL = "https://taxdown.es";
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SCREENS = [
  { id: "S01", name: "inicio", orig: "/", clone: "/" },
  { id: "S03", name: "precios", orig: "/precios", clone: "/precios" },
  { id: "S04", name: "tramites", orig: "/tramites", clone: "/tramites" },
  { id: "S05", name: "autonomos", orig: "/asesoria-gestoria", clone: "/asesoria-gestoria" },
];
const VIEWPORTS = [
  { tag: "desktop", width: 1440, height: 900 },
  { tag: "mobile", width: 390, height: 844 },
];
for (const d of ["screens", "clone-screens", "diffs"]) fs.mkdirSync(path.join(ROOT, d), { recursive: true });

// Mismo algoritmo que imgdiff.py: ancho común 480, gris, bordes con umbral 40, celdas de w/12,
// similitud = 1 - |da - db| / max(da, db) en celdas con densidad >= 0,01, marcadas si < 0,6.
const compareInPage = async ({ a, b }) => {
  const load = (src) => new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = src; });
  const [ia, ib] = await Promise.all([load(a), load(b)]);
  const target = Math.min(480, ia.width, ib.width);
  const draw = (img) => {
    const h = Math.max(1, Math.round(img.height * target / img.width));
    const c = document.createElement("canvas"); c.width = target; c.height = h;
    const x = c.getContext("2d"); x.fillStyle = "#fff"; x.fillRect(0, 0, target, h);
    x.imageSmoothingEnabled = false; x.drawImage(img, 0, 0, target, h);
    return { h, d: x.getImageData(0, 0, target, h).data };
  };
  const A = draw(ia), B = draw(ib);
  const w = target, h = Math.min(A.h, B.h);
  const gray = (D) => { const g = new Int32Array(w * h); for (let i = 0; i < w * h; i++) g[i] = Math.floor((299 * D[i * 4] + 587 * D[i * 4 + 1] + 114 * D[i * 4 + 2]) / 1000); return g; };
  const ga = gray(A.d), gb = gray(B.d);
  const edges = (g) => { const e = new Uint8Array(w * h); for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const v = g[y * w + x]; const r = x + 1 < w ? g[y * w + x + 1] : v; const bl = y + 1 < h ? g[(y + 1) * w + x] : v; e[y * w + x] = Math.abs(r - v) + Math.abs(bl - v) > 40 ? 1 : 0; } return e; };
  const ea = edges(ga), eb = edges(gb);
  const cols = 12, cell = Math.max(1, Math.floor(w / cols)), nRows = Math.ceil(h / cell);
  const flags = Array.from({ length: nRows }, () => new Array(cols).fill(false));
  const sims = [];
  const out = document.createElement("canvas"); out.width = w; out.height = h;
  const ox = out.getContext("2d"); const img = ox.createImageData(w, h);
  for (let i = 0; i < w * h; i++) { const v = 200 + Math.floor(ga[i] / 5); img.data.set([v, v, v, 255], i * 4); }
  for (let r = 0; r < nRows; r++) for (let c = 0; c < cols; c++) {
    const y0 = r * cell, y1 = Math.min(h, (r + 1) * cell), x0 = c * cell, x1 = Math.min(w, (c + 1) * cell);
    const area = (y1 - y0) * (x1 - x0); if (area <= 0) continue;
    let sa = 0, sb = 0; for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) { sa += ea[y * w + x]; sb += eb[y * w + x]; }
    const da = sa / area, db = sb / area, top = Math.max(da, db);
    if (top < 0.01) continue;
    const sim = 1 - Math.abs(da - db) / top; sims.push(sim);
    if (sim < 0.6) { flags[r][c] = true; for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) { const i = (y * w + x) * 4; const g0 = img.data[i]; img.data.set([Math.min(255, g0 + 30), Math.floor(g0 / 3), Math.floor(g0 / 3)], i); } }
  }
  ox.putImageData(img, 0, 0);
  const score = sims.length ? (100 * sims.reduce((s, v) => s + v, 0)) / sims.length : 100;
  // regiones: celdas marcadas conectadas en 4 direcciones, en coordenadas del original
  const seen = new Set(), regions = [], toOrig = ia.width / w;
  for (let r = 0; r < nRows; r++) for (let c = 0; c < cols; c++) {
    if (!flags[r][c] || seen.has(r + ":" + c)) continue;
    const st = [[r, c]], cells = []; seen.add(r + ":" + c);
    while (st.length) { const [cr, cc] = st.pop(); cells.push([cr, cc]); for (const [nr, nc] of [[cr + 1, cc], [cr - 1, cc], [cr, cc + 1], [cr, cc - 1]]) if (nr >= 0 && nr < nRows && nc >= 0 && nc < cols && flags[nr][nc] && !seen.has(nr + ":" + nc)) { seen.add(nr + ":" + nc); st.push([nr, nc]); } }
    const rs = cells.map((x) => x[0]), cs = cells.map((x) => x[1]);
    const r0 = Math.min(...rs), r1 = Math.max(...rs), c0 = Math.min(...cs), c1 = Math.max(...cs);
    const mr = nRows > 1 ? (r0 + r1) / 2 / (nRows - 1) : 0.5, mc = (c0 + c1) / 2 / (cols - 1);
    regions.push({ x: Math.round(c0 * cell * toOrig), y: Math.round(r0 * cell * toOrig), w: Math.round((c1 - c0 + 1) * cell * toOrig), h: Math.round((r1 - r0 + 1) * cell * toOrig), cells: cells.length,
      where: `${mr < 0.34 ? "arriba" : mr > 0.66 ? "abajo" : "en medio"} ${mc < 0.34 ? "izquierda" : mc > 0.66 ? "derecha" : "centro"}` });
  }
  regions.sort((x, y) => y.cells - x.cells);
  return { score: Math.round(score * 10) / 10, original: { width: ia.width, height: ia.height }, clone: { width: ib.width, height: ib.height },
    compared_at: { width: w, height: h }, height_delta_pct: Math.round(((B.h - A.h) / A.h) * 1000) / 10, regions: regions.slice(0, 6), png: out.toDataURL("image/png") };
};

const verdict = (s) => (s >= 90 ? "matches" : s >= 75 ? "close" : s >= 50 ? "partly" : "different");

const browser = await chromium.launch();
const results = [];
for (const vp of VIEWPORTS) {
  const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, locale: "es-ES", deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  for (const s of SCREENS.filter((x) => !ONLY || ONLY.includes(x.id))) {
    const file = `${s.id}-${s.name}-${vp.tag}.png`;
    const origPath = path.join(ROOT, "screens", file), clonePath = path.join(ROOT, "clone-screens", file);

    await page.goto(ORIGINAL + s.orig, { waitUntil: "networkidle", timeout: 45000 }).catch(() => undefined);
    // Rechaza las cookies no esenciales si aparece el aviso (privacidad primero).
    await page.getByRole("button", { name: /^Denegar$/ }).click({ timeout: 4000 }).catch(() => undefined);
    await page.waitForTimeout(800);
    await page.screenshot({ path: origPath });

    await page.goto(CLONE + s.clone, { waitUntil: "networkidle" });
    await page.waitForTimeout(400);
    await page.screenshot({ path: clonePath });

    const dataUrl = (p) => "data:image/png;base64," + fs.readFileSync(p).toString("base64");
    const blank = await ctx.newPage();
    const r = await blank.evaluate(compareInPage, { a: dataUrl(origPath), b: dataUrl(clonePath) });
    await blank.close();
    fs.writeFileSync(path.join(ROOT, "diffs", file), Buffer.from(r.png.split(",")[1], "base64"));
    const report = { mode: "layout", files: { original: `screens/${file}`, clone: `clone-screens/${file}` }, ...r, verdict: verdict(r.score) };
    delete report.png;
    fs.writeFileSync(path.join(ROOT, "diffs", file.replace(".png", ".json")), JSON.stringify(report, null, 2));
    results.push({ file, score: r.score, verdict: report.verdict, top: r.regions[0]?.where ?? "-" });
    console.log(`${file.padEnd(32)} ${r.score.toFixed(1).padStart(5)}  ${report.verdict.padEnd(9)} mayor diferencia: ${r.regions[0] ? `${r.regions[0].where} (${r.regions[0].cells} celdas)` : "-"}`);
  }
  await ctx.close();
}
await browser.close();
const avg = results.reduce((s, r) => s + r.score, 0) / results.length;
console.log(`\nmedia de estructura: ${avg.toFixed(1)} (${results.length} comparaciones)`);
