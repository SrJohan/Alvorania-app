import { readFile, writeFile, mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { setTimeout as pausa } from "node:timers/promises";
import { URL_MANUAL, fetchTexto, parseCatalogo } from "./aeat/catalogo.mjs";
import { textoNormalizado, hashTexto } from "./aeat/texto.mjs";
import { comparar } from "./aeat/comparar.mjs";
import { formatearInforme, MAPA_CCAA } from "./aeat/informe.mjs";

export async function main(args = process.argv.slice(2)) {
  const [anio, ...opciones] = args;
  if (!/^\d{4}$/.test(anio ?? "") || opciones.length > 1
    || opciones.some((opcion) => opcion !== "--write-baseline")) {
    throw new Error("Uso: node scripts/aeat-check.mjs <año> [--write-baseline]");
  }
  const datos = new URL("../src/lib/tax/data/", import.meta.url);
  const json = JSON.parse(await readFile(new URL(`irpf-${anio}.json`, datos), "utf8"));
  const rutaBaseline = new URL(`aeat-baseline-${anio}.json`, datos);
  let baseline = null;
  try {
    baseline = JSON.parse(await readFile(rutaBaseline, "utf8"));
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }

  const catalogo = parseCatalogo(await fetchTexto(URL_MANUAL));
  for (const [carpeta, nombre] of Object.entries(MAPA_CCAA)) {
    const territorio = json.territorios[nombre];
    if (((territorio?.deducciones?.length ?? 0) + (territorio?.noModeladas?.length ?? 0)) > 0
      && !catalogo[carpeta]?.length) {
      throw new Error(`La comunidad ${nombre} (${carpeta}) tiene entradas en el JSON y cero deducciones en el catalogo`);
    }
  }
  const hashes = {};
  for (const carpeta of Object.keys(catalogo).sort()) {
    hashes[carpeta] = {};
    for (const { slug, url } of [...catalogo[carpeta]].sort((a, b) => a.slug.localeCompare(b.slug))) {
      await pausa(300);
      hashes[carpeta][slug] = hashTexto(textoNormalizado(await fetchTexto(url)));
    }
  }
  const informe = comparar({ catalogo, hashes, baseline, json, mapaCcaa: MAPA_CCAA });
  const fecha = new Date().toISOString().slice(0, 10);
  const directorio = new URL("../../docs/aeat/", import.meta.url);
  await mkdir(directorio, { recursive: true });
  const destino = new URL(`informe-${anio}-${fecha}.md`, directorio);
  await writeFile(destino, formatearInforme(informe, fecha), "utf8");
  if (opciones.includes("--write-baseline")) {
    await writeFile(rutaBaseline, `${JSON.stringify(hashes, null, 2)}\n`, "utf8");
  }
  console.log(`Informe escrito en ${fileURLToPath(destino)}`);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(`Error AEAT: ${error.message}`);
    process.exitCode = 1;
  });
}
