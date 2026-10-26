import AxeBuilder from "@axe-core/playwright";
import { expect, type Page, test as base } from "@playwright/test";

/**
 * `test` con guardas comunes: cualquier error de consola o respuesta 5xx hace fallar la prueba.
 * Se acumulan y se comprueban al final (lanzar dentro del manejador no siempre falla la prueba).
 */
export const test = base.extend<{ problems: string[] }>({
  problems: [
    async ({ page }, use) => {
      const problems: string[] = [];
      page.on("console", (m) => { if (m.type() === "error") problems.push(`consola: ${m.text()}`); });
      page.on("pageerror", (e) => problems.push(`excepción: ${e.message}`));
      page.on("response", (r) => { if (r.status() >= 500) problems.push(`${r.status()} en ${r.url()}`); });
      await use(problems);
      expect(problems, "errores de consola o respuestas 5xx").toEqual([]);
    },
    { auto: true },
  ],
});
export { expect };

/** Escaneo de accesibilidad (WCAG 2.1 AA). Devuelve las infracciones para poder afirmarlas en la prueba. */
export async function a11y(page: Page) {
  const r = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
  return r.violations.map((v) => `${v.id} (${v.impact}): ${v.nodes.length} nodos — ${v.help}`);
}

export async function signIn(page: Page, name = "Ana Prueba", email = "ana@example.test") {
  await page.goto("/acceder?next=/app/conectar");
  await page.getByLabel("Nombre completo").fill(name);
  await page.getByLabel("Correo electrónico").fill(email);
  await page.getByRole("button", { name: "Continuar" }).click();
  await expect(page.getByRole("heading", { name: "Tus datos fiscales" })).toBeVisible();
}

export async function connectManual(page: Page) {
  await page.getByRole("button", { name: "Prefiero introducirlos" }).click();
  await page.getByLabel("Acepto las condiciones del servicio.").check();
  await page.getByLabel("He leído la política de privacidad.").check();
  await page.getByLabel(/Autorizo el tratamiento de mis datos fiscales/).check();
  await page.getByRole("button", { name: "Continuar al cuestionario" }).click();
  await expect(page.getByRole("heading", { name: "Cuéntanos tu situación" })).toBeVisible();
}

export type Q = { ccaa?: string; civil?: string; gross?: number; ss?: number; wh?: number; kids?: number; under3?: number; pension?: number; donations?: number; mortgage?: number };

/** Rellena el cuestionario de 4 pasos y llega al resultado. Por defecto, el caso verificado a mano (−41,00 €). */
export async function fillQuestionnaire(page: Page, q: Q = {}) {
  const v = { ccaa: "Madrid", civil: "soltero", gross: 32000, ss: 2080, wh: 4100, kids: 1, under3: 1, pension: 1200, donations: 100, mortgage: 0, ...q };
  await page.getByLabel("Comunidad donde resides").selectOption(v.ccaa);
  await page.getByLabel("Estado civil").selectOption(v.civil);
  await page.getByRole("button", { name: "Siguiente" }).click();
  await page.getByLabel("Ingresos brutos del trabajo en el año").fill(String(v.gross));
  await page.getByLabel("Cotizaciones a la Seguridad Social").fill(String(v.ss));
  await page.getByLabel("Retenciones practicadas (IRPF)").fill(String(v.wh));
  await page.getByRole("button", { name: "Siguiente" }).click();
  await page.getByLabel("Hijos a tu cargo").fill(String(v.kids));
  await page.getByLabel("De ellos, menores de 3 años").fill(String(v.under3));
  await page.getByRole("button", { name: "Siguiente" }).click();
  await page.getByLabel("Aportaciones a planes de pensiones").fill(String(v.pension));
  await page.getByLabel("Donativos a ONG y fundaciones").fill(String(v.donations));
  if (v.mortgage) await page.getByLabel(/Hipoteca de vivienda habitual/).fill(String(v.mortgage));
  await page.getByRole("button", { name: "Ver mi resultado" }).click();
  await expect(page.getByRole("heading", { name: /Tu resultado de la renta/ })).toBeVisible();
}

export async function payPlan(page: Page, plan: RegExp = /Acompañado/) {
  await page.getByRole("link", { name: "Que lo revise un asesor" }).click();
  await page.getByRole("radio", { name: plan }).check({ force: true });
  await page.getByLabel(/Autorizo a la gestoría a presentar/).check();
  await page.getByRole("button", { name: /^Pagar/ }).click();
  await expect(page.getByRole("heading", { name: "Renta 2025" })).toBeVisible();
}

export async function noHorizontalScroll(page: Page) {
  const { sw, cw } = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth }));
  expect(sw, "desbordamiento horizontal").toBeLessThanOrEqual(cw);
}
