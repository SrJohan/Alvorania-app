# Comprobador de deducciones autonomicas contra la AEAT

Fecha: 2026-11-05. Repo: alvorania-app (`web/`). Estado: pendiente de revision.

## Objetivo

Que las deducciones autonomicas de `web/src/lib/tax/data/irpf-<año>.json` tengan relacion **1:1** con las que lista la guia de deducciones autonomicas de la AEAT, comunidad por comunidad, y que cada año baste con ejecutar un comprobador para saber que hay que actualizar.

Fuente: guia "Deducciones autonomicas del IRPF <año>" de la Sede de la AEAT (por ejemplo `.../irpf-2025-deducciones-autonomicas/guia-deducciones-autonomicas/principado-asturias.html`). La pagina indice de cada comunidad solo trae **nombres**; importes y requisitos estan en las subpaginas (`10_x_y-...`). La AEAT no ofrece API ni fichero de datos: se extrae del HTML.

## Estado de partida (Asturias, verificado 2026-11-05)

- JSON: 2 deducciones calculadas (alquiler, familia numerosa) y 4 en `noModeladas`.
- AEAT: 27 deducciones (12 familiares, 4 vivienda, 0 donativos, 11 otras). Unas 21 no aparecen en el JSON ni como no modeladas.
- Las entradas llevan solo una URL en `fuente`; no hay clave estable. Los `avisos` del JSON admiten que no se revisaron las subpaginas una a una.

## Alcance

Dentro: todas las comunidades de territorio comun presentes en `territorios` del JSON; comprobador recurrente; auditoria unica de cifras.
Fuera: Navarra y Pais Vasco (forales, fuera de la guia comun; se confirma en la primera pasada), Ceuta y Melilla salvo que la guia las incluya; cambios en el motor de calculo (`engine.ts`); modelar deducciones nuevas (solo se registran como `noModeladas`).

## Definicion de 1:1

El conjunto de codigos AEAT de una comunidad en la guia debe ser igual al conjunto de codigos en el JSON, contando `deducciones` y `noModeladas` como entradas. El codigo es el segmento numerico de la URL de la subpagina (`10_3_4-...` => `10.3.4`). Cada entrada del JSON gana un campo `aeat` con ese codigo. Una entrada puede cubrir un codigo solo si se documenta (campo `cubre: string[]`); por defecto es 1 entrada = 1 codigo.

## Diseño

### 1. Comprobador recurrente (determinista, sin IA)

`web/scripts/aeat-check.mjs`, comando `npm run aeat:check -- <año>`:

1. Rastrea la guia de cada comunidad y extrae la lista de subpaginas (codigo, titulo, URL).
2. Compara contra el JSON y contra la linea base (`web/src/lib/tax/data/aeat-baseline-<año>.json`: por codigo, titulo y hash SHA-256 del texto normalizado de la subpagina).
3. Escribe `docs/aeat/informe-<año>-<fecha>.md` con cuatro listas por comunidad: **nuevas** (en AEAT, no en app), **desaparecidas** (en app, no en AEAT), **cambiadas** (hash distinto, con diff de texto) y **sin cambios** (solo conteo).
4. No escribe en el JSON, en migraciones ni en la base de datos.

Fallos: si una pagina responde distinto de 200, o la estructura del indice no se reconoce (cero subpaginas en una comunidad que tenia), el script termina con codigo distinto de cero y mensaje claro. Nunca emite un informe vacio de "sin cambios". Peticiones secuenciales con pausa corta y `User-Agent` generico.

### 2. Fase 1: barrido completo (una vez)

1. **Catalogo**: el comprobador genera por primera vez la lista de codigos de cada comunidad.
2. **Estructura**: añadir `aeat` a cada entrada existente y crear las que falten como `noModeladas` (con `nombre`, `url`, `motivo`). Cierra el 1:1 estructural.
3. **Auditoria de cifras**: subagentes de solo lectura (`sonnet`, uno por grupo de comunidades) leen cada subpagina y comparan importe, porcentaje, tope y requisitos con el JSON. Entregan un informe de fallos y dudas por comunidad. Las cifras erroneas se listan, no se corrigen solas; un fiscalista revisa las dudosas.
4. **Linea base**: cuando JSON y AEAT cuadran, se guarda `aeat-baseline-<año>.json`.

Nada de esto toca produccion: la salida son informes. El paquete sigue exigiendo `reviewed_at` antes de calcular (`REQUIRE_REVIEWED_TAX_RULES`).

### 3. Fase 2: cada año

Al publicar la AEAT el manual del nuevo ejercicio: ejecutar `aeat:check <año>`, revisar a mano solo nuevas, desaparecidas y cambiadas, actualizar el JSON, regenerar la migracion con `scripts/rules-to-sql.mjs`, firma del fiscalista (`reviewed_at`) y guardar la nueva linea base. Los agentes solo se reutilizan si una comunidad trae muchos cambios.

## Reparto del trabajo

- **Codex** (`codex exec -s workspace-write`, ficheros propios): `scripts/aeat-check.mjs`, su normalizador de texto, tests con paginas HTML de ejemplo guardadas como fixtures.
- **Subagentes** (solo lectura, `sonnet`; `haiku` para listados): auditoria de cifras por comunidad. No comparten ficheros con Codex.
- **Claude**: diseño, revision del diff de Codex, consolidacion de informes, edicion del JSON del paso 2.

## Pruebas

- Tests del comprobador con fixtures: comunidad sin cambios, deduccion nueva, desaparecida, texto cambiado, HTML con estructura irreconocible (debe fallar).
- Test de invariante sobre el JSON real: toda entrada tiene `aeat`, sin codigos duplicados dentro de una comunidad.
- `npm test` y `npm run lint` en `web/` en verde.

## Limites conocidos

- El hash detecta que algo cambio, no que; un retoque de maquetacion lo dispara. El diff de texto sirve para distinguirlo.
- Si la AEAT cambia su estructura de URLs o numeracion, el rastreo falla de forma visible y hay que adaptarlo.
- Se compara contra la AEAT, no contra el BOE ni el boletin autonomico; el fallo de la AEAT se hereda.
- Las cifras verificadas por agentes son una lectura asistida, no una firma fiscal.

## Pendiente de confirmar en la primera pasada

Que los enlaces a subpaginas existen en el HTML de la guia (la extraccion de texto solo mostro nombres); lista exacta de comunidades cubiertas por la guia; si el `fuente` actual apunta al mismo arbol de URLs que la guia (`manuales-ayuda-presentacion/...`) o a otro.
