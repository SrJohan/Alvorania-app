# Blog propio con panel de escritura

Fecha: 2026-10-30
Estado: diseño aprobado en conversación, pendiente de revisión del spec

## Objetivo

Sustituir la pestaña «Artículos», que hoy muestra el RSS de Gestoría eMadrid, por un blog propio de Alvorania. Andrés (el jefe, no técnico) escribe y publica desde un panel web, sin tocar código ni desplegar. Los asesores pueden escribir borradores que Andrés revisa y publica. Todos los posts mantienen el estilo de la web; el estilo se elige entre presets cerrados, de forma global o por post.

## Alcance

Incluido:

- Tablas, permisos e imágenes en Supabase (migración `0010_blog.sql`).
- Panel en `/asesor/blog` con editor visual Tiptap y flujo borrador → revisión → publicado.
- Páginas públicas `/blog` y `/blog/[slug]`, redirección de `/articulos`.
- Estilos predefinidos: uno global y otro opcional por post.
- Modo demo (`demo-api`) y modo real (`live-api`).
- Guía de uso para Andrés.
- Eliminación de todo lo relacionado con Gestoría eMadrid.

Fuera de alcance (se puede añadir más tarde): comentarios de lectores, publicación programada, etiquetas libres, avisos por correo, historial de versiones, sitemap (hoy no existe en el proyecto).

## 1. Datos y permisos

### `blog_posts`

| Columna | Tipo | Notas |
|---|---|---|
| `id` | uuid pk | |
| `slug` | text unique not null | generado del título, editable |
| `title` | text not null | |
| `excerpt` | text not null default '' | resumen para listado y metadatos |
| `body_html` | text not null default '' | HTML ya limpiado |
| `cover_path` | text null | ruta en el bucket `blog` |
| `category` | text not null | check in (`renta`, `autonomos`, `empresas`, `tramites`) |
| `style` | text null | null = global; si no, uno de los presets |
| `status` | text not null default `borrador` | check in (`borrador`, `en_revision`, `publicado`) |
| `review_note` | text null | nota de Andrés al devolver un post |
| `author_id` | uuid not null | references `profiles(id)` |
| `published_at` | timestamptz null | se fija al publicar por primera vez |
| `created_at`, `updated_at` | timestamptz | `updated_at` con el trigger existente `touch_updated_at()` |

Índice en `(status, published_at desc)` y en `category`.

### `blog_settings`

Una sola fila (`id boolean primary key default true check (id)`), con `style text not null` y `updated_at`.

### Presets de estilo

Lista cerrada en código y en un check de la base de datos: `clasico`, `tinta`, `calido`, `destacado`. Cada preset es un conjunto de clases o variables CSS construidas solo con los tokens de `globals.css` (`--color-accent`, `--color-ink`, `--color-highlight`, `--font-display`, etc.). Cada combinación de texto y fondo cumple contraste WCAG AA.

### RLS

Se reutilizan `is_staff()` e `is_admin()` de `0001_init.sql`.

- `anon` y `authenticated`: `select` de `blog_posts` donde `status = 'publicado'`; `select` de `blog_settings`.
- Staff no admin (asesor):
  - `select` de sus propios posts en cualquier estado.
  - `insert` con `author_id = auth.uid()`, `status = 'borrador'` y `style` nulo.
  - `update` de sus propios posts solo mientras están en `borrador`.
- Admin: `select`, `insert`, `update` y `delete` de todo; `update` de `blog_settings`.

### Trigger `guard_blog_post_update`

Mismo patrón que `guard_profile_update()`. Si quien edita no es admin (y no es service role):

- La única transición de estado permitida es `borrador` → `en_revision`.
- No puede cambiar `style`, `author_id`, `published_at` ni `review_note`.

Para el admin: al pasar a `publicado` fija `published_at` si estaba vacío. Al devolver a `borrador` puede escribir `review_note`; al enviar de nuevo a revisión se conserva hasta que el admin la borre o publique (al publicar se vacía).

### Imágenes

Bucket público `blog` en Supabase Storage. Subir: `is_staff()`. Borrar: `is_admin()`. Tipos JPG, PNG y WebP, máximo 5 MB, validado en la política y en el servidor.

### Limpieza del HTML

`body_html` se sanea en el servidor al guardar y otra vez al mostrar, con una lista blanca: `h2`, `h3`, `p`, `strong`, `em`, `ul`, `ol`, `li`, `a[href]` (solo `http`, `https`, `mailto` y rutas internas; con `rel="noopener noreferrer"` en externos), `blockquote`, `img[src,alt]` (solo URLs del bucket `blog`), `br` y el contenedor de la caja destacada (`aside[data-callout]`). Se eliminan scripts, `style`, `class` ajenas y atributos `on*`. La librería de saneamiento se elige y verifica en el plan.

## 2. Panel de escritura

Dentro del grupo `(asesor)`, protegido con `requireStaff()` de `src/server/authz.ts`. Acciones del servidor nuevas en `src/server/blog-actions.ts`, siguiendo el estilo de `advisor-actions.ts` (comprobar rol, `AppError` con mensajes en castellano).

### `/asesor/blog`

