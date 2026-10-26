import { connectManual, expect, fillQuestionnaire, payPlan, signIn, test } from "./helpers";

// Mejoras de replica/fixes.md, nacidas de las reseñas de usuarios del servicio original.
test.describe("F1 precio cerrado antes de pagar", () => {
  test("F1-H1 caso solo con nómina: todos los planes valen y se ve el total cerrado", async ({ page }) => {
    await signIn(page);
    await connectManual(page);
    await fillQuestionnaire(page);
    await page.getByRole("link", { name: "Que lo revise un asesor" }).click();
    await expect(page.getByRole("radio", { name: /Esencial/ })).toBeEnabled();
    await expect(page.getByText(/Precio cerrado\./)).toBeVisible();
    await expect(page.getByRole("button", { name: "Pagar 59,00 €" })).toBeVisible();
  });

  test("F1-H2 venta de acciones: solo el plan Completo, explicado antes de pagar", async ({ page }) => {
    await signIn(page);
    await connectManual(page);
    await fillQuestionnaire(page, { gains: 1200 });
    await page.getByRole("link", { name: "Que lo revise un asesor" }).click();
    await expect(page.getByText("Tu caso necesita el plan Completo")).toBeVisible();
    await expect(page.getByText(/Has vendido acciones o fondos/)).toBeVisible();
    await expect(page.getByRole("radio", { name: /Esencial/ })).toBeDisabled();
    await expect(page.getByRole("radio", { name: /Acompañado/ })).toBeDisabled();
    await expect(page.getByRole("radio", { name: /Completo/ })).toBeChecked();
    await expect(page.getByRole("button", { name: "Pagar 119,00 €" })).toBeVisible();
    await page.getByLabel(/Autorizo a la gestoría a presentar/).check();
    await page.getByRole("button", { name: "Pagar 119,00 €" }).click();
    await expect(page.getByRole("heading", { name: "Renta 2025" })).toBeVisible();
  });
});

test.describe("F2 asesor con nombre", () => {
  test("F2-H1 al contratar, el caso muestra quién es tu asesor y que seguirá contigo", async ({ page }) => {
    await signIn(page);
    await connectManual(page);
    await fillQuestionnaire(page);
    await payPlan(page);
    await expect(page.getByRole("heading", { name: /Tu asesor: / })).toBeVisible();
    await expect(page.getByText(/será quien te atienda también el año que viene/)).toBeVisible();
  });
});
