# Backend

Código en `web/`. El modo lo decide `NEXT_PUBLIC_DATA_MODE`: `demo` (datos falsos en el navegador, sin claves) o `live` (Supabase + Stripe + Resend). Las pantallas no cambian entre uno y otro: `src/lib/data/api.ts` elige la implementación.

## Qué hay escrito

| pieza | dónde | estado |
| --- | --- | --- |
| Migraciones | `web/supabase/migrations/0001_init.sql` a `0004_ops.sql` | **probadas** en Postgres en memoria |
| Catálogo (planes, servicios, reglas IRPF 2025 de demostración) | `0002_catalog.sql` | probado que coincide con el motor |
| Bucket privado de documentos y sus políticas | `0003_storage.sql` | **sin probar** (necesita Supabase real) |
| Límite de uso, asignación de asesor, reintentos | `0004_ops.sql` | probado |
| Auth por enlace mágico, sesión en cookies `httpOnly`, proxy | `src/proxy.ts`, `src/lib/supabase/`, `src/app/auth/callback` | **sin probar** contra Supabase real |
| Acciones de servidor (caso, cálculo, pago, mensajes, subida, aprobación, asesor, RGPD) | `src/server/actions.ts` | validadas con tipos y zod; **sin probar** contra servicios reales |
| Webhook de Stripe con firma e idempotencia | `src/app/api/stripe/webhook`, `src/server/billing/` | lógica **probada** (8 tests); firma y repositorio sin probar |
| Correo transaccional | `src/server/email.ts` | plantillas probadas (escape HTML); envío sin probar |
| Jobs (outbox, renovación, recordatorios, borrado RGPD) | `src/server/jobs.ts`, `src/app/api/jobs/[job]`, `vercel.json` | **sin probar** |
| Panel de asesor mínimo | `/asesor` | **sin probar** |
| Exportar y borrar mis datos | pantalla Suscripción | **sin probar** |

Pruebas: `npm test` (45 pruebas) y `npm run test:db`.

## Lo que tienes que hacer tú (yo no creo cuentas ni claves)

1. **Supabase**: crea un proyecto en una región de la UE. Aplica las migraciones en orden (`supabase db push` con la CLI, o pegando cada `.sql` en el editor SQL). Copia URL, clave anónima y `service_role` a `.env.local`.
2. En Supabase, **Authentication → URL Configuration**: añade `http://localhost:3000/auth/callback` y, en producción, tu dominio. **Authentication → SMTP**: usa Resend como SMTP propio; el SMTP por defecto de Supabase tiene un límite muy bajo y no sirve para producción.
3. **Primer admin y asesores**: regístrate con tu correo y, en el editor SQL, `update profiles set role = 'admin' where email = '...';`. Haz lo mismo con `'advisor'` para cada asesor (y rellena `colegiado_no`).
4. **Stripe (modo test)**: crea tres productos con precio anual recurrente (Esencial, Acompañado, Completo) y copia los `price_...` a `STRIPE_PRICE_*`. En local: `stripe listen --forward-to localhost:3000/api/stripe/webhook` y copia el `whsec_...`. Activa el Customer Portal en el panel de Stripe.
5. **Resend**: verifica tu dominio (SPF, DKIM, DMARC) y copia la clave.
6. `CRON_SECRET`: una cadena aleatoria de más de 24 caracteres. En Vercel, añádela como variable; Vercel Cron la envía como `Bearer`.
7. Pon `NEXT_PUBLIC_DATA_MODE=live` y arranca.
8. **Backups**: activa las copias diarias de Supabase (en los planes de pago incluyen restauración a un punto en el tiempo) y comprueba que funcionan antes de tener clientes.

## Decisiones que conviene conocer

