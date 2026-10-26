# Paridad con TaxDown

Fecha: 2026-10-26 · Build: 5027ea6 + matriz actualizada · Herramientas: `replica/tools/parity.mjs` y `replica/tools/layout-diff.mjs`, puertos a Node de `parity.py` e `imgdiff.py` (no hay Python en este equipo), con los mismos pesos y el mismo algoritmo.

## Resultado

| | puntuación |
| --- | --- |
| **Total** (80 % funciones + 20 % estructura) | **47,4 / 100** |
| Funciones | 53,4 (34 contadas; **6 de 13 imprescindibles** hechas) |
| Estructura de pantallas | 23,3 (8 comparaciones) |

**Veredicto: no se puede lanzar.** Quedan 7 imprescindibles a medias y un bug S2 abierto (BUG-004). No hay ningún S1.

Ninguna función está en «no» entre las imprescindibles: las 7 que faltan están **a medias**, no sin empezar.

## Funciones por área (de peor a mejor)

| área | puntuación | funciones |
| --- | --- | --- |
| b2b | 0 | 1 |
| ayudas | 0 | 2 |
| producto | 0 | 1 |
| autónomos | 16,7 | 3 |
| soporte | 25 | 2 |
| renta | 47,7 | 8 |
| notificaciones | 50 | 1 |
| requerimientos | 50 | 3 |
| internacional | 50 | 1 |
| marketing | 66,7 | 5 |
| pagos | 75 | 2 |
| onboarding | 75 | 2 |
| seguimiento, cuenta, confianza | 100 | 1 cada una |

## Lo que falta, en orden de construcción

Imprescindibles (a medias):

1. **Cálculo del resultado** · motor de demostración con la escala general; faltan deducciones autonómicas y reglas revisadas por un fiscalista.
2. **Optimización con deducciones** · solo pensiones, donativos e hipoteca anterior a 2013.
3. **Cuestionario guiado** · 4 pasos básicos; faltan alquiler, inversiones, discapacidad y varios pagadores.
4. **Selección de plan y pago** · Stripe escrito y con la lógica probada, sin configurar ni probar en real.
5. **Revisión por un experto** · panel `/asesor` mínimo; falta «pedir cambios» al cliente.
6. **Presentación ante Hacienda** · el asesor registra el justificante; la presentación la hace tu gestoría a mano (decisión de arquitectura).
7. **Datos fiscales con Cl@ve** · sustituido por subida o entrada manual; Cl@ve exige ser colaborador social de la AEAT.

Deberías tener: rectificativa de 4 años, fuera de plazo, borrador de respuesta a requerimientos, autónomos (alta, 130/303, suscripción), chat con IA, chat en tiempo real o WhatsApp, notificaciones probadas.

Podrías tener: blog y glosario propios, ayudas, página de empresas, encuesta de trámites, trámites internacionales.

Fuera a propósito (no puntúan): acuerdos con bancos, la acreditación de la AEAT (la tramitas tú), la IA entrenada con 800.000 declaraciones, y la marca, testimonios y cifras de TaxDown.

## Estructura de pantallas

Mismo tamaño de ventana (1440×900 y 390×844), parte visible al cargar. Solo pantallas públicas: la app de TaxDown requiere cuenta y no se ha visto (ver recon). El color se ignora a propósito.

| pantalla | escritorio | móvil | qué cambia |
| --- | --- | --- | --- |
| S01 Inicio | 35,3 (antes 31,2) | 30,5 | ya coincide la posición a 1440 px: contenido de 1.344 px y tarjeta del asesor arriba a la derecha del titular. Lo que queda: su panel de situaciones es más alto (las tarjetas van al pie de un campo de color grande), sus fotos de asesores y la diferencia de textos |
| S03 Precios | 22,2 | 24,4 | composición propia: tarjetas y tabla frente a su cabecera con planes |
| S04 Trámites | 17,8 | 8,4 | ellos: cabecera grande con ilustración y tarjetas numeradas; nosotros: listas por categoría |
| S05 Autónomos | 24,5 | 23,0 | composición propia |

Capturas en `replica/screens/` (original) y `replica/clone-screens/` (clon); mapas de diferencias en `replica/diffs/` (rojo = zona distinta).

Cómo leer la cifra: este medidor compara la densidad de bordes celda a celda, así que un desplazamiento lateral de los márgenes baja mucho la nota aunque los bloques sean los mismos. Es el caso del inicio. En el resto de pantallas sí es estructura distinta. Las capturas del clon salen del servidor de desarrollo y muestran el indicador «N» de Next abajo a la izquierda, que resta un poco.

## Diferencias de comportamiento

La app de TaxDown no se ha usado (no hay cuenta), así que esta parte compara lo público y lo que el recon infiere (marcado como supuesto).

| flujo | TaxDown | el clon | arreglar o mantener |
| --- | --- | --- | --- |
| F01 obtener datos | conexión con Cl@ve (recon) | subida del fichero o entrada a mano | mantener en v1 (sin acreditación AEAT); revisar al tenerla |
| F01 clics hasta el resultado | ~10 (supuesto, recon) | 11 en el camino más corto: Empezar, nombre y correo, enlace del correo, a mano, 3 casillas, Continuar, 4 pasos | cerca; se puede ahorrar uno agrupando las casillas |
| F01 acceso | no visto | enlace mágico al correo, sin contraseña | mantener; configurar SMTP propio (BUG-004) |
| F01 pago | solo al presentar (público) | igual: calcular gratis, pagar al contratar | mantener |
| F01 aprobación | «nada se presenta sin confirmación» (público) | igual, y además impuesto por la base de datos | mantener (mejor) |
| F01 régimen foral | el plan FULL no disponible en foral (precios) | no se acepta, avisado en cuestionario, precios y FAQ | mantener (decisión tuya) |
| F02 carta de Hacienda | análisis gratuito y borrador de respuesta | subida y espera del asesor; sin borrador | construir el borrador |
| F06 soporte | IA 24 h y asesor por chat o WhatsApp | chat con el asesor sin tiempo real; sin IA | decidir tras replica-entrepreneur |
| correos | no visto | pago, aprobación, presentación, renovación y recordatorios escritos; sin probar en real | probar con Resend |
| recordar entre visitas | no visto | demo: el navegador; real: la base de datos | mantener |

## Las cinco cosas que construir ahora

1. **Motor de cálculo real** para el ejercicio 2025: tramos estatales y autonómicos y deducciones de 1 a 3 comunidades, revisado y firmado por un fiscalista. Cierra 2 imprescindibles.
2. **Cuestionario completo**: alquiler, inversiones, discapacidad y varios pagadores. Cierra 1 imprescindible y alimenta al motor.
3. **Stripe en modo test de punta a punta**: productos, webhook con `stripe listen` y tarjeta `4242…`. Cierra 1 imprescindible.
4. **Panel de asesor completo**: pedir cambios al cliente, subir la declaración en PDF y ver los documentos del caso. Cierra 1 imprescindible.
5. **Correo por Resend en Supabase** (BUG-004, S2): es lo único que bloquea el veredicto aparte de los imprescindibles.

Hecho: a 1440 px el inicio usa contenido de 1.344 px y la tarjeta del asesor va a la derecha del titular (a 1024 px y en móvil sigue debajo, igual que en TaxDown).

Siguiente paso del pack: `/replica-build` para cerrar estos huecos. `/replica-entrepreneur` tiene más sentido cuando la paridad esté cerca de 80.
