# Comprobador de deducciones AEAT Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Comprobar que las deducciones autonomicas de `irpf-2025.json` tienen relacion 1:1 con las de la guia de la AEAT por comunidad, y poder repetir la comprobacion cada año.

**Architecture:** Scripts Node `.mjs` en `web/scripts/aeat/` (sin dependencias nuevas, `fetch` nativo). Rastrean la pagina estatica "Manual Renta 2025 Parte 2" que contiene todos los enlaces por comunidad, comparan con el JSON y con una linea base de hashes, y escriben un informe markdown. Una auditoria unica de cifras la hacen subagentes de solo lectura. Nada escribe en produccion.

**Tech Stack:** Node (fetch, crypto, fs), vitest (`web/vitest.config.ts` incluye `tests/**/*.test.ts` y `src/**/*.test.ts`), TypeScript en `rules.ts`.

**Spec:** `docs/superpowers/specs/2026-11-05-comprobador-deducciones-aeat-design.md`

## Correcciones al spec (verificadas el 2026-11-05)

- La pagina indice de la guia (`.../guia-deducciones-autonomicas/<ccaa>.html`) carga su lista por JavaScript. La fuente estatica es `https://sede.agenciatributaria.gob.es/Sede/Ayuda/25Manual/100/deducciones-autonomicas.html` (243 KB), que enlaza cada deduccion como `/Sede/ayuda/manuales-videos-folletos/manuales-practicos/irpf-2025-deducciones-autonomicas/comunidad-autonoma-<ccaa>/<slug>.html`.
- Esos enlaces no llevan codigo `10.3.4`. **La clave 1:1 es el slug** (`arrendamiento-vivienda-habitual`). El campo del JSON se llama `aeat` y guarda ese slug.
- Las URLs `fuente` actuales del JSON (arbol `manuales-ayuda-presentacion/.../10_3_4-...`) son otro arbol, tambien estatico y con el texto completo. Sirven para la auditoria de cifras, no para la clave.
- Medido hoy: Asturias tiene 27 deducciones en la guia; el JSON tiene 2 + 4 no modeladas. El JSON cubre 15 territorios.

## Global Constraints

- Sin dependencias nuevas; Node con `fetch` nativo.
- El script nunca escribe en `irpf-<año>.json`, migraciones ni base de datos. Solo escribe `docs/aeat/` y la linea base.
- Peticiones secuenciales, pausa de 300 ms entre ellas, `User-Agent` generico (`Mozilla/5.0`).
- Si una pagina no responde 200 o una comunidad conocida da cero deducciones, termina con codigo 1 y mensaje claro. Nunca informe vacio de "sin cambios".
- Entradas de `deducciones` y de `noModeladas` cuentan igual para el 1:1.
- Textos y nombres de ficheros en castellano, sin emojis ni rayas largas.
- `npm test` y `npm run lint` en `web/` en verde al terminar cada tarea.

## Review Focus

- Pagina de la AEAT que devuelve 200 con HTML de error o mantenimiento: debe fallar, no dar "0 deducciones nuevas" (test en Task 1).
- Comunidad del JSON sin equivalente en el catalogo (forales, renombrada): debe salir como aviso, no ignorarse (Task 3).
- Slug duplicado dentro de una comunidad en el JSON: error de invariante (Task 5).
- Cambio solo de maquetacion en una subpagina: el texto normalizado no debe cambiar de hash (Task 2).
- Primera ejecucion sin linea base: todas aparecen como "sin linea base", no como "cambiadas" (Task 3).

## File Structure

- `web/scripts/aeat/catalogo.mjs`: descarga y parsea el catalogo por comunidad (Task 1).
- `web/scripts/aeat/texto.mjs`: normaliza HTML a texto y calcula el hash (Task 2).
- `web/scripts/aeat/comparar.mjs`: logica pura de comparacion (Task 3).
- `web/scripts/aeat-check.mjs`: CLI, orquesta y escribe informe y linea base (Task 4).
- `web/src/lib/tax/rules.ts`: tipo con campo `aeat` (Task 5).
- `web/tests/aeat/*.test.ts` y `web/tests/aeat/fixtures/`: tests y HTML de ejemplo.
- `docs/aeat/`: informes y auditorias generados.

