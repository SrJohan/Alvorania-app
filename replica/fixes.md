# Qué hacer mejor que TaxDown

Fecha: 2026-10-26. Base: `replica/feedback.md`, generado con `replica/tools/reviews.mjs` sobre `replica/reviews.csv`.

## La muestra, dicha tal cual

- **559 reseñas reales de 3 fuentes**: App Store España 500 (las más recientes del feed oficial de Apple, de marzo de 2025 a octubre de 2026, sin filtrar), Trustpilot 40 (las 40 más recientes de 1 a 3 estrellas), Google Play 20 (primera página «más relevantes»). Una duplicada eliminada.
- **Sesgo**: Trustpilot y Google Play se leyeron filtrados hacia lo negativo. El App Store no: allí el 64 % son de 5 estrellas y el 29 % de 1 o 2. Las listas de abajo miden **qué falla cuando falla**, no cuánta gente está descontenta.
- Cada cita es literal (Trustpilot y Google Play comprobados con huella SHA-256 contra la página) y lleva su enlace. En el App Store el texto guardado es «título. cuerpo» de la reseña.
- Reddit no se pudo consultar (bloqueado en el navegador de la app y para la búsqueda). Sin datos de foros.
- Lo que valoran los contentos, para no romperlo: que es **fácil y rápido**. Ese listón hay que mantenerlo.

## 1. Lo que odian

