# Build log

Código en `web/` (Next.js 16, Tailwind 4, TypeScript). Datos falsos en `web/src/lib/data/` con las mismas firmas que tendrá la capa real. Se guardan en `localStorage` del navegador.

| ID | fecha | estado | falta | más difícil de lo previsto |
| --- | --- | --- | --- | --- |
| Shell | 2026-10-25 | hecho | tema oscuro; páginas legales (aviso legal, privacidad, condiciones) como texto pendiente | tokens de `tokens.json` pasados a Tailwind 4 (`@theme`) en vez del mapeo de v3 que se escribió en replica-design |
| S01 Home | 2026-10-25 | hecho | selector de situación con rutas reales de requerimiento y autónomos; sin testimonios ni cifras (no hay propios) | |
| S02 Selector | 2026-10-25 | hecho (dentro de S01) | | |
| S03 Precios | 2026-10-25 | hecho | precios de ejemplo, se fijan en replica-launch | |
| S04 Trámites | 2026-10-25 | parcial | formulario de trámite (S18) y encuesta "pide un trámite"; internacionales como "Próximamente" | |
| S05 Gestoría autónomos | 2026-10-25 | parcial | contratación real, alta, modelos 130/303 | |
| S08 Acceso | 2026-10-25 | parcial | Supabase Auth con enlace mágico; hoy simulado | |
| S09 Datos fiscales | 2026-10-25 | parcial | lectura real del fichero de datos fiscales; hoy solo se registra la elección | sin Cl@ve por decisión de alcance (ver architecture.md) |
| S10 Cuestionario | 2026-10-25 | parcial | alquiler, inversiones, discapacidad, varios pagadores con retenciones separadas | |
| S11 Resultado | 2026-10-25 | parcial | reglas autonómicas, deducciones reales por comunidad, reglas leídas de `tax_rules` | el motor es de demostración; las cifras no sirven para presentar. Verificado a mano un caso (resultado -41 €, borrador 399 €) |
| S12 Plan y pago | 2026-10-25 | parcial | Stripe Checkout, factura, mandato guardado en BD | |
| S13 Revisión y aprobación | 2026-10-25 | parcial | la regla "dos aprobaciones" vive en el trigger SQL, aquí solo en la interfaz | |
| S14 Panel del caso | 2026-10-25 | hecho (con datos falsos) | tiempo real, adjuntos en el chat, notificaciones por email | |
| S17 Carta de Hacienda | 2026-10-25 | parcial | borrador de respuesta, pago por tipo, subida real a Storage | no se muestra análisis automático: lo hará un asesor |
| S19 Suscripción | 2026-10-25 | hecho (con datos falsos) | Stripe Customer Portal | |
| S15 Chat IA, S16 chat WhatsApp, S18 formularios de trámite, S06 Empresas, S07 SEO | | no empezado | fuera del alcance de esta fase | |

## Pendiente conocido

- **Régimen foral (Navarra, País Vasco):** el cuestionario bloquea el avance y no hay ruta alternativa. Falta una pantalla de contacto con un asesor. Es un callejón sin salida hasta que se haga.
- **Panel de asesor:** no existe. Su papel se simula con el "modo demostración" del panel del caso.
- **Capturas de referencia:** el recon no tiene capturas (`replica/screens/` no existe), así que no se han guardado `clone-screens/` y `replica-diff` no podrá comparar diseño.
- **Accesibilidad:** probado por ratón y con JS; no se ha recorrido el flujo completo solo con teclado ni con lector de pantalla.
- **Git:** `web/` tiene su propio repositorio recién inicializado, sin ningún commit hecho todavía.
- **Marca:** "Tu Gestoría" y la tipografía Inter son provisionales (replica-brand).

## Verificación hecha

- `tsc`, `eslint` y `next build` sin errores; 14 rutas estáticas.
- Flujo completo en navegador: acceso, datos fiscales, cuestionario con validación, resultado, plan, pago simulado, aprobación del asesor, aprobación del usuario, presentación, cancelación de la renovación.
- Sin desbordamiento horizontal a 390 px en 10 rutas comprobadas (faltan acceder, plan y revisión) (se corrigió una en `/precios`).