---

### Task 1: Catalogo por comunidad

**Files:**
- Create: `web/scripts/aeat/catalogo.mjs`
- Create: `web/tests/aeat/fixtures/manual-parte2.html` (extracto real: guardar de la AEAT el bloque de enlaces de 2 comunidades, p. ej. Asturias y Aragon)
- Test: `web/tests/aeat/catalogo.test.ts`

**Interfaces:**
- Produces: `parseCatalogo(html: string): Record<string, { slug: string; url: string }[]>` (clave = slug de comunidad, p. ej. `principado-asturias`; lanza `Error` si no encuentra ninguna comunidad). `fetchTexto(url: string): Promise<string>` (lanza si estado distinto de 200). `URL_MANUAL: string`.

- [ ] **Step 1: Write the failing tests** en `catalogo.test.ts`: con el fixture, `parseCatalogo` devuelve la clave `principado-asturias` con `arrendamiento-vivienda-habitual` y `familias-numerosas`, sin duplicados y sin el enlace de la propia comunidad (`.../comunidad-autonoma-principado-asturias.html`); con `"<html>Mantenimiento</html>"` lanza.
- [ ] **Step 2: Run** `npx vitest run tests/aeat/catalogo.test.ts` desde `web/`. Expected: FAIL (modulo no existe).
- [ ] **Step 3: Implement** `parseCatalogo` con una regex sobre `href="...irpf-2025-deducciones-autonomicas/comunidad-autonoma-<ccaa>/<slug>.html"`, deduplicando por `(ccaa, slug)`. `fetchTexto` con `fetch` y cabecera `User-Agent`.
- [ ] **Step 4: Run** el test. Expected: PASS.
- [ ] **Step 5: Commit** `git add web/scripts/aeat web/tests/aeat && git commit -m "AEAT: catalogo de deducciones por comunidad"`.

### Task 2: Texto normalizado y hash

**Files:**
- Create: `web/scripts/aeat/texto.mjs`
- Test: `web/tests/aeat/texto.test.ts`

**Interfaces:**
- Produces: `textoNormalizado(html: string): string` (solo el contenido principal, sin etiquetas, entidades decodificadas, espacios colapsados, sin cabecera, pie ni fecha de actualizacion). `hashTexto(texto: string): string` (SHA-256 hex).

- [ ] **Step 1: Write the failing tests**: dos HTML con el mismo contenido y distinta maquetacion (clases, saltos de linea, `&aacute;` frente a `á`) dan el mismo hash; un cambio de `500 euros` a `600 euros` da hash distinto; la fecha "Actualizado ..." del pie no afecta.
- [ ] **Step 2: Run** `npx vitest run tests/aeat/texto.test.ts`. Expected: FAIL.
- [ ] **Step 3: Implement** quitando `<script>`, `<style>`, cabecera y pie por etiqueta, luego tags y entidades (tabla minima: `&aacute;` y similares, `&nbsp;`, `&amp;`). Localizar el contenedor principal inspeccionando la subpagina real y dejar en un comentario por que ese selector.
- [ ] **Step 4: Run** el test. Expected: PASS.
- [ ] **Step 5: Commit** `AEAT: texto normalizado y hash`.

### Task 3: Comparacion pura

**Files:**
- Create: `web/scripts/aeat/comparar.mjs`
- Test: `web/tests/aeat/comparar.test.ts`

**Interfaces:**
- Consumes: forma `catalogo` de Task 1; `hashes: Record<string /*ccaa*/, Record<string /*slug*/, string>>`; `baseline` con la misma forma que `hashes` o `null`; `json`: el objeto `TaxRules` con `territorios`.
- Produces: `comparar({ catalogo, hashes, baseline, json, mapaCcaa }): Informe` con `Informe = { ccaa: Record<string, { nuevas: string[]; desaparecidas: string[]; cambiadas: string[]; sinLineaBase: string[]; sinCambios: number }>; avisos: string[] }`. `mapaCcaa: Record<string, string>` traduce el slug de comunidad del catalogo al nombre del territorio del JSON (`"principado-asturias": "Asturias"`).

