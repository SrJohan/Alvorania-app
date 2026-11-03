import { expect, noHorizontalScroll, signIn, test } from "./helpers";

// Barrido de la skill /qa-movil-pc: cada ruta en escritorio (proyecto desktop) y en móvil (proyecto mobile, etiqueta @mobile).
// El fixture `problems` de helpers ya hace fallar por errores de consola, excepciones y 5xx.
// shortcut: lista a mano; si añades una página en src/app, añádela aquí.
const ACCESO = ["/", "/acceder", "/restablecer"];
const APP = ["/app/conectar", "/app/cuestionario", "/app/plan", "/app/resultado", "/app/revision", "/app/caso", "/app/requerimiento", "/app/suscripcion"];

for (const tag of ["", " @mobile"]) {
  for (const ruta of ACCESO) {
    test(`barrido ${ruta}${tag}`, async ({ page }) => {
      const r = await page.goto(ruta);
      expect(r?.status(), `estado HTTP de ${ruta}`).toBeLessThan(400);
      await noHorizontalScroll(page);
    });
  }

  test(`barrido zona cliente${tag}`, async ({ page }) => {
    await signIn(page);
    for (const ruta of APP) {
      const r = await page.goto(ruta);
      expect(r?.status(), `estado HTTP de ${ruta}`).toBeLessThan(400);
      await noHorizontalScroll(page);
    }
  });
}
