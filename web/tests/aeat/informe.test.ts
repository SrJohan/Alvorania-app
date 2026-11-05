import { describe, expect, it } from "vitest";
import { formatearInforme, MAPA_CCAA } from "../../scripts/aeat/informe.mjs";

const sinDiferencias = {
  nuevas: [], desaparecidas: [], cambiadas: [], sinLineaBase: [], sinCambios: 3,
};

describe("formatearInforme", () => {
  it("muestra fecha, encabezados, listas y conteo por comunidad", () => {
    const markdown = formatearInforme({ ccaa: { Madrid: {
      nuevas: ["alquiler"], desaparecidas: ["estudios"], cambiadas: ["familia"],
      sinLineaBase: ["vivienda"], sinCambios: 2,
    } }, avisos: ["Falta un territorio"] }, "2026-11-05");
    for (const texto of ["2026-11-05", "## Madrid", "### Nuevas", "### Desaparecidas",
      "### Cambiadas", "### Sin linea base", "Sin cambios: 2", "## Avisos",
      "- alquiler", "- estudios", "- familia", "- vivienda", "- Falta un territorio"]) {
      expect(markdown).toContain(texto);
    }
  });

  it("omite Avisos cuando no hay avisos y resume la comunidad sin diferencias en una linea", () => {
    const markdown = formatearInforme({ ccaa: { Asturias: sinDiferencias }, avisos: [] }, "2026-11-05");
    expect(markdown).not.toContain("Avisos");
    expect(markdown.split("\n").filter((linea: string) => linea.includes("Asturias")))
      .toEqual(["- Asturias: Sin cambios: 3"]);
    expect(markdown).not.toContain("###");
  });

  it("incluye las 15 carpetas del mapa", () => {
    expect(Object.keys(MAPA_CCAA)).toHaveLength(15);
    expect(MAPA_CCAA["comunidad-autonoma-principado-asturias"]).toBe("Asturias");
    expect(MAPA_CCAA["comunitat-valenciana"]).toBe("Comunidad Valenciana");
  });
});
