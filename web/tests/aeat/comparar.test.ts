import { describe, expect, it } from "vitest";
import { comparar } from "../../scripts/aeat/comparar.mjs";

const entradas = (...slugs: string[]) => slugs.map((slug) => ({ slug, url: `https://ejemplo.test/${slug}` }));

describe("comparar", () => {
  it("compara ambos tipos de entradas y clasifica todos los hashes del catálogo", () => {
    expect(comparar({
      catalogo: { asturias: entradas("nueva", "igual", "cambiada", "sin-base") },
      hashes: { asturias: { nueva: "n", igual: "i", cambiada: "c2", "sin-base": "s" } },
      baseline: { asturias: { nueva: "n", igual: "i", cambiada: "c1" } },
      json: { territorios: { Asturias: {
        deducciones: [{ aeat: "igual" }, { aeat: "desaparecida-z" }],
        noModeladas: [{ aeat: "cambiada" }, { aeat: "sin-base" }, { aeat: "desaparecida-a" }],
      } } },
      mapaCcaa: { asturias: "Asturias" },
    })).toEqual({
      ccaa: { Asturias: {
        nuevas: ["nueva"], desaparecidas: ["desaparecida-a", "desaparecida-z"],
        cambiadas: ["cambiada"], sinLineaBase: ["sin-base"], sinCambios: 2,
      } },
      avisos: [],
    });
  });

  it.each([null, {}])("clasifica sin línea base cuando falta el historial: %s", (baseline) => {
    const informe = comparar({
      catalogo: { asturias: entradas("z", "a") }, hashes: { asturias: { z: "z", a: "a" } },
      baseline, json: { territorios: { Asturias: {} } }, mapaCcaa: { asturias: "Asturias" },
    });
    expect(informe).toEqual({ ccaa: { Asturias: {
      nuevas: ["a", "z"], desaparecidas: [], cambiadas: [], sinLineaBase: ["a", "z"], sinCambios: 0,
    } }, avisos: [] });
  });

  it("avisa de territorios sin carpeta, carpetas sin territorio y cada entrada sin aeat", () => {
    const informe = comparar({
      catalogo: { desconocida: entradas("x"), aragon: entradas("y") }, hashes: {}, baseline: null,
      json: { territorios: {
        Navarra: { deducciones: [{}] },
        Asturias: { deducciones: [{}, { aeat: "" }], noModeladas: [{}] },
      } },
      mapaCcaa: { asturias: "Asturias", aragon: "Aragón" },
    });
    expect(informe.avisos).toHaveLength(7);
    expect(informe.avisos.filter((aviso: string) => aviso.includes("sin aeat"))).toHaveLength(4);
    expect(informe.avisos).toContain('Territorio "Navarra" sin carpeta en mapaCcaa.');
    expect(informe.avisos).toContain('Carpeta "aragon" del catálogo sin territorio en el JSON.');
    expect(informe.avisos).toContain('Carpeta "desconocida" del catálogo sin territorio en el JSON.');
    expect(informe.avisos).toEqual([...informe.avisos].sort());
  });

  it("produce una salida determinista sin modificar las entradas", () => {
    const datos = {
      catalogo: { z: entradas("z", "a"), a: entradas("y", "b") },
      hashes: { z: { z: "2", a: "2" }, a: { y: "2", b: "2" } },
      baseline: { z: { z: "1", a: "1" }, a: { y: "1", b: "1" } },
      json: { territorios: { Zeta: {}, Alfa: {} } }, mapaCcaa: { z: "Zeta", a: "Alfa" },
    };
    const copia = structuredClone(datos);
    const resultado = comparar(datos);
    expect(Object.keys(resultado.ccaa)).toEqual(["Alfa", "Zeta"]);
    expect(resultado.ccaa.Zeta.cambiadas).toEqual(["a", "z"]);
    expect(comparar({ ...datos, catalogo: { a: entradas("b", "y"), z: entradas("a", "z") } })).toEqual(resultado);
    expect(datos).toEqual(copia);
  });
});
