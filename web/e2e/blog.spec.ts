import { a11y, expect, noHorizontalScroll, test } from "./helpers";

// En modo demo no hay Supabase: el blog sale vacío con su aviso. El flujo de escribir y publicar
// se prueba con vitest (permisos en tests/db.test.ts y reglas en src/lib/blog.test.ts).
test.describe("Blog", () => {
  test("BLOG-H1 se llega desde el menú, filtra por categoría y ofrece el asesor", async ({ page }) => {
    await page.goto("/inicio");
    await page.getByRole("navigation", { name: "Principal" }).getByRole("link", { name: "Blog" }).click();
    await expect(page.getByRole("heading", { level: 1, name: "Blog" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Pronto publicaremos las primeras guías." })).toBeVisible();
    await page.getByRole("navigation", { name: "Categorías" }).getByRole("link", { name: "Autónomos" }).click();
    await expect(page).toHaveURL(/\/blog\?categoria=autonomos$/);
    await expect(page.getByRole("heading", { name: "Aún no hay guías de autónomos." })).toBeVisible();
    await expect(page.getByRole("link", { name: /Calcular gratis/ })).toBeVisible();
    expect(await a11y(page)).toEqual([]);
  });

  test("BLOG-H2 la antigua dirección de artículos lleva al blog", async ({ page }) => {
    await page.goto("/articulos");
    await expect(page).toHaveURL(/\/blog$/);
  });

  test("BLOG-E1 un post que no existe da 404", async ({ page }) => {
    const r = await page.goto("/blog/no-existe");
    expect(r?.status()).toBe(404);
  });

  test("BLOG-E2 a 390 px no hay desbordamiento @mobile", async ({ page }) => {
    await page.goto("/blog");
    await expect(page.getByRole("heading", { level: 1, name: "Blog" })).toBeVisible();
    await noHorizontalScroll(page);
  });
});