- **Reglas fiscales**: las filas de `tax_rules` se cargan con `reviewed_at` nulo. En producción pon `REQUIRE_REVIEWED_TAX_RULES=true`: el cálculo se niega a usar reglas que un fiscalista no ha firmado. Debe revisarlas una persona antes de abrir al público.
- **Sin Cl@ve ni conexión con la AEAT**: el cliente sube su fichero de datos fiscales o introduce los datos; la presentación la hace tu equipo en la sede electrónica con el certificado de colaborador social y registra el justificante en `/asesor`. La integración con los servicios web de la AEAT requiere habilitación propia y revisión jurídica.
- **Aprobaciones**: aunque el código falle, la base de datos impide pasar a "presentado" sin la aprobación del asesor, la del cliente y el justificante (trigger probado).
- **Mensajes de error**: las acciones devuelven `{ok, error}` en lugar de lanzar, porque Next oculta el mensaje de las excepciones en producción.
- **Borrado de cuenta**: se pide en la pantalla, la suscripción se cancela al momento y a los 30 días el job borra documentos, mensajes y cuestionarios. Si hay facturas o declaraciones presentadas, el perfil se anonimiza y el acceso se bloquea (la ley obliga a conservarlas); si no, se borra el usuario entero.
- **Facturas**: numeración correlativa sin huecos por año (`next_invoice_number`, probada). Falta generar el PDF de la factura y revisar los datos fiscales del emisor con tu gestor.
- **Chat**: solo los planes con `features.chat` pueden escribir; no hay tiempo real, se actualiza al recargar o tras cada acción.
- **Zona horaria**: todo en UTC; los jobs corren a las 08:00 UTC (09:00 o 10:00 en Madrid según la estación). Se muestra siempre en `Europe/Madrid`.

## Integraciones

| integración | API oficial | permisos | revisión del proveedor | estado |
| --- | --- | --- | --- | --- |
| Supabase Auth, DB, Storage | sí | n/a | no | escrito |
| Stripe Checkout, Billing, Portal | sí | claves propias | activar cuenta para modo live (datos del negocio) | escrito, solo modo test |
| Resend | sí | clave propia | verificar dominio | escrito |
| WhatsApp Business | Meta Cloud API | número verificado | revisión de plantillas de Meta, días o semanas | **no empezado** |
| Google (OAuth, Calendar) | no se usa | n/a | no aplica, evita la verificación de Google | no necesario |
| AEAT (servicios web de colaborador) | oficial | certificado y habilitación | trámite con la Agencia Tributaria | **no empezado**, ver decisión arriba |

## Lista de seguridad

- [x] secretos solo en variables de entorno, `.env*` ignorado salvo `.env.example`, y los secretos no llegan al navegador (el módulo `server/env` usa `server-only` y se comprobó que ningún archivo del cliente contiene sus nombres)
- [x] entradas validadas en el servidor con zod en cada acción (comunidades, importes, tamaños y tipos de archivo, nombres de archivo)
- [~] permisos en cada lectura y escritura: **comprobado en base de datos** con dos clientes, un asesor ajeno y un admin (RLS, 26 pruebas, incluida una mutación que desactiva RLS y hace fallar siete); la capa de acciones (`requireCaseAccess`) está escrita pero no probada con datos reales
- [x] límites de uso en acceso, cálculo, pago, mensajes, subida y exportación (se guarda un hash del email, no el email)
- [x] webhooks verifican firma sobre el cuerpo exacto
- [x] subidas con límite de 20 MB y tipos PDF/JPG/PNG en el servidor y en el bucket, bucket privado con URL firmada
- [x] sin datos personales en URLs; los logs solo llevan ids de evento y mensajes de error
- [x] `npm audit`: 0 vulnerabilidades
- [x] sesiones en cookies `httpOnly`, `sameSite=lax` y `secure` en producción; cerrar sesión cierra en todos los dispositivos
- [ ] política de privacidad que liste a cada encargado: Supabase, Stripe, Resend, Vercel (y WhatsApp/Meta si se añade). Redáctala con un abogado.
- [ ] contratos de encargado de tratamiento firmados con cada uno
- [ ] copias de seguridad activadas y probadas
- [ ] prueba de punta a punta con claves reales en modo test

## Pendiente

- Probar todo con claves reales: registro por enlace, pago con tarjeta de prueba `4242 4242 4242 4242`, webhook, correo, subida, aprobación, jobs, borrado.
- Probar `0003_storage.sql` y las acciones contra un Supabase real (hay que escribir una prueba de integración con dos usuarios).
- Pedir cambios al cliente desde el panel de asesor (el estado `cambios_pedidos` existe en la base de datos, falta la pantalla).
- Régimen foral: sigue sin ruta de contacto con un asesor.
- Generar la factura en PDF y enviarla.
- Estados de pago fallido y reintentos visibles para el cliente (hoy solo se marca `past_due`).
