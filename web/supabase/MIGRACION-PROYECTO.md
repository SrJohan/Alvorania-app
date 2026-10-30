# Migración a un proyecto Supabase nuevo (cuenta de la gestoría)

Estado (2026-10-30): **migraciones aplicadas** en el proyecto nuevo `Alvorania` (`fdtatmnimdbaecxntezg`, `eu-west-3`),
de 0001 a 0010_blog, sin datos. `.env.local` ya apunta a él (URL y clave anon).
Pendiente: `SUPABASE_SERVICE_ROLE_KEY` (la pega el usuario), pasos 6, 7 y 9 de abajo, y Vercel si está desplegada.

## Origen

- Proyecto actual: `gestoria-test` (`hzmsdcrvafhegyiuemmd`), región `eu-west-3` (París), Postgres 17, cuenta personal.
- Migraciones aplicadas allí: 0001 a 0009_asesores_unidad. **No** tiene `0009_blog`.
- Datos: 2 usuarios de prueba con correos personales (uno admin, uno cliente), 1 caso, 0 archivos en storage.

## Qué cambia en el código

Nada en el código fuente. Todo el acceso a Supabase sale de variables de entorno
(`src/lib/env.ts`, `src/server/env.ts`, `src/proxy.ts`, `src/lib/supabase/server.ts`). No hay ningún id de proyecto escrito a mano.

Hay que cambiar:

1. `web/.env.local`: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`.
2. Las mismas tres variables en Vercel, si la web ya está desplegada (hay `vercel.json`).
3. Reiniciar el servidor de desarrollo (las `NEXT_PUBLIC_*` se leen al arrancar).

## Pasos

1. **Usuario**: crear el proyecto en la cuenta de la gestoría, región UE (`eu-west-3` o `eu-central-1`).
2. **Usuario**: volver a conectar el MCP de Supabase con la cuenta de la gestoría (si no, Claude no puede aplicar nada en el proyecto nuevo) y pasar las tres claves.
3. **Claude**: aplicar todas las migraciones en orden con `apply_migration`, para que queden en el historial:
   0001, 0002, 0003, 0004, 0005, 0006, 0007, 0008, 0009_asesores_unidad, 0009_blog.
   Antes, renombrar las dos `0009_*` para que no compartan número (propuesta: `0009_blog.sql` pasa a `0010_blog.sql`;
   ninguna depende de la otra). Ojo: `0009_blog` y `src/server/blog-*` son de otra sesión, confirmar antes de tocarlos.
4. **Claude**: comprobar tablas, políticas, triggers (`on_auth_user_created`), buckets (`case-documents` privado, `blog` público) y precios.
5. **Claude**: actualizar `web/.env.local` y regenerar `supabase/todo-junto.sql` si se renombra alguna migración.
6. **Usuario** (panel de Supabase, Authentication):
   - URL Configuration: Site URL `http://localhost:3000` (o el dominio real) y Redirect URL `<site>/auth/callback`.
   - SMTP propio (Resend con el dominio de la gestoría): el correo gratuito de Supabase tiene un límite muy bajo, ya dio errores 429.
   - Activar la protección contra contraseñas filtradas.
   - Plantillas de correo en español, si se personalizaron en el proyecto viejo (no se copian solas).
7. **Usuario**: registrarse en la web con el correo de la gestoría. **Claude**: subirle el rol a `admin` con SQL.
8. **Claude**: pasar los avisos de seguridad (`get_advisors`) y probar en el navegador: crear cuenta, entrar, restablecer contraseña, panel de asesor.
9. Pausar o borrar el proyecto viejo cuando todo funcione (decisión del usuario).

## Decisión pendiente: datos

Recomendado: **no migrar datos**. Solo hay datos de prueba con correos personales y 0 archivos; empezar limpio evita
arrastrar cuentas personales al proyecto de la gestoría. Las contraseñas de los usuarios no se pueden exportar
desde la API, así que migrar usuarios obligaría a usar herramientas de volcado (`pg_dump`) de todas formas.

## Riesgos

- Mientras `.env.local` apunte al proyecto viejo, la web local sigue usando la cuenta personal.
- Los enlaces de correos enviados por el proyecto viejo dejan de servir al cambiar.
- Stripe no se ve afectado (sus claves son aparte), pero `stripe_events` y `payments` empiezan vacíos.
