import { a11y, expect, noHorizontalScroll, test } from "./helpers";

// Los artículos vienen del feed de gestoriaemadrid.com; si la web no responde, la página lo explica.
// La prueba vale en los dos casos: no depende de que haya red.
test.describe("Artículos", () => {
  test("ART-H1 se llega desde el menú, muestra artículos o el aviso, y el bloque del asesor", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("navigation", { name: "Principal" }).getByRole("link", { name: "Artículos" }).click();
    await expect(page.getByRole("heading", { level: 1, name: "Guías y artículos" })).toBeVisible();
    const links = page.getByRole("link", { name: /Leer en Gestoría eMadrid/ });
    const fallback = page.getByRole("heading", { name: "Ahora mismo no podemos cargar los artículos." });
    await expect(links.first().or(fallback)).toBeVisible();
    if (await links.count()) await expect(links.first()).toHaveAttribute("href", /^https:\/\/gestoriaemadrid\.com\/noticias\//);
    await expect(page.getByRole("link", { name: /Calcular gratis/ })).toBeVisible();
    expect(await a11y(page)).toEqual([]);
  });

  test("ART-E1 a 390 px no hay desbordamiento @mobile", async ({ page }) => {
    await page.goto("/articulos");
    await expect(page.getByRole("heading", { level: 1, name: "Guías y artículos" })).toBeVisible();
    await noHorizontalScroll(page);
  });
});
