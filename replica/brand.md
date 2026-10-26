# Marca: Alvorania

La marca la trajo el usuario ya hecha, en su maqueta `alvorania_home_visual_v5_alianzas` (HTML del 26-10-2026). Este documento recoge lo que se pasó a la app, lo que falta comprobar y lo que falta producir. No se generaron nombres alternativos.

## 1. Nombre

**Alvorania**. Se escribe en minúsculas en el logotipo (`alvorania`) y con mayúscula inicial en el texto.

- No se parece al original ni en el sonido, ni en la forma, ni en el significado. No hace juego de palabras con él.
- Es corto y se escribe tal como suena. Recuerda a "alborada" (empezar el día), lo que encaja con el ángulo de `fixes.md`: un asesor con nombre que te acompaña desde el principio.

### Comprobaciones

Son comprobaciones previas, no una autorización legal. Antes de gastar dinero en el nombre, conviene que un abogado de marcas haga una búsqueda completa.

| comprobación | dónde | resultado |
| --- | --- | --- |
| Marca en España | OEPM, localizador de marcas (clases 35, 36 y 45; 9 y 42 si hay app) | **pendiente** |
| Marca en la UE | EUIPO eSearch o TMview | **pendiente** |
| Global | WIPO Global Brand Database | **pendiente** |
| alvorania.com | DNS | **tiene dueño**: responde con servidores de IONOS (ui-dns), comprobado el 26-10-2026. Hay que saber de quién es: si es tuyo, perfecto. Si no, mira el whois. |
| alvorania.es | DNS | sin DNS el 26-10-2026. Eso **no** significa que esté libre: confírmalo en dominios.es o en un registrador. |
| alvorania.app | DNS | sin DNS el 26-10-2026. Lo mismo: confírmalo en un registrador. |
| App Store y Google Play | buscar el nombre exacto | **pendiente** |
| Redes | Instagram, TikTok, X, LinkedIn, GitHub | **pendiente** |
| La web | buscar "alvorania gestoría" y "alvorania" | **pendiente** |

## 2. Paleta

Colores sacados de la maqueta. El morado de Alvorania (`#5631b5`, tono de unos 258°) es claramente distinto del azul pervinca del original (`#5974d4`, unos 227°). Los colores del original están en `brand.json` para que el barrido avise si alguno vuelve a aparecer.

| rol | valor | de dónde sale en la maqueta |
| --- | --- | --- |
| text | `#211350` | `--ink` |
| text-muted | `#625a78` | `--muted` |
| accent (botones, enlaces) | `#5631b5` | `--violet` |
| accent-hover | `#43238f` | oscurecido del violeta |
| focus-ring | `#744be6` | `--bright` |
| accent-soft / on-accent-soft | `#f1eafd` / `#48239a` | etiquetas y chips |
| bg / surface | `#ffffff` / `#fbf9ff` | fondo y secciones suaves |
| border | `#ede6f8` | `--line` |
| ink (bloques oscuros, pie) | `#211035` | pie de la maqueta |
| highlight | `#f4b6a3` | `--peach` |
| logotipo (texto) | `#39177d` | `.brand span` |

Comprobado con `node replica/design/contrast.mjs replica/design/tokens.json`: 29 combinaciones y **0 fallos AA**.

Tipografía: la maqueta usa la letra del sistema (`system-ui`), con titulares en peso 800 y letras muy juntas. La app deja de cargar Figtree y Sora: carga más rápido y no depende de Google Fonts. Los botones pasan a ser redondeados del todo, en forma de píldora, como en la maqueta.

## 3. Logo

Ya existe: una **A** con degradado del morado oscuro `#351279` al lila `#8466d6`, cruzada por un trazo curvo lila `#8d73d3`, junto al nombre `alvorania` en negrita y con las letras muy juntas.

- En la app: `web/src/components/site/logo.tsx` (`Logo` y `LogoMark`) y como favicon SVG en `web/src/app/icon.svg`.
- No se parece al logo del original: no comparte forma, ni pareja de colores, ni ningún truco de letra.

Falta producir (tú o un diseñador, a partir del SVG):

- [ ] Comprobar el símbolo a 16 px. El trazo curvo puede empastarse; si pasa, hacer una versión para favicon solo con la A.
- [ ] Icono de app de 1024×1024 sin transparencia, para iOS.
- [ ] Juego de favicons en PNG (32, 180 apple-touch y 512).
- [ ] Imagen para redes de 1200×630 (Open Graph).
- [ ] Versión en blanco del logo, para fondos oscuros.

## 4. Voz

Basada en el tono de la maqueta ("Tu renta, sin complicaciones").

**Tres palabras:**

- **Clara**: sin jerga fiscal si no hace falta. No significa simplona: el dato exacto sigue ahí.
- **Cercana**: tuteo y frases cortas. No significa colega: nada de emojis en avisos importantes.
- **Profesional**: cada promesa la respalda un asesor con nombre. No significa fría.

| sí | no |
| --- | --- |
| "Te sale a devolver 312,40 €." | "¡Buenas noticias! 🎉 Hacienda te debe dinero." |
| "Lo revisa Laura, tu asesora." | "Nuestro equipo de expertos revisará tu caso." |
| "Precio cerrado: 59 €. No hay suplementos." | "Desde 29 €*" |
| "Nos falta tu certificado de retenciones." | "Error: documentación incompleta." |
| "Nada se presenta sin tu visto bueno." | "Al continuar aceptas la presentación." |

**Los textos más vistos de la app ya siguen esta voz:** "Empieza gratis", "Que lo revise un asesor", "Precio cerrado", "Nada se presenta sin tu confirmación", "Tu asesor: {nombre}". Se mantienen. Lo que cambia es la firma: el título de la web pasa a ser "Alvorania · Tu renta, sin complicaciones", y los correos van firmados por Alvorania, con el logotipo en texto y el botón morado en píldora.

## 5. Barrido

```bash
node replica/tools/sweep.mjs . --config replica/brand.json
```

Resultado del 26-10-2026: **limpio**. También se quitaron "Tu Gestoría" (el nombre provisional) y los restos del original en el README y en un comentario SQL.

Revisado a ojo: favicon, título de la pestaña, cabecera, pie, cabecera del panel y plantilla de correo. Pendientes porque aún no existen: la imagen para redes y el icono de app.

## Para el usuario

- En Supabase, Authentication → Emails: cambia el remitente y el texto del correo de acceso (magic link) para que diga Alvorania. Ese correo no lo envía la app.
- Antes de lanzar: decide qué haces con alvorania.com (ver la tabla de arriba).

Siguiente paso: `/replica-launch`.