- [ ] **Step 1: Write the failing tests** con datos pequeños: slug en catalogo y no en JSON => `nuevas`; slug en JSON (`aeat`, en `deducciones` o `noModeladas`) y no en catalogo => `desaparecidas`; hash distinto del baseline => `cambiadas`; `baseline = null` => `sinLineaBase` y nada en `cambiadas`; territorio del JSON sin comunidad en `mapaCcaa` => aviso en `avisos`; comunidad del catalogo sin territorio en JSON => aviso.
- [ ] **Step 2: Run** `npx vitest run tests/aeat/comparar.test.ts`. Expected: FAIL.
- [ ] **Step 3: Implement** `comparar` como funcion pura (sin red ni disco). El `mapaCcaa` completo se rellena en Task 4 tras ver el catalogo real.
- [ ] **Step 4: Run** el test. Expected: PASS.
- [ ] **Step 5: Commit** `AEAT: comparacion de deducciones contra el JSON`.

### Task 4: CLI, informe y linea base

**Files:**
- Create: `web/scripts/aeat-check.mjs`
- Modify: `web/package.json` (scripts `"aeat:check": "node scripts/aeat-check.mjs"`)
- Modify: `web/.gitignore` solo si `docs/aeat/` generado no debe ignorarse (por defecto se versiona)
- Test: `web/tests/aeat/informe.test.ts` (la parte que formatea markdown, exportada como `formatearInforme(informe: Informe, fecha: string): string`)

**Interfaces:**
- Consumes: `parseCatalogo`, `fetchTexto`, `URL_MANUAL`, `textoNormalizado`, `hashTexto`, `comparar`.
- Produces: `node scripts/aeat-check.mjs <año> [--write-baseline]`. Escribe `docs/aeat/informe-<año>-<YYYY-MM-DD>.md`; con `--write-baseline` escribe `web/src/lib/tax/data/aeat-baseline-<año>.json`. Codigo de salida 1 en los fallos de la constraint global.

- [ ] **Step 1: Write the failing test** de `formatearInforme`: lista por comunidad con encabezados "Nuevas", "Desaparecidas", "Cambiadas", conteo de "Sin cambios", y seccion de avisos; sin avisos no aparece la seccion.
- [ ] **Step 2: Run** `npx vitest run tests/aeat/informe.test.ts`. Expected: FAIL.
- [ ] **Step 3: Implement** `formatearInforme` y el CLI. El CLI descarga el manual, parsea, descarga cada subpagina (secuencial, 300 ms), calcula hashes, compara y escribe. Completar `mapaCcaa` con los slugs reales del catalogo para los 15 territorios del JSON (Madrid, Cataluña, Andalucía, Aragón, Asturias, Baleares, Canarias, Cantabria, Castilla-La Mancha, Castilla y León, Extremadura, Galicia, Murcia, La Rioja, Comunidad Valenciana); lo que no case se deja como aviso.
- [ ] **Step 4: Run** `npx vitest run tests/aeat` y despues `npm run aeat:check -- 2025` de verdad. Expected: tests PASS; informe generado en `docs/aeat/` con Asturias mostrando unas 21 deducciones "nuevas" y 0 desaparecidas.
- [ ] **Step 5: Commit** `AEAT: comando aeat:check con informe`.

### Task 5: Campo `aeat` en el JSON y invariante

**Files:**
- Modify: `web/src/lib/tax/rules.ts` (`DedCommon` y `noModeladas` ganan `aeat?: string`)
- Modify: `web/src/lib/tax/data/irpf-2025.json` (cada entrada existente gana `aeat`; cada deduccion de la AEAT sin entrada se añade a `noModeladas` con `nombre`, `url` de la subpagina de la guia y `motivo: "pendiente de auditoria"`)
- Test: `web/tests/aeat/json-invariante.test.ts`

**Interfaces:**
- Consumes: informe de Task 4 para saber que slugs faltan.
- Produces: JSON donde toda entrada de `deducciones` y `noModeladas` tiene `aeat`.

