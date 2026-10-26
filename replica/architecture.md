# Architecture: Gestoría online propia (reconstrucción del núcleo de TaxDown)

Alcance: **L**. Cálculo de renta + revisión por tu equipo + presentación por tu gestoría + pagos y suscripciones. Fuera: IA "Luz", conexión automática Cl@ve/AEAT, B2B, SEO masivo (ver `recon.md`, "Out of scope").

## Stack

| layer | choice | why |
| --- | --- | --- |
| web | Next.js (App Router) + TypeScript, idioma es-ES | un solo repo para web pública, app de cliente y panel de asesores; server actions para escrituras |
| styling | Tailwind, tokens de `/replica-design` | |
| database | Postgres en Supabase (región UE, Frankfurt) | una sola base; datos fiscales deben quedarse en la UE por RGPD |
| ORM | Drizzle sobre `schema.sql` como primera migración | tipado sin ocultar el SQL |
| auth | Supabase Auth (email + magic link) | MFA obligatorio para asesores y admin |
| payments | Stripe Checkout + Billing + Customer Portal | planes anuales/mensuales, comisión sobre ahorro como cobro aparte; el portal cubre cancelar renovación (S19) |
| email | Resend (dominio propio con SPF/DKIM/DMARC) | transaccional; sin marketing sin consentimiento |
| jobs | Inngest (o Vercel Cron) | recordatorios, reintentos de webhooks, borrado RGPD diferido |
| files | Supabase Storage, bucket privado, URLs firmadas de 60 s | cartas y justificantes son datos sensibles |
| hosting | Vercel (functions en `fra1`) + Supabase | cero operaciones |
| observabilidad | Sentry + log de auditoría propio (`audit_log`) | |

Cálculo del IRPF: **librería propia en TypeScript pura**, determinista, que lee `tax_rules` (por ejercicio y territorio) y guarda en `calculations` el snapshot de reglas usado. Sin LLM en el camino del cálculo.

## Schema

Tablas: **18** (profiles, consents, plans, services, tax_rules, cases, questionnaire_answers, tax_data, calculations, documents, messages, reviews, subscriptions, payments, stripe_events, notifications, audit_log, advisor_slots), más `auth.users` de Supabase. SQL completo en `replica/schema.sql`.

Access rules: **Postgres RLS en todas las tablas** (defensa en profundidad) + comprobación de rol en cada server action. Cliente ve lo suyo; asesor ve solo casos asignados; admin ve todo; `stripe_events`, `audit_log` y escrituras de pagos solo por service role.

Restricciones duras (en base de datos, no en UI):
- Un caso vivo por usuario/tipo/año (índice único parcial) contra doble clic.
- Trigger `guard_case_submission`: un caso no pasa a `presentado` sin aprobación del asesor **y** del usuario, y sin `aeat_reference`.
- `reviews.approval_order`: el usuario no puede aprobar antes que el asesor.
- `advisor_slots`: exclusión GiST, dos reservas del mismo hueco son imposibles.
- `stripe_events.id` como PK: un webhook repetido no se procesa dos veces.

## API

Server actions / route handlers. Rol: C = cliente dueño del caso, A = asesor asignado, Ad = admin, P = público.

