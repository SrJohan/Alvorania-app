# Test plan: Tu Gestoría (réplica del núcleo de TaxDown)

Build: tras 5c7c1cb (ver bugs.md)  Date: 2026-10-26  Env: local. e2e contra `next build && next start` en **modo demo** (puerto 3100); backend con vitest contra Postgres en memoria; pasada manual en **modo live** con Supabase real.

Cómo ejecutar, desde `web/`: `npm run e2e` (Playwright), `npm test` (vitest).

Cada prueba e2e falla además si hay errores de consola, excepciones o respuestas 5xx. Las marcadas A11Y pasan axe con WCAG 2.1 AA.

## F01 particular presenta la renta con revisión

| case | type | steps | expected | auto | result |
| --- | --- | --- | --- | --- | --- |
| F01-H1 | happy | acceso → datos a mano → cuestionario (Madrid, 32.000 €, 1 hijo <3, 1.200 € pensiones, 100 € donativos) → resultado → plan Acompañado → pago → asesor aprueba → cliente aprueba → asesor presenta | resultado −41,00 € y 440,00 € de ahorro; estado Presentado con justificante | e2e | pass |
| F01-E1 | edge: vacío | Siguiente sin rellenar | mensajes por campo, no avanza | e2e | pass |
| F01-E2 | edge: corregir | corregir el campo con error | el error desaparece | e2e | pass |
| F01-E3 | edge: refrescar a mitad | refrescar en el paso 2 | conserva respuestas y paso | e2e | pass |
| F01-E4 | edge: datos cambiados tras calcular | cambiar donativos tras el resultado | aviso de resultado desactualizado y botón para recalcular | e2e | pass |
| F01-E5 | edge: doble clic | doble clic en Pagar | un solo pago | e2e | pass |
| F01-E6 | edge: régimen foral | elegir Navarra | aviso y no se calcula | e2e | pass |
| F01-E7 | edge: régimen foral | elegir País Vasco | hay una salida para hablar con un asesor | e2e | **fail → BUG-003** |
| F01-E8 | edge: solo teclado | acceso con Tab y Enter | llega a Datos fiscales | e2e | pass |
| F01-E9 | edge: móvil 390 px | todo el flujo hasta Plan | sin desbordamiento horizontal | e2e (Pixel 7) | pass |
| F01-E10 | edge: clic rápido | «a mano» y Continuar enseguida | pasa al cuestionario sin error falso | e2e | pass tras fix (BUG-001) |
| F01-E11 | edge: dos pestañas | editar en dos pestañas | último guardado gana, sin error | manual | pendiente |
| F01-E12 | edge: sesión caducada (live) | dejar la sesión caducar y guardar | vuelve a /acceder sin perder lo guardado | manual | pendiente |
| F01-E13 | edge: zona horaria | fechas de mensajes y aprobación | mostradas en Europe/Madrid, guardadas en UTC | e2e (timezone fijado) / revisión de código | pass |
| F01-N1 | negative | email inválido | mensaje de email inválido | e2e | pass |
| F01-N2 | negative | menores de 3 > hijos | mensaje y no avanza | e2e | pass |
| F01-N3 | negative | pagar sin mandato | pide autorizar la presentación | e2e | pass |
| F01-N4 | negative | continuar sin condiciones | pide aceptarlas | e2e | pass |
| F01-N5 | negative: sin sesión | abrir /app/caso | redirige a /acceder | e2e (demo) + manual (live) | pass |
| F01-N6 | negative: tarjeta rechazada `4000 0000 0000 0002` | pagar en live | error, sin pago ni cambio de estado | manual | **bloqueado: Stripe no configurado** |
| F01-N7 | negative: otro usuario | leer datos ajenos | nada | vitest (tests/db.test.ts, 26 casos RLS) | pass |
| F01-A11Y | a11y | inicio, datos, cuestionario, resultado, plan, caso | 0 infracciones | e2e | pass |

## F02 carta de Hacienda

