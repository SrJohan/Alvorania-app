import { readFileSync } from "node:fs";
import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchTexto, parseCatalogo, URL_MANUAL } from "../../scripts/aeat/catalogo.mjs";

const html = readFileSync(new URL("./fixtures/manual-parte2.html", import.meta.url), "utf8");
const origen = "https://sede.agenciatributaria.gob.es";
const ruta = "/Sede/ayuda/manuales-videos-folletos/manuales-practicos/irpf-2025-deducciones-autonomicas";

describe("parseCatalogo", () => {
  it("extrae Asturias con URLs absolutas y deduplica los enlaces repetidos", () => {
    const catalogo = parseCatalogo(html + html);
    const asturias = catalogo["comunidad-autonoma-principado-asturias"];
    expect(asturias).toEqual(expect.arrayContaining([
      { slug: "arrendamiento-vivienda-habitual", url: `${origen}${ruta}/comunidad-autonoma-principado-asturias/arrendamiento-vivienda-habitual.html` },
      { slug: "familias-numerosas", url: `${origen}${ruta}/comunidad-autonoma-principado-asturias/familias-numerosas.html` },
    ]));
    for (const entradas of Object.values(catalogo) as { slug: string }[][]) {
      expect(new Set(entradas.map(({ slug }) => slug)).size).toBe(entradas.length);
    }
    expect(catalogo["comunidad-autonoma-aragon"]).toBeDefined();
    expect(catalogo["comunidad-madrid"]).toEqual(expect.arrayContaining([
      { slug: "arrendamiento-vivienda-habitual", url: `${origen}${ruta}/comunidad-madrid/arrendamiento-vivienda-habitual.html` },
    ]));
    expect(catalogo).not.toHaveProperty("guia-deducciones-autonomicas");
    expect(catalogo).not.toHaveProperty("comunidad-autonoma-principado-asturias.html");
    expect(asturias.some(({ slug }: { slug: string }) => slug === "comunidad-autonoma-principado-asturias")).toBe(false);
  });

  it("conserva carpetas genericas y excluye normativa y guia", () => {
    const catalogo = parseCatalogo(`
      <a href='${ruta}/comunitat-valenciana/familias-numerosas.html'>Familias</a>
      <a href="${ruta}/normativa-autonomica-irpf/valencia.html">Normativa</a>
      <a href="${ruta}/guia-deducciones-autonomicas/valencia.html">Guia</a>
      <a href="${ruta}/comunitat-valenciana.html">Comunidad</a>
    `);
    expect(catalogo).toEqual({
      "comunitat-valenciana": [{ slug: "familias-numerosas", url: `${origen}${ruta}/comunitat-valenciana/familias-numerosas.html` }],
    });
  });

  it("lanza Error ante HTML de mantenimiento o sin deducciones", () => {
    expect(() => parseCatalogo("<html>Mantenimiento</html>")).toThrow(Error);
    expect(() => parseCatalogo(`<a href="${ruta}/guia-deducciones-autonomicas/asturias.html">Guia</a>`)).toThrow(Error);
  });
});

describe("fetchTexto", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("exporta el manual y descarga texto con User-Agent generico", async () => {
    expect(URL_MANUAL).toBe(`${origen}/Sede/Ayuda/25Manual/100/deducciones-autonomicas.html`);
    const fetchSimulado = vi.fn().mockResolvedValue(new Response(html, { status: 200 }));
    vi.stubGlobal("fetch", fetchSimulado);
    await expect(fetchTexto(URL_MANUAL)).resolves.toBe(html);
    expect(fetchSimulado).toHaveBeenCalledWith(URL_MANUAL, { headers: { "User-Agent": "Mozilla/5.0" } });
  });

  it.each([204, 404, 503])("rechaza el estado %i", async (status) => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(null, { status })));
    await expect(fetchTexto(URL_MANUAL)).rejects.toThrow(String(status));
  });

  it.each(["", " \n\t "])("rechaza un cuerpo vacio: %j", async (cuerpo) => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(cuerpo, { status: 200 })));
    await expect(fetchTexto(URL_MANUAL)).rejects.toThrow(/vac/i);
  });
});