| method path | does | who | input | output | flow |
| --- | --- | --- | --- | --- | --- |
| GET `/`, `/precios`, `/tramites`, `/servicios/[slug]` | páginas públicas (SSG) | P | | HTML | F01-F05 |
| POST `/auth/signup`, `/auth/login` | registro / acceso (Supabase) | P | email | sesión | F01 |
| POST `/api/consents` | registra consentimiento versionado | C | kind, version, granted | consent | F01 |
| POST `/api/cases` | crea caso (renta/rectificativa/autónomo/…) | C | case_type, tax_year | case | F01, F03 |
| PUT `/api/cases/:id/questionnaire` | guarda respuestas parciales | C | answers | answers | F01 |
| PUT `/api/cases/:id/tax-data` | datos fiscales manuales o subida del fichero de datos fiscales | C | raw_json / archivo | tax_data | F01 |
| POST `/api/cases/:id/calculate` | ejecuta el motor y guarda `calculations` (gratis, sin tarjeta) | C | – | resultado, deducciones, ahorro | F01 |
| POST `/api/cases/:id/checkout` | crea Stripe Checkout (plan o servicio) | C | plan_code / service_code | url de Stripe | F01-F05 |
| POST `/api/cases/:id/documents` | URL de subida firmada + registro | C, A | kind, mime, size | signed upload url | F02, F03 |
| GET `/api/documents/:id/url` | URL firmada de descarga (audita acceso) | C, A | – | url 60 s | F02 |
| POST/GET `/api/cases/:id/messages` | hilo de mensajes | C, A | body | messages | F06 |
| POST `/api/cases/:id/review/start` | asigna asesor, abre revisión | A, Ad | advisor_id | review | F01 |
| POST `/api/cases/:id/review/request-changes` | pide cambios al cliente | A | notes | review | F01 |
| POST `/api/cases/:id/review/advisor-approve` | aprueba la declaración | A | – | review | F01 |
| POST `/api/cases/:id/review/user-approve` | aprobación explícita; guarda IP y hora | C | – | review | F01 |
| POST `/api/cases/:id/submit` | marca presentado con justificante AEAT (la presentación se hace en la sede por el colaborador social) | A | aeat_reference, pdf | case | F01 |
| POST `/api/cases/:id/requerimiento/draft` | borrador de respuesta a requerimiento | A | texto | documento | F02 |
| POST `/api/billing/portal` | Stripe Customer Portal (cancelar renovación) | C | – | url | S19 |
| GET `/api/admin/cases` | cola de casos por estado | A, Ad | filtros | lista | panel |
| PUT `/api/admin/tax-rules` | alta/revisión de reglas del ejercicio | Ad | rule | rule | campaña |
| POST `/api/me/export`, `/api/me/delete` | portabilidad y supresión RGPD | C | – | zip / confirmación | legal |

Webhooks in: Stripe (`checkout.session.completed`, `invoice.paid`, `invoice.payment_failed`, `customer.subscription.updated|deleted`, `charge.refunded`), verificados con firma y registrados en `stripe_events` antes de procesar. WhatsApp Business API (mensajes entrantes → `messages`), solo si se contrata.
Webhooks out: ninguno en v1.

Jobs:
- `renewal-reminder`: diario 09:00 Europe/Madrid; avisa 15 días antes de `renews_at` (obligación de informar de la renovación).
- `case-nudges`: diario; casos en `calculado` sin pagar >3 días, `pendiente_aprobacion` >2 días.
- `campaign-deadlines`: avisa del fin del plazo de renta (fecha configurable por ejercicio).
- `outbox-notifications`: cada minuto; envía `notifications` con `sent_at is null`, con reintentos.
- `gdpr-purge`: diario; borra datos de perfiles con `deleted_at` > 30 días salvo lo que obligue a conservar la ley (facturas y casos presentados, bloqueados y minimizados).
- `stripe-reconcile`: nocturno; compara pagos locales con Stripe.

Solo APIs oficiales y públicas, con claves propias. **Nunca** endpoints privados de TaxDown.

## Los tres puntos de integración con la AEAT (decisión de alcance)

1. **v1: presentación manual por tu equipo** en la sede electrónica con tu certificado de colaborador social. La app guarda el justificante (`aeat_reference` + PDF).
2. **Datos fiscales**: el cliente sube el fichero de datos fiscales que descarga él mismo, o los introduce a mano. Sin Cl@ve en v1.
3. **v2 (opcional)**: servicios web de la AEAT para colaboradores sociales. Requiere habilitación, certificado y revisión jurídica antes de tocar código.

## The parts that bite

