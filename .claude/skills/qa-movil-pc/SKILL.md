---
name: qa-movil-pc
description: Busca errores en la web de Alvorania en vista PC y móvil y los arregla. Corre el barrido e2e (todas las rutas en 1440 px y en Pixel 7), la suite e2e completa, y revisa a mano en el navegador integrado lo que un test no ve. Arregla cada fallo desde la causa y repite hasta que todo pase. Usar cuando el usuario diga "debuggea la app", "busca errores", "testea en móvil y PC", "QA", "/qa-movil-pc".
---

# QA en PC y móvil

Objetivo: terminar con cero fallos en escritorio y en móvil, o con una lista clara de los que no se pudieron arreglar y por qué.

Todo corre en MODO DEMO (`NEXT_PUBLIC_DATA_MODE=demo`): no toca Supabase ni Stripe reales. Ver `web/playwright.config.ts`.

## 1. Barrido automático

```bash
npm --prefix web run e2e -- e2e/barrido.spec.ts
```

`web/e2e/barrido.spec.ts` abre cada ruta en los dos proyectos (`desktop` 1440x900 y `mobile` Pixel 7) y falla si hay:
- error de consola, excepción de JS o respuesta 5xx (fixture `problems` de `e2e/helpers.ts`)
- estado HTTP 4xx o más en la página
- scroll horizontal

Antes de correrlo, compara su lista de rutas con `find web/src/app -name page.tsx`. Si falta alguna página nueva, añádela.

La compilación tarda unos 4 minutos: lánzalo en segundo plano. Si falla con `Executable doesn't exist`, corre antes `npx --prefix web playwright install chromium`.

Si lo que falla es la compilación (`next build`), ese es el primer bug: arréglalo antes de nada, porque sin compilación no corre ningún test.

## 2. Suite completa

```bash
npm --prefix web run e2e
```

Incluye flujos de renta, blog, acceso, menú móvil y accesibilidad (axe, WCAG 2.1 AA).

No la limites con `head`: lee el total de `passed/failed` y las carpetas de `web/test-results/`. Para clasificar muchos fallos, encarga a un subagente `haiku` con contexto nuevo que lea cada `error-context.md` y diga si es test desfasado o bug de la app. No corras lint ni vitest a la vez que el e2e: la carga provoca tiempos agotados falsos.

## 3. Revisión visual en el navegador integrado

Los tests no ven solapes, textos cortados ni botones tapados. Arranca el servidor con `preview_start {name: "web"}` y, para las páginas clave (inicio, precios, empresas, acceder, cuestionario, resultado):
- `resize_window` preset `desktop`, captura de pantalla
- `resize_window` preset `mobile`, recarga, captura de pantalla; abre el menú móvil
- `read_console_messages` con `onlyErrors: true`

Busca: elementos solapados, texto cortado o ilegible, controles menores de 24 px en móvil (WCAG 2.5.8; los enlaces dentro de un texto no cuentan), imágenes deformadas, banners (cookies) que no se puedan cerrar, animaciones que dejan contenido invisible de forma estable, y que el menú móvil ofrezca lo mismo que la cabecera de escritorio.

Delega esta revisión en un subagente `sonnet` con contexto nuevo y un encargo cerrado (rutas, cuenta de prueba, formato de respuesta). Sirve la compilación ya hecha por el e2e con `NEXT_DIST_DIR=.next-e2e NEXT_PUBLIC_DATA_MODE=demo npx next start -p 3101` para no chocar con otro servidor de desarrollo. Contrasta cada hallazgo antes de arreglarlo: las capturas pueden pillar una animación a medias.

Para entrar en `/app` en demo crea una cuenta de prueba (mismos datos que `signIn` en `e2e/helpers.ts`). `/asesor` necesita rol de staff: en demo, sáltalo y dilo en el informe.

Al acabar, `resize_window` preset `desktop`.

## 4. Arreglar

Por cada fallo, usa `superpowers:systematic-debugging`: reproduce, encuentra la causa raíz y arréglala una vez en el código compartido (componente de `src/components/ui` o `site`), no con un parche por página.

- Los arreglos se encargan a Codex en un solo encargo con todos los fallos (ver la memoria "Codex ejecuta, Claude ordena"): `codex exec -C . -s workspace-write "<encargo>" < /dev/null`. Sin `< /dev/null` se queda esperando entrada. Revisa siempre su diff.
- Si un fallo solo se ve en móvil y no lo cubre ningún test, añade uno con la etiqueta `@mobile` (ejemplo: `e2e/menu-movil.spec.ts`).
- No cambies textos, precios ni diseño salvo que el fallo sea ese.
- No borres ni debilites un test para que pase.

## 5. Repetir

Vuelve al paso 1 tras cada tanda de arreglos, hasta que el barrido y la suite pasen en los dos proyectos. Corre también `npm --prefix web run lint` y `npm --prefix web test`.

## 6. Informe

Al usuario, en castellano llano:
- qué fallaba, en qué vista (PC, móvil o ambas) y cómo se arregló, con archivo y línea
- qué queda sin arreglar y por qué
- qué no se comprobó (por ejemplo `/asesor` o el modo real con Supabase)

No hagas commit salvo que el usuario lo pida.
