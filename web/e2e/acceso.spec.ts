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
    await expect(page.getByRole("alert").filter({ hasText: /\S/ })).toHaveText("Correo o contraseña incorrectos.");
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
    await expect(page.getByRole("alert").filter({ hasText: /\S/ })).toContainText("Ya existe una cuenta con ese correo");
  });

  test("A4 mostrar y ocultar la contraseña", async ({ page }) => {
    await page.goto("/acceder");
    const field = page.getByLabel("Contraseña", { exact: true });
    await expect(field).toHaveAttribute("type", "password");
    await page.getByRole("button", { name: "Mostrar contraseña" }).click();
    await expect(field).toHaveAttribute("type", "text");
  });

  test("A5 recuperar la contraseña en la demo: la antigua deja de valer", async ({ page }) => {
    await signIn(page);
    await page.getByRole("button", { name: "Salir" }).click();
    await page.goto("/acceder");
    await page.getByRole("button", { name: "¿Olvidaste tu contraseña?" }).click();
    await page.getByLabel("Correo electrónico").fill("ana@example.test");
    await page.getByRole("button", { name: "Enviar enlace" }).click();
    await page.getByRole("link", { name: "Elegir contraseña nueva" }).click();
    await page.getByLabel("Contraseña nueva", { exact: true }).fill("clave-nueva-123");
    await page.getByRole("button", { name: "Guardar contraseña" }).click();
    await expect(page.getByRole("heading", { name: "Tus datos fiscales" })).toBeVisible();
    await page.getByRole("button", { name: "Salir" }).click();
    await page.goto("/acceder");
    await page.getByLabel("Correo electrónico").fill("ana@example.test");
    await page.getByLabel("Contraseña", { exact: true }).fill("clave-de-prueba-1");
    await page.getByRole("button", { name: "Entrar" }).click();
    await expect(page.getByRole("alert").filter({ hasText: /\S/ })).toHaveText("Correo o contraseña incorrectos.");
  });

  test("A6 entrar con un correo sin cuenta lleva a crearla con el correo ya escrito", async ({ page }) => {
    await page.goto("/acceder");
    await page.getByLabel("Correo electrónico").fill("nuevo@example.test");
    await page.getByLabel("Contraseña", { exact: true }).fill("lo-que-sea-123");
    await page.getByRole("button", { name: "Entrar" }).click();
    await expect(page.getByRole("heading", { name: "Crea tu cuenta" })).toBeVisible();
    await expect(page.getByRole("status").filter({ hasText: "No hay ninguna cuenta con ese correo" })).toContainText("No hay ninguna cuenta con ese correo");
    await expect(page.getByLabel("Correo electrónico")).toHaveValue("nuevo@example.test");
    await expect(page.getByLabel("Nombre completo")).toBeFocused();
  });
});
