import { a11y, connectManual, expect, fillQuestionnaire, noHorizontalScroll, payPlan, signIn, test } from "./helpers";

const pdf = (name: string, bytes: number) => ({ name, mimeType: "application/pdf", buffer: Buffer.alloc(bytes, 37) });

test.describe("F02 carta de Hacienda", () => {
  test("F02-H1 sube una carta y aparece pendiente de análisis", async ({ page }) => {
    await signIn(page);
    await page.getByRole("link", { name: "Carta de Hacienda" }).click();
    await expect(page.getByRole("heading", { name: "He recibido una carta de Hacienda" })).toBeVisible();
    await page.locator("input[type=file]").filter({ visible: true }).setInputFiles(pdf("requerimiento-2025.pdf", 2048));
    await expect(page.getByText("requerimiento-2025.pdf")).toBeVisible();
    await expect(page.getByText("Pendiente de análisis del asesor")).toBeVisible();
    expect(await a11y(page)).toEqual([]);
  });

  test("F02-N1 rechaza tipos no admitidos", async ({ page }) => {
    await signIn(page);
    await page.getByRole("link", { name: "Carta de Hacienda" }).click();
    await expect(page.getByRole("heading", { name: "He recibido una carta de Hacienda" })).toBeVisible();
    await page.locator("input[type=file]").filter({ visible: true }).setInputFiles({ name: "virus.exe", mimeType: "application/octet-stream", buffer: Buffer.from("x") });
    await expect(page.getByText(/Formato no admitido/)).toBeVisible();
  });

  test("F02-N2 rechaza archivos de más de 20 MB", async ({ page }) => {
    await signIn(page);
    await page.getByRole("link", { name: "Carta de Hacienda" }).click();
    await expect(page.getByRole("heading", { name: "He recibido una carta de Hacienda" })).toBeVisible();
    await page.locator("input[type=file]").filter({ visible: true }).setInputFiles(pdf("enorme.pdf", 21 * 1024 * 1024));
    await expect(page.getByText(/supera los 20 MB/)).toBeVisible();
  });

  test("F02-E1 nombre de archivo con acentos y emoji se muestra entero", async ({ page }) => {
    await signIn(page);
    await page.getByRole("link", { name: "Carta de Hacienda" }).click();
    await expect(page.getByRole("heading", { name: "He recibido una carta de Hacienda" })).toBeVisible();
    await page.locator("input[type=file]").filter({ visible: true }).setInputFiles(pdf("carta Hacienda ñ 😀.pdf", 100));
    await expect(page.getByText("carta Hacienda ñ 😀.pdf")).toBeVisible();
  });
});

test.describe("F02 regresiones", () => {
  test("F02-E2 tras pasar por Datos fiscales, «Elegir archivo» de la carta abre el campo de la carta (BUG-002)", async ({ page }) => {
    await signIn(page); // aterriza en Datos fiscales, que también tiene un selector de archivos
    await page.getByRole("link", { name: "Carta de Hacienda" }).click();
    await expect(page.getByRole("heading", { name: "He recibido una carta de Hacienda" })).toBeVisible();
    const chooser = page.waitForEvent("filechooser");
    await page.getByText("Elegir archivo", { exact: true }).filter({ visible: true }).click();
    await (await chooser).setFiles(pdf("carta-por-etiqueta.pdf", 500));
    await expect(page.getByText("carta-por-etiqueta.pdf")).toBeVisible();
  });
});

