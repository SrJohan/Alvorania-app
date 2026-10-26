# Componentes: gestoría online propia

Fuente: lista de componentes de `recon.md`. Todos escritos desde cero. Iconos: **Lucide** (MIT). Fuente: **Inter** (OFL). Ilustraciones: propias o encargadas; no se calca nada de TaxDown. Textos: se redactan nuevos (los de ejemplo de aquí son orientativos).

Reglas comunes
- Solo tokens (`bg-surface`, `text-text-muted`); nunca hex.
- Foco: `outline 2px focus-ring`, offset 2px, siempre visible con teclado.
- Objetivo táctil mínimo 44x44 px en móvil.
- Todo estado de carga conserva el nombre accesible; los cambios de estado se anuncian con `aria-live="polite"`.
- Idioma `es-ES`; importes con `Intl.NumberFormat('es-ES', {style:'currency', currency:'EUR'})`; fechas con `Intl.DateTimeFormat` en `Europe/Madrid`.
- Estado nunca solo por color: icono + texto.
- Base accesible: shadcn/ui sobre Radix.

Escala: espacio 0/4/8/12/16/24/32/48/64 · texto xs12 sm14 base16 lg20 xl28 display40 · radio sm6 md10 lg16 pill · ancho de contenido 1120, lectura 680, barra lateral 256, cabecera 64.

---

Button
  variants  primary, secondary, ghost, danger
  sizes     sm 32px, md 40px, lg 48px
  states    default, hover, active, focus-visible, disabled, loading
  tokens    primary: bg accent, hover accent-hover, text on-accent · secondary: borde border-input, texto text · danger: bg danger · radius md · texto sm/600
  a11y      `<button>` real (o `<a>` si navega); disabled con `aria-disabled` y motivo en texto cercano; loading con spinner y `aria-busy`, conserva la etiqueta
  used on   todas (S01, S03, S12, S13)

Card de situación (SituationCard)
  variants  con icono, con icono y descripción
  states    default, hover, focus-visible, seleccionada (`aria-pressed`)
  tokens    bg surface-raised, borde border, shadow card, radius lg; seleccionada: borde accent 2px + bg accent-soft
  a11y      grupo `role="radiogroup"` si es de elección única; flechas para moverse; icono decorativo `aria-hidden`
  used on   S02

Card de plan (PlanCard)
  variants  estándar, recomendada (etiqueta "Recomendado" con texto, no solo color)
  states    default, hover, seleccionada, no disponible (régimen foral: texto explicativo)
  tokens    bg surface-raised, borde border, radius lg, precio en display/xl
  a11y      el precio incluye periodo y IVA en texto ("99 € al año, IVA incluido"); botón con nombre "Elegir plan PRO"
  used on   S03, S12

Tabla comparativa (CompareTable)
  variants  check, guion, texto
  states    default; fila de cabecera fija en escritorio; en móvil se apila por plan
  tokens    borde border, cabecera bg surface, text sm
  a11y      `<table>` con `<th scope>`; check/guion con `aria-label` "Incluido" / "No incluido", no solo icono
  used on   S03

Barra de confianza (TrustBar)
  variants  cifras propias, sellos (colegiación, RGPD)
  states    default
  tokens    bg surface, text-muted
  a11y      cifras solo si son reales y comprobables; sin cifras no se muestra (nada copiado de TaxDown)
  used on   S01, S03

Tarjeta de resultado (ResultCard)
  variants  a pagar (warning), a devolver (success), cero
  states    calculando (skeleton), calculado, error de cálculo, desactualizado (cambió el cuestionario)
  tokens    bg warning-soft/success-soft, texto on-*-soft, importe en display
  a11y      `role="status"`; el texto dice "A devolver" / "A pagar" además del color; importe con signo y literal
  used on   S11

Lista de deducciones (DeductionList)
  variants  aplicada, sugerida (requiere dato), no aplicable
  states    vacía ("Aún no hay deducciones"), cargando, con error
  tokens    filas border, importe en text, etiqueta soft
  a11y      lista semántica; cada fila con nombre, importe y estado en texto
  used on   S11

Stepper (Stepper)
  variants  horizontal (escritorio), compacto "Paso 2 de 5" (móvil)
  states    pendiente, activo, completado, con error
  tokens    activo accent, completado success, pendiente border-input
  a11y      `<ol>` con `aria-current="step"`; completado con icono y texto oculto "completado"
  used on   S01 (3 pasos), S10