| # | problema | reseñas | fuentes | cita |
| --- | --- | --- | --- | --- |
| 1 | **El precio cambia por el camino**: planes que no incluyen tu caso, suplementos tras pagar, «upselling» | 85 | 3 | «Sin embargo, al hacer la declaración me informaron que debía pagar un suplemento adicional porque mi caso “no estaba incluido” en el plan.» ([Google Play](https://play.google.com/store/apps/details?id=com.taxdown.bave.android&hl=es&reviewId=bc04d781-5e9a-47f7-825c-de1f4e06bb54)) · «Tomad en cuenta que el plan “FULL” te puede costar desde 65€ hasta 239€, dependiendo de tu situación fiscal, para que no los pille por sorpresa como a mí.» ([App Store](https://itunes.apple.com/es/rss/customerreviews/page=5/id=1503998673/sortBy=mostRecent/json#13936662265)) |
| 2 | **No contestan o tardan días** | 65 | 3 | «Me han hecho mal la declaración, se lo he dicho por el chat y tardan en responder días, no se puede modificar la declaración que ellos te hacen, no contestan.» ([App Store](https://itunes.apple.com/es/rss/customerreviews/page=4/id=1503998673/sortBy=mostRecent/json#13957524813)) |
| 3 | **Errores en la declaración: el cliente tiene que vigilarles** | 47 | 3 | «Muchas veces no te asesoran correctamente, lo que deriva en problemas y requiere de tener los conocimientos necesarios para poder darte cuenta de que siempre hay fallos que no deberías tener que estar resolviendo cuando estás pagando por un servicio.» ([Trustpilot](https://es.trustpilot.com/reviews/6ac52e7e5a77f1eae5ac9a15)) |
| 4 | **Te atiende una IA o un bot cuando pagaste por una persona** | 27 | 3 | «El asesor es una IA y deja de responder.» ([App Store](https://itunes.apple.com/es/rss/customerreviews/page=1/id=1503998673/sortBy=mostRecent/json#14197303676)) |
| 5 | **Renovación y cancelación**: cobros sin avisar, no poder quitar la tarjeta o cancelar | 24 | 3 | «Me ha llegado un correo diciendo q se me renueva la suscripción pasado mañana y la web no funciona, no puedo cancelarlo.» ([Google Play](https://play.google.com/store/apps/details?id=com.taxdown.bave.android&hl=es&reviewId=4a1845cf-663f-40db-bb0a-0507815b6689)) |
| 6 | **El resultado inicial no se parece al final** | 17 | 3 | «Te hacen creer que vas a tener beneficios en tu declaración y después de que te suscribís y pagas te dan exactamente el mismo borrador que vos mismo podes hacer en hacienda.» ([App Store](https://itunes.apple.com/es/rss/customerreviews/page=3/id=1503998673/sortBy=mostRecent/json#14010199012)) |
| 7 | **Cada vez te atiende alguien distinto** | 11 | 3 | «Difícil comunicación, llevo ya un par de años haciendo la declaración con TaxDown y pareciera que cada año un nuevo asesor toma tu caso y tienes que explicar todo de nuevo.» ([App Store](https://itunes.apple.com/es/rss/customerreviews/page=3/id=1503998673/sortBy=mostRecent/json#14062746625)) |
| 8 | **La app falla** (no abre, se borra el progreso) | 18 | 3 | «Para subir documentos, si minimizas el enlace, para buscar un archivo o generar un PDF, se cierra y borra todo el progreso (he perdido datos varias veces).» ([Google Play](https://play.google.com/store/apps/details?id=com.taxdown.bave.android&hl=es&reviewId=f397bb40-256d-4d8a-b8d9-d99be889d311)) |
| 9 | **Presentan sin confirmar o en duplicado** | 6 | 3 | «No lo volveré a usar nunca más me presentaron la declaración dos veces y sin preguntarme si estaba de acuerdo y no me devolvieron lo que pague por hacerme algo mal» ([Trustpilot](https://es.trustpilot.com/reviews/6ac628798b278bc10f7b6f13)) |
| 10 | Plazos y fraccionamiento sin avisar | 5 | 3 | «…no me avisaron de la denegacion de fraccionamiento ni ningun plazo, no sabian los plazos y tuve que pagar todo junto el mismo dia…» ([Trustpilot](https://es.trustpilot.com/reviews/6ad5d22c34516d03654a2f2c)) |
| — | Demasiados correos · **débil** (4 reseñas, 1 fuente) | 4 | 1 | «…cada pto día que pasa me mandas 15 correos…» ([App Store](https://itunes.apple.com/es/rss/customerreviews/page=1/id=1503998673/sortBy=mostRecent/json#14237786243)) |

## 2. Lo que falta

| # | qué piden | reseñas | fuentes | cita |
| --- | --- | --- | --- | --- |
| 1 | **Inversiones, bróker y cripto bien resueltos**, sin cargar los informes a mano | 23 | 3 | «Puntos negativos: finalmente he hecho yo todo el trabajo y me he tirado literalmente HORAS, ya que falla y no permite introducir el informe de DEGIRO automáticamente.» ([Google Play](https://play.google.com/store/apps/details?id=com.taxdown.bave.android&hl=es&reviewId=a6d0196d-c7b7-4542-9dca-3c1e19bd68bf)) |
| 2 | **Hablar con el asesor por teléfono**, también en el plan alto | — | 2 | «Echaría en falta poder hablar directamente por teléfono con asesor en el plan full .» ([App Store](https://itunes.apple.com/es/rss/customerreviews/page=8/id=1503998673/sortBy=mostRecent/json#12573106742)) · «aúnque tengo el plan full, nunca me permitieron tener una llamada.» ([Google Play](https://play.google.com/store/apps/details?id=com.taxdown.bave.android&hl=es&reviewId=217df8e8-4398-4459-9c95-bfaab4a70a6e)) |
| 3 | **Ver qué deducciones se aplican y por qué** | — | 1 · **débil** | «Me gustaría q me enseñarla a q o cuales subvenciones me está acogiendo.» ([Trustpilot](https://es.trustpilot.com/reviews/6ac51fc9a9219af044b3b842)) |
| 4 | **Poder editar el borrador uno mismo** | — | 1 · **débil** | «Errores y no deja editar borrador.» ([App Store](https://itunes.apple.com/es/rss/customerreviews/page=3/id=1503998673/sortBy=mostRecent/json#14007034791)) |

## 3. Lo que nadie resuelve (posicionamiento)

| # | grupo o trabajo | reseñas | fuentes | cita |
| --- | --- | --- | --- | --- |
| 1 | **Casos que no son simples**: alquileres, venta de vivienda, autónomos, conjunta con ascendientes | 13 | 3 | «El primer año era muy sencillo porque no había nada que deducir, en cuanto la declaración tiene algo como una gestión de alquileres no funcionan.» ([Trustpilot](https://es.trustpilot.com/reviews/6ac5f7d77d1afffb3be9e6a2)) |
| 2 | **Quien quiere una persona responsable**, no un proceso con agentes rotando | 11 + 65 + 27 | 3 | «No hay un agente de referencia .» ([Trustpilot](https://es.trustpilot.com/reviews/6ac5e9f79d2794bb9231dbd4)) |
| 3 | Personas mayores o poco digitales · **débil** | 3 | 1 | «No está preparado para gente mayor» ([App Store](https://itunes.apple.com/es/rss/customerreviews/page=2/id=1503998673/sortBy=mostRecent/json#14119897963)) |
| 4 | Ceuta y Melilla · **débil** | 1 | 1 | «…me dicen que aún no tienen el servicio disponible para Ceuta y Melilla.» ([App Store](https://itunes.apple.com/es/rss/customerreviews/page=3/id=1503998673/sortBy=mostRecent/json#14026662692)) |

## 4. Plan de mejoras (evidencia × lo barato que es arreglarlo)

Columna «hoy»: lo que tu app ya hace.

| # | qué construir o cambiar | tamaño | skill | evidencia | hoy |
| --- | --- | --- | --- | --- | --- |
| F1 | **Precio cerrado antes de pagar**: el cuestionario decide el plan y el precio total se ve antes de pagar. Si después aparece algo no previsto, se avisa antes de cobrar nada y se puede desistir con reembolso. Nada de suplementos tras pagar. | M | /replica-launch (precios) + /replica-build | lista 1 #1 (85, 3 fuentes), #6 (17) | parcial: el plan se elige tras ver el resultado gratis, pero el precio no depende aún de tu caso |
| F2 | **Un asesor con nombre para todo tu caso, y el mismo el año siguiente** (si sigue en el equipo). Se ve su nombre y su foto propia en el caso. | S | /replica-build | #7 (11, 3), #4 (27, 3) | casi: el caso tiene asesor asignado y su nombre se ve; falta la continuidad entre años |
| F3 | **Respuesta en 1 día laborable, por una persona**, con el plazo visible en el chat y aviso al asesor si se acerca. Sin bot que haga de asesor. | M | /replica-backend (job y avisos) + /replica-build | #2 (65, 3), #4 (27, 3) | no: hay chat, sin plazo medido |
| F4 | **Revisión con lista visible**: el asesor marca una lista (rendimientos, deducciones autonómicas, ascendientes, inversiones…) y el cliente ve qué se ha comprobado y qué deducciones se aplican y por qué. | M | /replica-build | #3 (47, 3), lista 2 #3 | parcial: el cliente ya ve el desglose y las deducciones que no aplican con el motivo |
| F5 | **Nada se presenta sin tu OK, y recibes el justificante y el PDF** al momento | — | — | #9 (6, 3), #10 | **hecho**: dos aprobaciones exigidas en la base de datos, PDF de la declaración en el caso |
| F6 | **Cancelar la renovación en un clic, aviso 15 días antes** y sin cobros «del año» que no se expliquen | — | /replica-launch (texto) | #5 (24, 3) | **hecho** en código (Stripe pendiente de configurar) |
| F7 | **Llamada con tu asesor incluida en el plan alto**, con cita | S | /replica-build (advisor_slots ya existe) | lista 2 #2 | la tabla de citas existe, sin pantalla |
| F8 | **Informes de bróker con precio fijo por informe**: el cliente sube el PDF de DEGIRO, XTB o Trade Republic y el precio se sabe antes | L | /replica-build | lista 2 #1 (23, 3) | no |

Recomendación de orden: **F2 → F1 → F3 → F4 → F7**. F8 es lo que más diferencia, pero es grande; mejor después de lanzar.

## 5. El ángulo

**A. Tu asesor, de verdad** (recomendado)
> Para quien hace la renta online y se cansó de hablar con un bot o con un agente distinto cada vez, **[tu gestoría]** le asigna un asesor con nombre que lleva su caso de principio a fin, contesta en un día laborable y no presenta nada sin su visto bueno.
> Evidencia: atención (65), IA (27) y continuidad (11) en 3 fuentes.

**B. Precio cerrado**
> Para quien empezó con un plan barato y acabó pagando suplementos, **[tu gestoría]** le dice el precio total antes de pagar, según su caso, y no lo cambia.
> Evidencia: precio (85 reseñas, 3 fuentes), resultado que cambia (17, 3).

**C. Inversores**
> Para quien tiene bróker o cripto y acaba cargando los informes a mano, **[tu gestoría]** recibe el PDF del bróker y lo resuelve a precio fijo.
> Evidencia: 23 reseñas, 3 fuentes. Más estrecho y más caro de construir.

Recomiendo **A con B como prueba**: «Un asesor con nombre, que responde en un día y con precio cerrado». Ataca los tres temas más pesados a la vez y encaja con lo que ya está construido: asignación de asesor, dos aprobaciones y desglose visible.

Avisos:
- Las citas son **investigación**, no testimonios: no se usan en la web.
- No uses el nombre de TaxDown en tu marca, anuncios ni ficha de tienda. Una página de comparación con ellos es una cuestión para tu abogado.
- Siguiente paso: `/replica-brand`.
