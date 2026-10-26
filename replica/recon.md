# Recon map: TaxDown (web, taxdown.es)

Scope: flujo principal de particulares (renta/IRPF con revisión de experto), defensa ante requerimientos de Hacienda y suscripción de autónomos. No incluye el panel `/empresas` (B2B) ni el blog/SEO.
For: gestoría propia en España (producto a vender).
Date: 2026-10-25

> Limitación: este recon se hizo solo con páginas públicas (home, precios, trámites, asesoria-gestoria, irpf, sitemap). La app autenticada (`app.taxdown.es`) NO se ha visto; sus pantallas y su modelo de datos son inferidos y están marcados como `guess`. Para completarlo, el usuario puede recorrer su propia cuenta y aportar capturas a `replica/screens/`.

## Sources

| # | source | URL | notes |
| --- | --- | --- | --- |
| 1 | marketing site (home) | https://taxdown.es/ | posicionamiento, selector de situaciones, 3 pasos |
| 2 | pricing | https://taxdown.es/precios | planes PRO/LIVE/FULL, autónomos, precios por trámite |
| 3 | trámites | https://taxdown.es/tramites | catálogo de servicios |
| 4 | gestoría autónomos | https://taxdown.es/asesoria-gestoria | contenido parcial |
| 5 | IRPF | https://taxdown.es/irpf | FAQ y tipos de renta; sin detalle del flujo |
| 6 | sitemap | https://taxdown.es/sitemap.xml | ~240 posts de blog, ~400 páginas SEO (citas previas, glosario, ayudas, deducciones) |
| 7 | entradas por trámite | https://app.taxdown.es/procedure/P000xx | solo se vieron los enlaces; no se accedió |

## Core loop

El usuario elige su situación fiscal, conecta sus datos con Hacienda (Cl@ve), una IA (Luz) prepara y optimiza la declaración en minutos, un fiscalista la revisa y la presenta, y el usuario solo paga si decide presentar con ellos.

## Screens

| ID | screen | route / how to reach | purpose | key components | states seen |
| --- | --- | --- | --- | --- | --- |
| S01 | Home | `/` | captar y derivar a trámite | hero con asesora, selector de situación, barra de confianza, tarjetas de servicios, 3 pasos, testimonios, FAQ, CTA | desktop; mobile (guess) |
| S02 | Selector de situación | home, sección 2 | enrutar al trámite correcto | tarjetas (renta, devolución, carta de Hacienda, autónomo, bajar impuestos, entre países, otro) | n/a |
| S03 | Precios | `/precios` | comparar planes y precios por servicio | tarjetas de plan, tabla comparativa, listas de precios por trámite, garantías | n/a |
| S04 | Catálogo de trámites | `/tramites` | listar servicios por categoría | lista por categoría, encuesta "pide un trámite" | n/a |
| S05 | Página de servicio | `/servicios/*`, `/asesoria-gestoria` | explicar un servicio | hero, beneficios, precio "desde", FAQ | n/a |
| S06 | Empresas | `/empresas` | B2B (fuera de alcance) | skip | n/a |
| S07 | Contenido SEO | `/blog/*`, `/taxductor/*`, `/deducciones/*` | tráfico orgánico | artículo, índice, CTA contextual | n/a |
| S08 | Registro / inicio de sesión | `app.taxdown.es` | crear cuenta | formulario email | guess |
| S09 | Conexión con Hacienda | app, paso "Conecta tus datos" | leer datos fiscales vía Cl@ve | explicación de seguridad, botón Cl@ve | guess |
| S10 | Cuestionario de situación | app | circunstancias (hijos, discapacidad, alquiler, inversiones) | pasos guiados, progreso | guess |
| S11 | Resultado y optimización | app | resultado a pagar/devolver y deducciones | tarjeta de resultado, lista de deducciones, ahorro vs borrador | guess |
| S12 | Selección de plan y pago | app | contratar PRO/LIVE/FULL | selector de plan, resumen, pago con tarjeta | guess |
| S13 | Revisión y presentación | app | revisión del experto y confirmación del usuario | estado del caso, aprobación explícita | guess |
| S14 | Panel del caso | app | estado, notificaciones, documentos | timeline, documentos, avisos de AEAT | guess |
| S15 | Chat con Luz (IA) | app y home | resolver dudas 24h | chat, sugerencias, derivación a humano | visto como demo en la home |
| S16 | Chat/WhatsApp con asesor | app (LIVE/FULL) | atención humana | hilo, adjuntos | guess |
| S17 | Subir carta de Hacienda | `app.../procedure/P00034` | análisis gratuito de requerimiento | subida de archivo, borrador de respuesta, precio | mockup en la home |
| S18 | Formulario de trámite | `app.../procedure/P000xx` | Beckham, 720, 030, 7p, residencia, salida de España | formulario por trámite, precio fijo | guess |
| S19 | Gestión de suscripción | app | ver plan, cancelar renovación | estado del plan, cancelar | guess |

## Flows