- Pestañas «Mis borradores», «En revisión», «Publicados»; Andrés ve además «Todos» y un contador en «En revisión».
- Fila: título, categoría, autor, estado, fecha. Botón «Nuevo post».
- Solo admin: bloque «Estilo del blog» con miniaturas de los presets; al elegir uno se guarda en `blog_settings`.

### `/asesor/blog/[id]`

- Campos: título, resumen, categoría, portada (arrastrar o elegir), slug editable.
- Editor Tiptap con barra limitada: títulos (h2, h3), negrita, cursiva, listas, enlace, cita, imagen, caja destacada. Sin color, fuente ni tamaño. Al pegar se descarta el formato de origen y se conserva la estructura.
- «Vista previa» renderiza el post con el mismo componente que la página pública y el estilo efectivo.
- Autoguardado con aviso «Guardado»; si falla la red se avisa y el texto se conserva en el editor hasta que el guardado funcione.

### Botones por rol y estado

- Asesor, `borrador`: «Guardar», «Enviar a revisión». Si hay `review_note`, se muestra arriba. En `en_revision` o `publicado`, solo lectura.
- Admin:
  - `en_revision`: edición libre, «Publicar», «Devolver al autor con nota».
  - `publicado`: «Despublicar» (vuelve a `borrador`); las ediciones se ven en la web al guardar.
  - Siempre: selector «Estilo de este post» (Global, Clásico, Tinta, Cálido, Destacado) y «Borrar» con confirmación.

### Datos

Nuevas operaciones en la capa `src/lib/data` (`api.ts`, `demo-api.ts`, `live-api.ts`, `types.ts`). En demo, unos posts de ejemplo en memoria y un usuario asesor y otro admin para probar el flujo.

## 3. Páginas públicas

### `/blog`

- Arriba, el último post publicado con estilo `destacado`; si no hay, el más reciente.
- Cuadrícula: portada, categoría, título, resumen, fecha. Filtro por categoría con parámetro de búsqueda (`?categoria=renta`).
- Sin posts: mensaje «Pronto publicaremos las primeras guías».

### `/blog/[slug]`

- Post con el estilo efectivo (`post.style ?? settings.style`).
- Bloque final hacia el servicio de la categoría: `renta` y `autonomos` → `/precios`, `empresas` → `/empresas`, `tramites` → `/tramites`.
- `generateMetadata` con título, resumen e imagen de portada (Open Graph).
- Slug inexistente o no publicado: 404.
- Al publicar, editar o despublicar se revalidan `/blog` y `/blog/[slug]` (`revalidatePath`), sin despliegue.

### Redirección y menú

- `/articulos` → `/blog` con redirección permanente (en `next.config` o con una página que llame a `permanentRedirect`).
- En `src/components/site/header.tsx`, «Artículos» pasa a «Blog» con `href="/blog"` en ambos enlaces (líneas 12 y 149).

### Eliminado

`src/lib/articles.ts`, `src/lib/articles.test.ts`, `src/app/(marketing)/articulos/page.tsx`, `e2e/articulos.spec.ts`. Tras el cambio, buscar `emadrid` en el repositorio no debe dar resultados en código.

## 4. Guía para Andrés

Documento corto en castellano llano, con capturas reales del panel terminado, apto para compartir o imprimir. Sin pasos de código ni de despliegue. Contenido:

1. Cómo entrar al panel.
2. Crear un post: título, resumen, categoría, portada.
3. Escribir: títulos, listas, enlaces, fotos y caja destacada.
4. Revisar borradores de asesores: publicar o devolver con nota.
5. Cambiar el estilo de un post y el de todo el blog.
6. Despublicar y borrar.

Se escribe al final de la implementación y se actualiza cuando cambie el panel.

## 5. Pruebas

- Unitarias (Vitest, como el resto del proyecto):
  - Saneamiento: elimina `script`, `style`, `on*`, `javascript:` e imágenes de otros dominios; conserva el formato permitido y la caja destacada.
  - Generación de slug: acentos, eñes, espacios, duplicados.
  - Estilo efectivo: post con estilo, post sin estilo, valor desconocido.
- Base de datos (SQL contra Supabase local o rama): asesor no puede publicar, cambiar estilo ni editar posts ajenos o en revisión; anónimo no ve borradores; solo admin cambia `blog_settings`.
- e2e (Playwright, modo demo):
  - Asesor crea un borrador y lo envía a revisión.
  - Admin lo publica y aparece en `/blog` y en `/blog/[slug]`.
  - Admin cambia el estilo global y el post lo refleja.
  - `/articulos` redirige a `/blog`.

## Decisiones tomadas

- Supabase con panel, no ficheros en el repo: Andrés no debe tocar código ni desplegar.
- Tiptap frente a editor Markdown o Lexical: visual, maduro, extensible para la caja destacada y las imágenes.
- Presets cerrados frente a colores libres: garantiza coherencia y contraste.
- Asesores escriben, solo el admin publica.

## Pendiente de verificar en el plan

- Versiones exactas de Tiptap y sus extensiones compatibles con React y Next 16.4.
- Librería de saneamiento de HTML en servidor.
- Cómo encaja el panel de asesor actual (`/asesor`) con nuevas subrutas y navegación.
