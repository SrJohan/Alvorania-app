import { expect, signIn, test } from "./helpers";

test.describe("Acceso con contraseña (modo demo)", () => {
  test("A1 crear cuenta, salir y volver a entrar con la contraseña", async ({ page }) => {
    await signIn(page);
    await page.getByRole("button", { name: "Salir" }).click();
    await page.goto("/acceder?next=/app/conectar");
    await page.getByLabel("Correo electrónico").fill("ana@example.test");
    await page.getByLabel("Contraseña", { exact: true }).fill("clave-de-prueba-1");
    await page.getByRole("button", { name: "Entrar" }).click();
    await expect(page.getByRole("heading", { name: "Tus datos fiscales" })).toBeVisible();
  });

  test("A2 contraseña incorrecta: mensaje claro y no entra", async ({ page }) => {
    await signIn(page);
    await page.getByRole("button", { name: "Salir" }).click();
    await page.goto("/acceder");
    await page.getByLabel("Correo electrónico").fill("ana@example.test");
    await page.getByLabel("Contraseña", { exact: true }).fill("otra-clave-distinta");
    await page.getByRole("button", { name: "Entrar" }).click();
    await expect(page.getByRole("alert")).toHaveText("Correo o contraseña incorrectos.");
    await expect(page).toHaveURL(/\/acceder/);
  });

  test("A3 crear cuenta exige 8 caracteres y no repite un correo ya registrado", async ({ page }) => {
    await page.goto("/acceder");
    await page.getByRole("button", { name: "Crea una" }).click();
    await page.getByLabel("Nombre completo").fill("Ana");
    await page.getByLabel("Correo electrónico").fill("ana@example.test");
    await page.getByLabel("Contraseña", { exact: true }).fill("corta");
    await page.getByRole("button", { name: "Crear cuenta" }).click();
    await expect(page.getByText("Usa al menos 8 caracteres.")).toBeVisible();
    await page.getByLabel("Contraseña", { exact: true }).fill("clave-de-prueba-1");
    await page.getByRole("button", { name: "Crear cuenta" }).click();
    await expect(page.getByRole("heading", { name: "Tus datos fiscales" })).toBeVisible();
    await page.getByRole("button", { name: "Salir" }).click();
    await page.goto("/acceder");
    await page.getByRole("button", { name: "Crea una" }).click();
    await page.getByLabel("Nombre completo").fill("Ana");
    await page.getByLabel("Correo electrónico").fill("ana@example.test");
    await page.getByLabel("Contraseña", { exact: true }).fill("clave-de-prueba-1");
    await page.getByRole("button", { name: "Crear cuenta" }).click();
    await expect(page.getByRole("alert")).toContainText("Ya existe una cuenta con ese correo");
  });

  test("A4 mostrar y ocultar la contraseña", async ({ page }) => {
    await page.goto("/acceder");
    const field = page.getByLabel("Contraseña", { exact: true });
    await expect(field).toHaveAttribute("type", "password");
    await page.getByRole("button", { name: "Mostrar contraseña" }).click();
    await expect(field).toHaveAttribute("type", "text");
  });
});