Formulario de cuestionario (Field, Input, Select, Checkbox, Radio, Textarea)
  variants  texto, número, importe en euros, fecha, sí/no, selección múltiple
  sizes     md 40px, lg 48px (móvil)
  states    default, hover, focus-visible, disabled, error, éxito, solo lectura
  tokens    borde border-input, radius md, error danger + `on-danger-soft`
  a11y      `<label>` visible, ayuda con `aria-describedby`, error con `aria-invalid` y mensaje junto al campo en texto ("Introduce un NIF válido"), resumen de errores al enviar con foco en el primero; `autocomplete` correcto
  used on   S08, S10, S12, S18

Acordeón FAQ (Accordion)
  variants  único, múltiple
  states    cerrado, abierto, focus-visible
  tokens    borde border, text base/600 en cabecera
  a11y      patrón disclosure de Radix; botón con `aria-expanded`
  used on   S01, S03, S05

Chat de asesor (Thread)
  variants  burbuja cliente, burbuja asesor, mensaje del sistema, con adjunto
  states    vacío, escribiendo, enviando, error de envío (reintentar), leído
  tokens    cliente accent-soft, asesor surface, sistema text-muted
  a11y      contenedor `role="log"` con `aria-live="polite"`; adjuntos con nombre y tamaño; campo con Enter envía y Shift+Enter salto
  used on   S14, S16

Subida de archivos (FileDrop)
  variants  carta de Hacienda, justificante, varios archivos
  states    vacío, arrastrando, subiendo (progreso), error (tipo o >20 MB), completado
  tokens    borde punteado border-input, bg surface; error danger
  a11y      `<input type=file>` real accesible por teclado; progreso con `role="progressbar"`; errores en texto con el motivo ("Máximo 20 MB, PDF/JPG/PNG")
  used on   S14, S17

Timeline del caso (CaseTimeline)
  variants  vertical
  states    pendiente, en curso, completado, bloqueado (esperando al cliente, con acción visible)
  tokens    línea border, hito accent/success
  a11y      `<ol>` con fecha y estado en texto; "Pendiente de tu aprobación" lleva botón
  used on   S14

Aviso de seguridad (SecurityNotice)
  variants  información, subida de datos, aprobación final
  states    default
  tokens    bg accent-soft, texto on-accent-soft, icono Lucide `shield-check`
  a11y      no promete lo que no se hace: describe cifrado y quién accede, enlazando a la política de privacidad
  used on   S09

Aprobación final (ApprovalPanel)
  variants  asesor aprobó / esperando tu confirmación
  states    pendiente, aprobada, cambios pedidos
  tokens    borde accent, resumen en surface
  a11y      resumen del importe, casilla "He revisado mi declaración y autorizo su presentación" (no premarcada), botón deshabilitado hasta marcarla; confirmación anunciada
  used on   S13

Estado vacío / error / carga (EmptyState, ErrorState, Skeleton)
  variants  sin casos, sin documentos, sin mensajes; error de red; error 404/500
  states    con acción principal ("Empezar mi declaración"), con reintentar
  tokens    text-muted, icono 24px
  a11y      errores con `role="alert"`; skeleton con `aria-busy` en el contenedor
  used on   todas las pantallas de app

Etiqueta de estado (StatusBadge)
  variants  borrador, calculado, pagado, en revisión, pendiente de aprobación, presentado, cerrado, cancelado
  states    default
  tokens    pares soft/on-soft (accent, success, warning, danger; borrador y cerrado en surface)
  a11y      siempre texto; nunca solo color
  used on   S14, panel del asesor

Modal y confirmación (Dialog)
  variants  informativo, confirmación, destructivo (cancelar suscripción)
  states    abierto, cerrando
  tokens    bg surface-raised, shadow pop, radius lg, overlay texto al 50 %
  a11y      Radix Dialog: foco atrapado, Esc cierra, devuelve el foco, título con `aria-labelledby`
  used on   S12, S19

Aviso (Toast / Alert)
  variants  éxito, información, aviso, error
  states    visible, descartable
  tokens    soft/on-soft por tipo
  a11y      `role="status"` (éxito, info) o `role="alert"` (error); no desaparece sola si es un error
  used on   todas

Navegación (Header, AppSidebar)
  variants  pública (logo, enlaces, CTA), app cliente, panel de asesor (cola de casos)
  states    activo (`aria-current="page"`), menú móvil abierto
  tokens    cabecera 64px, barra lateral 256px, borde border
  a11y      enlace "Saltar al contenido", `<nav>` con etiqueta, menú móvil con foco atrapado
  used on   todas
