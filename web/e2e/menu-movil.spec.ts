import { expect, test } from "./helpers";

test.use({ viewport: { width: 390, height: 844 } });

test("El menú móvil se cierra al pulsar Empieza gratis desde acceso @mobile", async ({ page }) => {
  await page.goto("/acceder");
  const menuButton = page.getByRole("button", { name: /^(Abrir|Cerrar) menú$/ });
  await page.getByRole("button", { name: "Abrir menú" }).click();
  await expect(menuButton).toHaveAttribute("aria-expanded", "true");
  await page.getByRole("navigation", { name: "Principal móvil", exact: true })
    .getByRole("link", { name: "Empieza gratis" }).click();
  await expect(menuButton).toHaveAttribute("aria-expanded", "false");
});
