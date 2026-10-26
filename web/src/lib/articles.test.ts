import { describe, expect, it } from "vitest";
import { parseFeed, topicOf } from "./articles";

// Recorte del feed real de gestoriaemadrid.com (26-10-2026): enlaces codificados, CDATA y traducciones.
const item = (title: string, link: string, date: string) =>
  `<item><title>${title}</title><link>${link}</link><pubDate>${date}</pubDate><description><![CDATA[<p>texto</p>]]></description></item>`;
const FEED = `<rss><channel><title>Gestoría</title>
${item("Asesoría y gestión", "https://gestoriaemadrid.com/%3Fview%3Darticle%26amp%3Bid%3D1004", "Mon, 16 Oct 2023 10:00:00 +0000")}
${item("Modelo 720: Declaración de Bienes en el Extranjero en Madrid + Asesoría Experta", "https://gestoriaemadrid.com/noticias/modelo-720-madrid", "Wed, 25 Mar 2026 09:00:00 +0000")}
${item("Foreign Companies in Spain: Sectors with the Most Success and How to Obtain a NIF", "https://gestoriaemadrid.com/noticias/foreign-companies", "Fri, 26 Sep 2025 09:00:00 +0000")}
${item("Spanische NIF für ausländische Unternehmen beantragen | Gestoría Madrid", "https://gestoriaemadrid.com/noticias/ausl%C3%A4ndische", "Fri, 26 Sep 2025 09:00:00 +0000")}
${item("Declaración de la Renta 2025 en Madrid: guía completa para pagar menos impuestos y evitar errores", "https://gestoriaemadrid.com/noticias/declaracion-renta-2025-madrid", "Fri, 27 Mar 2026 09:00:00 +0000")}
${item("Declaración de la Renta 2025 en Madrid: guía completa para pagar menos impuestos y evitar errores", "https://gestoriaemadrid.com/noticias/declaracion-renta-2025-madrid", "Fri, 27 Mar 2026 09:00:00 +0000")}
</channel></rss>`;

describe("artículos de Gestoría eMadrid", () => {
  it("se queda con las noticias en castellano, sin duplicados y de la más nueva a la más antigua", () => {
    const a = parseFeed(FEED);
    expect(a.map((x) => x.url)).toEqual([
      "https://gestoriaemadrid.com/noticias/declaracion-renta-2025-madrid",
      "https://gestoriaemadrid.com/noticias/modelo-720-madrid",
    ]);
    expect(a[0]).toMatchObject({ topic: "Renta", date: "2026-03-27T09:00:00.000Z" });
    expect(a[1].topic).toBe("Internacional");
  });

  it("un feed vacío o roto no rompe nada", () => {
    expect(parseFeed("")).toEqual([]);
    expect(parseFeed("<rss><item><title></title></item>")).toEqual([]);
  });

  it("clasifica por tema a partir del título", () => {
    expect(topicOf("Cómo elegir una gestoría para el alta de autónomo")).toBe("Autónomos");
    expect(topicOf("Constituir una sociedad limitada")).toBe("Empresas");
    expect(topicOf("Aplazar el IVA")).toBe("Fiscalidad");
  });
});