| case | type | steps | expected | auto | result |
| --- | --- | --- | --- | --- | --- |
| F02-H1 | happy | subir PDF | aparece pendiente de análisis, A11Y limpio | e2e | pass |
| F02-E1 | edge: acentos y emoji | `carta Hacienda ñ 😀.pdf` | nombre mostrado entero | e2e | pass |
| F02-E2 | edge: pantalla anterior viva | pasar por Datos fiscales y subir con la etiqueta | el archivo va a la carta | e2e | pass |
| F02-N1 | negative | `.exe` | formato no admitido | e2e | pass |
| F02-N2 | negative | 21 MB | supera 20 MB | e2e | pass |
| F02-M1 | live | subir una carta con Supabase real | archivo en el bucket privado y fila en documents | manual | pendiente |

## F03 rectificativa · F04 autónomos · F05 internacional

| case | type | steps | expected | auto | result |
| --- | --- | --- | --- | --- | --- |
| F03-* | — | — | no implementado (should-have) | — | n/a |
| F04-H1 | happy | autónomos → Contratar Premium | lleva a /acceder | e2e | pass |
| F05-H1 | happy | trámites | internacionales como Próximamente | e2e | pass |
| F04/F05-A11Y | a11y | /, /precios, /tramites, /asesoria-gestoria, /acceder | 0 infracciones | e2e | pass |
| F04/F05-E1 | edge: móvil | mismas páginas a 390 px | sin desbordamiento | e2e (Pixel 7) | pass |

## F06 chat con el asesor

| case | type | steps | expected | auto | result |
| --- | --- | --- | --- | --- | --- |
| F06-H1 | happy | plan Acompañado, escribir con emoji | mensaje en el hilo | e2e | pass |
| F06-N1 | negative | plan Esencial | sin campo de chat, explica por qué | e2e | pass |
| F06-E1 | edge: mensaje largo sin espacios | enviar | sin desbordamiento en móvil | e2e (Pixel 7) | pass |

## S19 suscripción

| case | type | steps | expected | auto | result |
| --- | --- | --- | --- | --- | --- |
| S19-H1 | happy | cancelar la renovación | confirmación y «No se renovará» | e2e | pass |
| S19-E1 | edge: sin suscripción | abrir | estado vacío con enlace a precios | e2e | pass |

## Backend (vitest)

| suite | qué cubre | casos | result |
| --- | --- | --- | --- |
| tests/db.test.ts | RLS con dos clientes, asesor ajeno y admin; dos aprobaciones para presentar; facturas sin huecos; reservas sin solape; límite de uso; privilegios | 26 | pass |
| src/server/billing/webhook.test.ts | idempotencia, reintento tras fallo, metadatos manipulados, pago incompleto, suscripciones | 8 | pass |
| src/server/server-units.test.ts | reglas desde la BD = motor, reglas sin revisar, validación, nombres de archivo, escape HTML en correos | 11 | pass |

## Pasada manual en modo live (lo que no se puede automatizar)

| case | qué | estado |
| --- | --- | --- |
| M1 | el correo de acceso llega y el enlace inicia sesión en el mismo ordenador | **pass** (probado por el usuario; perfil, caso y 3 consentimientos creados en Supabase) |
| M2 | el enlace abierto en el móvil falla con «localhost rechazó la conexión» | esperado en local; en producción usará el dominio |
| M3 | varias peticiones de enlace seguidas | **fallan**: «magic link failed» ×3 en el log. Límite del SMTP gratuito de Supabase → ver «a comprobar» en bugs.md |
| M4 | pago, webhook, factura, correo de pago | bloqueado: Stripe no configurado |
| M5 | panel /asesor con un usuario asesor | pendiente: hace falta un segundo usuario con rol advisor |
| M6 | exportar y eliminar mis datos | pendiente |

## Totales

- e2e: 31 casos automatizados, 30 pass, 1 fail (BUG-003).
- vitest: 45 casos, 45 pass.
- manual: 6, 1 pass, 1 esperado, 1 con problema, 3 pendientes o bloqueados.