```
F01 Particular presenta la renta con revisión
    S01 -> S02 -> S08 -> S09 -> S10 -> S11 -> S12 -> S13 -> S14
    happy path clicks: ~10 hasta ver el resultado gratis (guess)
    edge: sin referencia/Cl@ve, régimen foral (FULL no disponible), borrador incompleto,
          varios pagadores, fuera de plazo (hasta 4 años)

F02 Defensa ante requerimiento de Hacienda
    S01 -> S02 -> S17 -> (análisis gratuito) -> S12 -> S14
    edge: gratis si la renta se presentó con ellos; 50-239 € según tipo

F03 Revisión de los últimos 4 años (rectificativa)
    S02/S03 -> S08 -> S09 -> S11 -> S12
    edge: 10 €/año + 20% del ahorro (solo si se recupera dinero); no aplica a foral

F04 Alta de autónomo y gestoría
    S05 -> S08 -> S12 -> S14
    edge: compromiso mínimo 3 meses; STANDARD 29,90 €/mes o PREMIUM 59,90 €/mes

F05 Trámites internacionales (Beckham, 720, 721, 7p, residencia, 030)
    S04 -> S18 -> S12 -> S14
    edge: precio fijo o rango; otros casos por soporte

F06 Soporte con IA y escalado a humano
    S15 -> S16
    edge: caso complejo -> asesor
```

## Components

| component | variants | states | used on |
| --- | --- | --- | --- |
| Botón CTA | primario ("Empezar ahora"), secundario | default, hover, focus, disabled, loading | todas |
| Tarjeta de situación | icono + título | default, hover, seleccionada | S02 |
| Tarjeta de plan | PRO, LIVE, FULL, recomendada | default, seleccionada | S03, S12 |
| Tabla comparativa de planes | check, guion, texto | n/a | S03 |
| Barra de confianza | reseñas, nº de declaraciones | n/a | S01, S03 |
| Chat de IA | burbuja IA, burbuja humano, sugerencias | escribiendo, error, derivado | S15, S16 |
| Tarjeta de resultado | a pagar, a devolver | n/a | S01, S11 |
| Stepper "cómo funciona" | 3 pasos | activo, completado | S01, S10 |
| Acordeón FAQ | n/a | abierto, cerrado | S01, S03, S05 |
| Subida de archivos | carta, justificantes | vacío, subiendo, error, completado | S14, S17 |
| Timeline de caso | n/a | pendiente, en revisión, presentado | S14 |
| Aviso de seguridad | Cl@ve, cifrado | n/a | S09 |

## Inferred data model

```
User          id, email, nif, nombre, teléfono, created_at
              evidence: S08, S09                      confidence: guess

Case          id, user_id, type (renta | requerimiento | rectificativa | autonomo | 720 | beckham ...),
              year, status (borrador | calculado | pagado | en_revision | presentado | cerrado),
              result_amount, savings
              evidence: home (3 pasos), S11, S13      confidence: medium

TaxData       case_id, source (clave | manual), raw_json, fetched_at
              evidence: paso "Conecta tus datos"      confidence: medium

Plan          id, code (PRO | LIVE | FULL | STANDARD | PREMIUM), price, period (year | month), features
              evidence: /precios                      confidence: high

Subscription  id, user_id, plan_id, status, renews_at, auto_renew
              evidence: /precios (cancelación, renovación feb-mar)   confidence: high

Payment       id, user_id, case_id, amount, type (plan | servicio | success_fee)
              evidence: /precios (20% del ahorro, 10 €/año)          confidence: medium

Document      id, case_id, kind (carta_hacienda | justificante | declaracion), file_url, uploaded_by
              evidence: S17                           confidence: medium

Advisor       id, name, colegiado, role
              evidence: home (300+ asesores)          confidence: guess

Message       id, case_id, from (user | luz | advisor), body, channel (app | whatsapp), at
              evidence: S15, S16                      confidence: medium

Review        case_id, advisor_id, status, approved_by_user_at
              evidence: "nada se presenta sin confirmación del usuario"  confidence: medium
```

Relationships: User 1-n Case, Case 1-1 TaxData, Case 1-n Document, Case 1-n Message, Case 1-n Payment, User 1-n Subscription, Plan 1-n Subscription, Advisor 1-n Case.

## Feature matrix

See `features.csv`.

## Out of scope (cannot or should not be cloned)

- Marca, logo, textos, testimonios y cifras de TaxDown (2M declaraciones, 4,7★, 90% de éxito): no son tuyos ni verificables.
- Acreditación de Colaborador Social de la Agencia Tributaria: la tramita tu gestoría; sin ella no se puede presentar en nombre de clientes.
- Acuerdos con bancos y brókeres: no replicables.
- IA "Luz" entrenada con +800.000 declaraciones: no hay acceso a ese dataset.
- Equipo de +300 fiscalistas colegiados: el servicio depende de profesionales.
- Contenido SEO (blog, glosario, citas previas): se redacta propio, no se copia.
- Integración con Cl@ve/AEAT: requiere habilitación y cumplimiento legal propios.
- Obligaciones legales: RGPD, LOPDGDD, registro profesional, seguro de responsabilidad civil.

## Size

Screens 19 (7 públicas, 12 de app), flows 6, entities 10. Hard parts: integración con AEAT/Cl@ve y presentación telemática, cálculo del IRPF (reglas estatales y autonómicas por año), pagos y suscripciones con comisión sobre ahorro, IA de revisión de borrador, panel de asesores. Size: XL el producto completo; L si se acota a "cálculo + revisión humana + presentación por tu equipo", sin IA ni conexión automática a AEAT.
