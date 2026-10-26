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

/** Recorre la página para que aparezcan los bloques que entran al hacer scroll y espera a que acabe todo movimiento: un texto a medio aparecer no se puede medir. */
async function settle(page: Page) {
  await page.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 500) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 60)); }
    window.scrollTo(0, 0);
    await Promise.all(document.getAnimations().map((a) => a.finished.catch(() => undefined)));
    await new Promise((r) => setTimeout(r, 800));
  });
}

/** Escaneo de accesibilidad (WCAG 2.1 AA). Devuelve las infracciones para poder afirmarlas en la prueba. */
export async function a11y(page: Page) {
  await settle(page);
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

export type Q = {
  ccaa?: string; civil?: string; birthYear?: number; gross?: number; ss?: number; wh?: number; savings?: number; gains?: number;
  kids?: number; under3?: number; rent?: number; mortgage?: number; pension?: number; donations?: number;
};

const next = (page: Page) => page.getByRole("button", { name: "Siguiente" }).click();
const fillIf = async (page: Page, label: string | RegExp, v: number) => { if (v) await page.getByLabel(label).fill(String(v)); };

/**
 * Rellena el cuestionario de 6 pasos y llega al resultado.
 * Por defecto es el caso A de src/lib/tax/engine.test.ts, calculado a mano: Madrid, 30.000 €, 598,02 € a pagar.
 */
export async function fillQuestionnaire(page: Page, q: Q = {}) {
  const v = { ccaa: "Madrid", civil: "soltero", birthYear: 1990, gross: 30000, ss: 1950, wh: 4000, savings: 0, gains: 0, kids: 0, under3: 0, rent: 0, mortgage: 0, pension: 0, donations: 0, ...q };
  await page.getByLabel("Comunidad donde resides").selectOption(v.ccaa);
  await page.getByLabel("Estado civil").selectOption(v.civil);
  await page.getByLabel("Año de nacimiento").fill(String(v.birthYear));
  await next(page);
  await page.getByLabel("Ingresos brutos del trabajo en el año").fill(String(v.gross));
  await page.getByLabel("Cotizaciones a la Seguridad Social").fill(String(v.ss));
  await page.getByLabel("Retenciones practicadas (IRPF)").fill(String(v.wh));
  await next(page);
  await fillIf(page, "Intereses y dividendos cobrados", v.savings);
  await fillIf(page, "Ganancias por vender acciones o fondos", v.gains);
  await next(page);
  await fillIf(page, "Hijos a tu cargo", v.kids);
  await fillIf(page, "De ellos, menores de 3 años", v.under3);
  await next(page);
  await fillIf(page, "Alquiler de tu vivienda habitual pagado en el año", v.rent);
  await fillIf(page, /Hipoteca de vivienda habitual/, v.mortgage);
  await next(page);
  await fillIf(page, "Aportaciones a planes de pensiones", v.pension);
  await fillIf(page, "Donativos a ONG y fundaciones", v.donations);
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