- [ ] **Step 1: Write the failing test** `json-invariante.test.ts`: por cada territorio, toda entrada tiene `aeat` no vacio y no hay slugs repetidos.
- [ ] **Step 2: Run** `npx vitest run tests/aeat/json-invariante.test.ts`. Expected: FAIL.
- [ ] **Step 3: Update** `rules.ts` y rellenar el JSON, comunidad a comunidad, a partir del informe. Mapear a mano las entradas existentes a su slug (p. ej. `asturias_alquiler` => `arrendamiento-vivienda-habitual`; las 4 `noModeladas` de Asturias por su titulo). Una entrada que cubre varias deduccion de la AEAT queda con `aeat` de la principal y las demas en `noModeladas`. Esta tarea la hace Claude, no Codex: requiere criterio.
- [ ] **Step 4: Run** `npm test`, `npm run lint` y `npm run aeat:check -- 2025`. Expected: tests PASS; el informe muestra 0 nuevas y 0 desaparecidas en todas las comunidades.
- [ ] **Step 5: Regenerar** la migracion con `node scripts/rules-to-sql.mjs 2025 0012` solo si el equipo lo pide; por defecto no tocar migraciones. **Commit** `AEAT: clave aeat en las deducciones del JSON`.

### Task 6: Auditoria de cifras (una vez, solo lectura)

**Files:**
- Create: `docs/aeat/auditoria-2025-<ccaa>.md` (uno por comunidad)

**Interfaces:**
- Consumes: JSON de Task 5 y las URLs `fuente` y `url` de cada entrada.
- Produces: por comunidad, tabla `slug | cifra en JSON | cifra en AEAT | veredicto (ok / distinto / duda)`.

- [ ] **Step 1: Lanzar subagentes** `sonnet` de solo lectura, uno por 2 o 3 comunidades (5 a 6 en total), pasando `model` explicito. Cada uno recibe el nombre de la comunidad, la ruta del JSON y el formato de tabla; descarga cada subpagina y compara importe, porcentaje, tope, limite de base imponible y requisitos. No edita ficheros salvo su propio `auditoria-*.md`.
- [ ] **Step 2: Revisar** cada informe: contrastar a mano 2 filas "ok" por comunidad al azar con la subpagina.
- [ ] **Step 3: Consolidar** en `docs/aeat/auditoria-2025-resumen.md`: lista de cifras erroneas y dudas para el fiscalista. No corregir el JSON en esta tarea.
- [ ] **Step 4: Commit** `AEAT: auditoria de cifras 2025`.

### Task 7: Linea base

**Files:**
- Create: `web/src/lib/tax/data/aeat-baseline-2025.json` (generado)

- [ ] **Step 1: Ejecutar** `npm run aeat:check -- 2025 --write-baseline` solo cuando las auditorias de Task 6 esten resueltas por el fiscalista (o se acepte explicitamente congelar con dudas abiertas).
- [ ] **Step 2: Ejecutar** `npm run aeat:check -- 2025` otra vez. Expected: todo "sin cambios".
- [ ] **Step 3: Commit** `AEAT: linea base 2025`.

## Reparto

- **Codex** (`codex exec -C <repo> -s workspace-write "<encargo autocontenido>"`): Tasks 1 a 4, un encargo por tarea con su test. Claude revisa el diff antes de cada commit.
- **Claude**: Task 5 (criterio de mapeo) y consolidacion de Task 6.
- **Subagentes `sonnet`** solo lectura: Task 6.
- Task 7 la ejecuta Claude tras la decision del fiscalista.

## Self-review

- Spec: comprobador (T1 a T4), 1:1 con clave (T5), auditoria (T6), linea base (T7), ciclo anual (comando repetible; el spec lo documenta). Sin hueco.
- Cambio respecto al spec: clave = slug, no codigo numerico; indicado arriba.
- Tipos consistentes: `Informe`, `parseCatalogo`, `comparar`, `formatearInforme` definidos una vez y reutilizados.
- Pendiente a vigilar: el selector del contenido principal (Task 2) y el nombre exacto de los slugs de comunidad (Task 4) se fijan inspeccionando las paginas reales.
