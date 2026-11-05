import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { hashTexto, textoNormalizado } from "../../scripts/aeat/texto.mjs";

const fixture = readFileSync(new URL("./fixtures/subpagina-asturias-alquiler.html", import.meta.url), "utf8");

describe("texto normalizado de la AEAT", () => {
  it("mantiene el hash al cambiar maquetación y entidades", () => {
    const primero = '<main id="acc-main"><h1>Alquiler</h1><p>Podr&aacute; deducir 500&nbsp;euros &amp; m&aacute;s.</p></main>';
    const segundo = `<header>Cabecera distinta</header><main class="nuevo" id="acc-main">
      <h1 class="titulo">Alquiler</h1><div><p>Podr<span>á</span> deducir   500 euros &amp; más.</p></div>
    </main><footer>Otro pie</footer>`;
    expect(textoNormalizado(primero)).toBe("Alquiler Podrá deducir 500 euros & más.");
    expect(hashTexto(textoNormalizado(primero))).toBe(hashTexto(textoNormalizado(segundo)));
  });

  it("decodifica entidades españolas y numéricas sin interpretar el texto como etiquetas", () => {
    expect(textoNormalizado('<main>&aacute;&eacute;&iacute;&oacute;&uacute;&ntilde; &Aacute;&Eacute;&Iacute;&Oacute;&Uacute;&Ntilde; &uuml; &nbsp; &amp; &#225; &#x1F600; &lt;dato&gt;</main>'))
      .toBe("áéíóúñ ÁÉÍÓÚÑ ü & á " + String.fromCodePoint(0x1f600) + " <dato>");
  });

  it("conserva las cifras del fixture real", () => {
    const texto = textoNormalizado(fixture);
    expect(texto).toContain("10%");
    expect(texto).toContain("35.000");
    expect(texto).toContain("500 euros");
    expect(texto).not.toMatch(/Logotipo|Migas navegación|Página actualizada|Generar PDF/);
  });

  it("detecta un cambio de 500 euros a 600 euros en el fixture", () => {
    const cambiado = fixture.replace("500 euros", "600 euros");
    expect(cambiado).not.toBe(fixture);
    expect(hashTexto(textoNormalizado(cambiado))).not.toBe(hashTexto(textoNormalizado(fixture)));
  });

  it("ignora la fecha de actualización del pie real", () => {
    const cambiado = fixture.replace("2026-05-07", "2027-06-08").replace("07/mayo/2026", "08/junio/2027");
    expect(cambiado).not.toBe(fixture);
    expect(hashTexto(textoNormalizado(cambiado))).toBe(hashTexto(textoNormalizado(fixture)));
  });

  it("excluye scripts, estilos, cabecera, pie, navegación y diálogos", () => {
    expect(textoNormalizado(`<main><header>Cabecera</header><nav>Migas</nav><style>p { color: red }</style>
      <script>const texto = '<main>ruido</main>';</script><!-- comentario -->
      <p>Contenido</p><div role="dialog"><div>Generar PDF</div></div><footer>Actualizado hoy</footer></main>`))
      .toBe("Contenido");
  });

  it("falla si no hay contenido principal reconocible", () => {
    expect(() => textoNormalizado("<html>Mantenimiento</html>")).toThrow(/principal/i);
  });

  it("calcula SHA-256 hexadecimal", () => {
    expect(hashTexto("abc")).toBe("ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad");
  });
});