- **Reglas del IRPF**: cambian cada campaña y cada comunidad tiene sus deducciones. Reglas como datos versionados (`tax_rules`), cada una con `source_url` y revisor. Tests de regresión con casos reales anonimizados contra el simulador oficial de la AEAT. Mayor riesgo del proyecto.
- **Régimen foral (País Vasco, Navarra)**: otro sistema fiscal. `regime` marcado en el caso y, en v1, derivar siempre a un asesor sin cálculo automático.
- **Responsabilidad profesional**: una declaración mal calculada es responsabilidad de tu gestoría. Revisión humana obligatoria (la BD lo impone), seguro de RC, y mandato firmado (`consents.mandate_presentacion`) antes de presentar.
- **RGPD / LOPDGDD**: datos de categoría fiscal sensible. Cifrado en reposo (columnas `nif` y `raw_json` con Vault o cifrado en aplicación), región UE, `audit_log` de cada acceso del staff, contrato de encargado con Supabase/Stripe/Resend, registro de actividades de tratamiento, delegado si procede. Supresión: conservar lo exigido por ley (facturación 6 años, declaraciones según prescripción de 4 años), borrar el resto.
- **time zones**: todo `timestamptz` en UTC; fechas límite de campaña y jobs en `Europe/Madrid`, con el horario de verano resuelto por la librería de fechas, no con restas de horas. El ejercicio fiscal es un entero, nunca una fecha.
- **idempotency**: Stripe repite webhooks. Se inserta `stripe_events` primero (PK = event id); si ya existe, se responde 200 sin hacer nada. Crear caso, checkout y aprobación llevan clave de idempotencia.
- **races**: doble clic al crear caso (índice único parcial), dos asesores tomando el mismo caso (`update … where advisor_id is null returning`), dos reservas del mismo hueco (exclusión GiST).
- **dinero**: céntimos enteros + moneda. El 20% del ahorro (`success_fee_bps`) se calcula solo sobre el ahorro confirmado tras recuperar dinero, nunca sobre la estimación. Redondeo definido (hacia abajo al céntimo) y factura con numeración correlativa.
- **rate limits**: limitar login, cálculo y subida de archivos por IP y usuario (Upstash o tabla).
- **file limits**: 20 MB por archivo, solo PDF/JPG/PNG, antivirus en el worker (ClamAV o servicio gestionado), bucket privado.
- **seguridad de roles**: el rol no se edita desde el cliente (política `profiles_update_self`); MFA para staff; el service role nunca llega al navegador.
- **email deliverability**: SPF, DKIM, DMARC desde el día uno; dominio de envío separado del de marketing.
- **offline / realtime**: no necesarios en v1. El panel del caso se refresca con polling o Supabase Realtime en `messages` y `cases.status` (barato).
- **multi-tenancy**: una sola gestoría, sin `org_id`. Si luego se vende a otras gestorías, añadir `org_id` antes de tener datos.
- **búsqueda**: el staff busca casos por NIF/nombre/email; índice trigram sobre `profiles` cuando haga falta. NIF cifrado → guardar también hash para búsqueda exacta.

## Build order

1. **Vertical slice** (renta, camino feliz, feo pero entero):
   - Pantallas: S01 (home mínima), S08, S10, S11, S12, S13, S14.
   - Tablas: profiles, consents, plans, cases, questionnaire_answers, tax_data, calculations, reviews, payments, stripe_events, tax_rules (solo estatal + una comunidad, un ejercicio).
   - Rutas: signup/login, cases, questionnaire, tax-data, calculate, checkout, webhook Stripe, review/advisor-approve, review/user-approve, submit.
   - Prueba que valen el motor de cálculo, el pago y la regla "no se presenta sin dos aprobaciones".
2. **Must-haves** (`features.csv`), por área:
   - marketing: S01 completa, S02, S03 con precios reales.
   - onboarding: aviso de seguridad y cifrado (S09 adaptada: subida de datos fiscales en vez de Cl@ve).
   - renta: optimización con deducciones, motor para todas las comunidades de régimen común, cálculo gratuito sin tarjeta.
   - pagos: planes PRO/LIVE/FULL con Stripe Billing.
   - seguimiento: S14 con timeline.
   - legal: mandato y consentimientos, textos RGPD, mandato firmado.
3. **Should-haves**:
   - notificaciones y jobs (recordatorios, outbox).
   - requerimientos: S17, borrador de respuesta, precios por tipo (F02).
   - rectificativa 4 años y fuera de plazo (F03).
   - chat con asesor, WhatsApp para LIVE/FULL (S16).
   - autónomos: suscripción STANDARD/PREMIUM, modelos 130/303, alta (F04).
   - S19 vía Stripe Customer Portal.
4. **Could-haves**: trámites internacionales (S18), ayudas, pack familias, contenido SEO propio, página de empresas. Sin IA y sin acuerdos con bancos (skip en `features.csv`).
5. **Fixes de `/replica-entrepreneur`**: se añaden cuando exista el análisis de reseñas.

## Pendientes antes de escribir código

- Decidir si la gestoría ya tiene (o tramita) la acreditación de Colaborador Social AEAT: sin ella no se puede presentar en nombre de clientes.
- Contratar seguro de responsabilidad civil y redactar los textos legales con un abogado.
- Elegir ejercicio y comunidades de la primera campaña (recomendado: un ejercicio, 1-3 comunidades).
