import { a11y, connectManual, expect, fillQuestionnaire, noHorizontalScroll, payPlan, signIn, test } from "./helpers";

test.describe("F01 particular presenta la renta con revisión", () => {
  test("F01-H1 camino feliz: acceso, cuestionario, resultado, pago, dos aprobaciones y presentación", async ({ page }) => {
    await signIn(page);
    await connectManual(page);
    await fillQuestionnaire(page);

    // Caso A de engine.test.ts, calculado a mano con las escalas de la AEAT: 598,02 € a pagar.
    const result = page.getByRole("status").filter({ hasText: "A pagar" });
    await expect(result).toContainText("598,02");

    await payPlan(page);
    await expect(page.getByText("En revisión").first()).toBeVisible();

    await page.getByRole("button", { name: "El asesor aprueba la revisión" }).click();
    await page.getByRole("link", { name: "Revisar y aprobar" }).click();
    const approve = page.getByRole("button", { name: "Aprobar y presentar" });
    await expect(approve).toBeDisabled();
    await page.getByLabel(/He revisado mi declaración y autorizo/).check();
    await approve.click();
    await expect(page.getByText(/Tu asesor presentará la declaración/)).toBeVisible();

    await page.getByRole("link", { name: "Mi caso" }).click();
    await page.getByRole("button", { name: /El asesor presenta y registra/ }).click();
    await expect(page.getByText(/Justificante DEMO-/).first()).toBeVisible();
    await expect(page.getByText("Presentado").first()).toBeVisible();
  });

  test("F01-E10 elegir «a mano» y continuar enseguida no da un error falso (BUG-001)", async ({ page }) => {
    await signIn(page);
    await page.getByLabel("Acepto las condiciones del servicio.").check();
    await page.getByLabel("He leído la política de privacidad.").check();
    await page.getByLabel(/Autorizo el tratamiento de mis datos fiscales/).check();
    await page.getByRole("button", { name: "Prefiero introducirlos" }).click();
    await page.getByRole("button", { name: "Continuar al cuestionario" }).click();
    await expect(page.getByRole("heading", { name: "Cuéntanos tu situación" })).toBeVisible();
  });

  test("F01-E11 Andalucía, 30 años y alquiler: aplica la deducción autonómica y muestra el desglose", async ({ page }) => {
    await signIn(page);
    await connectManual(page);
    await fillQuestionnaire(page, { ccaa: "Andalucía", birthYear: 1995, gross: 18000, ss: 1170, wh: 1200, rent: 6000 });
    // caso B de engine.test.ts: 738,45 € a devolver
    await expect(page.getByRole("status").filter({ hasText: "A devolver" })).toContainText("738,45");
    await expect(page.getByText("Alquiler de vivienda habitual (Andalucía, menores de 35 o mayores de 65)")).toBeVisible();
    await page.getByText("Cómo se ha calculado").click();
    await expect(page.getByText("Cuota íntegra autonómica")).toBeVisible();
  });

  test("F01-E12 comunidad sin datos propios: se avisa de que es una estimación", async ({ page }) => {
    await signIn(page);
    await connectManual(page);
    await page.getByLabel("Comunidad donde resides").selectOption("Galicia");
    await expect(page.getByText("Cálculo estimado")).toBeVisible();
    await page.getByLabel("Estado civil").selectOption("soltero");
    await page.getByRole("button", { name: "Siguiente" }).click();
    await page.getByRole("button", { name: "Atrás" }).click();
    await page.getByRole("button", { name: "Siguiente" }).click();
  });

  test("F01-E1 cuestionario vacío: no avanza y explica qué falta", async ({ page }) => {
    await signIn(page);
    await connectManual(page);
    await page.getByRole("button", { name: "Siguiente" }).click();
    await expect(page.getByText("Elige tu comunidad.")).toBeVisible();
    await expect(page.getByText("Elige tu estado civil.")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Cuéntanos tu situación" })).toBeVisible();
  });

  test("F01-E2 los errores desaparecen al corregir el campo", async ({ page }) => {
    await signIn(page);
    await connectManual(page);
    await page.getByRole("button", { name: "Siguiente" }).click();
    await page.getByLabel("Comunidad donde resides").selectOption("Madrid");
    await expect(page.getByText("Elige tu comunidad.")).toHaveCount(0);
  });

  test("F01-E3 refrescar a mitad del cuestionario conserva las respuestas y el paso", async ({ page }) => {
    await signIn(page);
    await connectManual(page);
    await page.getByLabel("Comunidad donde resides").selectOption("Galicia");
    await page.getByLabel("Estado civil").selectOption("casado");
    await page.getByRole("button", { name: "Siguiente" }).click();
    await page.getByLabel("Ingresos brutos del trabajo en el año").fill("25000");
    await page.reload();
    await expect(page.getByLabel("Ingresos brutos del trabajo en el año")).toHaveValue("25000");
    await page.getByRole("button", { name: "Atrás" }).click();
    await expect(page.getByLabel("Comunidad donde resides")).toHaveValue("Galicia");
  });

  test("F01-E4 cambiar datos tras calcular marca el resultado como desactualizado y permite recalcular", async ({ page }) => {
    await signIn(page);
    await connectManual(page);
    await fillQuestionnaire(page);
    await page.getByRole("link", { name: "Cuestionario" }).click();
    await page.getByLabel("Donativos a ONG y fundaciones").fill("500");
    await page.getByRole("link", { name: "Resultado" }).click();
    await expect(page.getByText(/Has cambiado datos desde este cálculo/)).toBeVisible();
    await page.getByRole("button", { name: "Volver a calcular" }).click();
    await expect(page.getByText(/Has cambiado datos desde este cálculo/)).toHaveCount(0);
  });

  test("F01-E5 doble clic en pagar crea un solo pago", async ({ page }) => {
    await signIn(page);
    await connectManual(page);
    await fillQuestionnaire(page);
    await page.getByRole("link", { name: "Que lo revise un asesor" }).click();
    await page.getByLabel(/Autorizo a la gestoría a presentar/).check();
    const pay = page.getByRole("button", { name: /^Pagar/ });
    await pay.dblclick();
    await expect(page.getByRole("heading", { name: "Renta 2025" })).toBeVisible();
    const paid = await page.evaluate(() => JSON.parse(localStorage.getItem("gestoria-demo-v1") ?? "{}").messages?.filter((m: { body: string }) => m.body.startsWith("Pago recibido")).length);
    expect(paid).toBe(1);
  });

  test("F01-E6 régimen foral: avisa y no calcula automáticamente", async ({ page }) => {
    await signIn(page);
    await connectManual(page);
    await page.getByLabel("Comunidad donde resides").selectOption("Navarra");
    await expect(page.getByText(/Por ahora no trabajamos con declaraciones del País Vasco ni de Navarra/)).toBeVisible();
    await expect(page.getByRole("button", { name: "Siguiente" })).toBeDisabled();
  });

  test("F01-E7 régimen foral: dice claramente que no lo aceptamos y ofrece salida (BUG-003)", async ({ page }) => {
    await signIn(page);
    await connectManual(page);
    await page.getByLabel("Comunidad donde resides").selectOption("País Vasco");
    await expect(page.getByText(/Por ahora no trabajamos con declaraciones del País Vasco ni de Navarra/)).toBeVisible();
    await expect(page.getByRole("button", { name: "Siguiente" })).toBeDisabled();
    await page.getByRole("link", { name: "Volver al inicio" }).click();
    await expect(page).toHaveURL("/");
  });

  test("F01-E8 solo teclado: acceso y primer paso", async ({ page }) => {
    await page.goto("/acceder?next=/app/conectar");
    await page.getByLabel("Nombre completo").focus();
    await page.keyboard.type("Teclado Uno");
    await page.keyboard.press("Tab");
    await page.keyboard.type("teclado@example.test");
    await page.keyboard.press("Enter");
    await expect(page.getByRole("heading", { name: "Tus datos fiscales" })).toBeVisible();
  });

  test("F01-E9 a 390 px no hay desbordamiento en ninguna pantalla del flujo @mobile", async ({ page }) => {
    await signIn(page);
    await noHorizontalScroll(page);
    await connectManual(page);
    await noHorizontalScroll(page);
    await fillQuestionnaire(page);
    await noHorizontalScroll(page);
    await page.getByRole("link", { name: "Que lo revise un asesor" }).click();
    await noHorizontalScroll(page);
  });

  test("F01-N1 email inválido en el acceso", async ({ page }) => {
    await page.goto("/acceder");
    await page.getByLabel("Nombre completo").fill("Ana");
    await page.getByLabel("Correo electrónico").fill("ana@");
    await page.getByRole("button", { name: "Continuar" }).click();
    await expect(page.getByText(/Introduce un email válido/)).toBeVisible();
  });

  test("F01-N2 menores de 3 años no pueden superar el número de hijos", async ({ page }) => {
    await signIn(page);
    await connectManual(page);
    await page.getByLabel("Comunidad donde resides").selectOption("Madrid");
    await page.getByLabel("Estado civil").selectOption("soltero");
    await page.getByRole("button", { name: "Siguiente" }).click();
    await page.getByLabel("Ingresos brutos del trabajo en el año").fill("20000");
    await page.getByRole("button", { name: "Siguiente" }).click();
    await page.getByRole("button", { name: "Siguiente" }).click(); // ahorro
    await page.getByLabel("Hijos a tu cargo").fill("1");
    await page.getByLabel("De ellos, menores de 3 años").fill("2");
    await page.getByRole("button", { name: "Siguiente" }).click();
    await expect(page.getByText("No puede ser mayor que el número de hijos.")).toBeVisible();
  });

  test("F01-N3 sin el mandato de presentación no se puede pagar", async ({ page }) => {
    await signIn(page);
    await connectManual(page);
    await fillQuestionnaire(page);
    await page.getByRole("link", { name: "Que lo revise un asesor" }).click();
    await page.getByRole("button", { name: /^Pagar/ }).click();
    await expect(page.getByText(/Autoriza a la gestoría a presentar tu declaración/)).toBeVisible();
  });

  test("F01-N4 sin aceptar condiciones no se pasa al cuestionario", async ({ page }) => {
    await signIn(page);
    await page.getByRole("button", { name: "Prefiero introducirlos" }).click();
    await page.getByRole("button", { name: "Continuar al cuestionario" }).click();
    await expect(page.getByText(/Acepta las condiciones/)).toBeVisible();
  });

  test("F01-N5 el área privada exige sesión", async ({ page }) => {
    await page.goto("/app/caso");
    await expect(page).toHaveURL(/\/acceder\?next=%2Fapp%2Fcaso/);
  });

  test("F01-A11Y accesibilidad de cada pantalla del flujo", async ({ page }) => {
    const found: Record<string, string[]> = {};
    await page.goto("/");
    found.inicio = await a11y(page);
    await signIn(page);
    found.datos = await a11y(page);
    await connectManual(page);
    found.cuestionario = await a11y(page);
    await fillQuestionnaire(page);
    found.resultado = await a11y(page);
    await page.getByRole("link", { name: "Que lo revise un asesor" }).click();
    found.plan = await a11y(page);
    await page.getByLabel(/Autorizo a la gestoría a presentar/).check();
    await page.getByRole("button", { name: /^Pagar/ }).click();
    await expect(page.getByRole("heading", { name: "Renta 2025" })).toBeVisible();
    found.caso = await a11y(page);
    expect(found).toEqual({ inicio: [], datos: [], cuestionario: [], resultado: [], plan: [], caso: [] });
  });
});