test.describe("F04 autónomos y F05 trámites (páginas informativas)", () => {
  test("F04-H1 la página de autónomos lleva a empezar", async ({ page }) => {
    await page.goto("/asesoria-gestoria");
    await expect(page.getByRole("heading", { name: "Gestoría para autónomos" })).toBeVisible();
    await page.getByRole("link", { name: /Contratar Premium/ }).click();
    await expect(page).toHaveURL(/\/acceder/);
  });

  test("F05-H1 los trámites internacionales aparecen como próximamente", async ({ page }) => {
    await page.goto("/tramites");
    await expect(page.getByText("Modelo 720 (bienes en el extranjero)")).toBeVisible();
    await expect(page.getByText("Próximamente").first()).toBeVisible();
  });

  test("F05-E2 precios e inicio avisan de que no aceptamos régimen foral (BUG-003)", async ({ page }) => {
    await page.goto("/precios");
    await expect(page.getByText(/no trabajamos con declaraciones del País Vasco ni de Navarra/)).toBeVisible();
    await page.goto("/");
    await page.getByText("¿Y si vivo en el País Vasco o Navarra?").click();
    await expect(page.getByText(/no trabajamos con declaraciones del País Vasco ni de Navarra/)).toBeVisible();
  });

  test("F04/F05-A11Y páginas públicas sin infracciones", async ({ page }) => {
    const found: Record<string, string[]> = {};
    for (const p of ["/", "/precios", "/tramites", "/asesoria-gestoria", "/acceder"]) {
      await page.goto(p);
      found[p] = await a11y(page);
    }
    expect(found).toEqual({ "/": [], "/precios": [], "/tramites": [], "/asesoria-gestoria": [], "/acceder": [] });
  });

  test("F04/F05-E1 páginas públicas a 390 px sin desbordamiento @mobile", async ({ page }) => {
    for (const p of ["/", "/precios", "/tramites", "/asesoria-gestoria", "/acceder"]) {
      await page.goto(p);
      await noHorizontalScroll(page);
    }
  });
});

test.describe("F06 chat con el asesor", () => {
  test("F06-H1 con plan Acompañado se puede escribir al asesor", async ({ page }) => {
    await signIn(page);
    await connectManual(page);
    await fillQuestionnaire(page);
    await payPlan(page, /Acompañado/);
    await page.getByLabel("Escribe un mensaje").fill("¿Necesitáis el certificado del alquiler? 🏠");
    await page.getByRole("button", { name: "Enviar" }).click();
    await expect(page.getByRole("log")).toContainText("¿Necesitáis el certificado del alquiler? 🏠");
  });

  test("F06-N1 con plan Esencial no hay chat y se explica por qué", async ({ page }) => {
    await signIn(page);
    await connectManual(page);
    await fillQuestionnaire(page);
    await payPlan(page, /Esencial/);
    await expect(page.getByLabel("Escribe un mensaje")).toHaveCount(0);
    await expect(page.getByText(/incluido en los planes Acompañado y Completo/)).toBeVisible();
  });

  test("F06-E1 un mensaje muy largo no rompe la maquetación @mobile", async ({ page }) => {
    await signIn(page);
    await connectManual(page);
    await fillQuestionnaire(page);
    await payPlan(page, /Acompañado/);
    await page.getByLabel("Escribe un mensaje").fill("Palabraextremadamentelargasinespacios".repeat(8));
    await page.getByRole("button", { name: "Enviar" }).click();
    await noHorizontalScroll(page);
  });
});

test.describe("S19 suscripción", () => {
  test("S19-H1 cancelar la renovación pide confirmación y la desactiva", async ({ page }) => {
    await signIn(page);
    await connectManual(page);
    await fillQuestionnaire(page);
    await payPlan(page);
    await page.getByRole("link", { name: "Suscripción" }).click();
    await page.getByRole("button", { name: "Cancelar la renovación" }).click();
    await expect(page.getByRole("alertdialog")).toBeVisible();
    await page.getByRole("button", { name: "Sí, cancelar" }).click();
    await expect(page.getByText("No se renovará", { exact: true })).toBeVisible();
  });

  test("S19-E1 sin suscripción muestra un estado vacío útil", async ({ page }) => {
    await signIn(page);
    await page.getByRole("link", { name: "Suscripción" }).click();
    await expect(page.getByText("No tienes ninguna suscripción")).toBeVisible();
    await expect(page.getByRole("link", { name: "Ver precios" })).toBeVisible();
  });
});
