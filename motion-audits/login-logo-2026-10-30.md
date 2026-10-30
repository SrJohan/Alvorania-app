# Auditoría de motion del logo de acceso de Alvorania

Fecha: 2026-10-30. Modalidad: terminal/Markdown. Sin cambios en el código de la aplicación.

## Resumen

**9 hallazgos: 2 de severidad alta, 4 media y 3 baja.** La identidad de marca está justificada, pero la entrada demora la lectura y la salida depende del tiempo de navegación. Conviene conservar un gesto breve, hacer accesibles los estados intermedios y permitir que el destino aparezca en cuanto esté listo.

Ponderación solicitada y aplicada: **Jakub Krehel principal**, por el acabado de una web profesional; **Jhey Tompkins secundario**, para la personalidad del símbolo; **Emil Kowalski selectivo**, para acceso, teclado y navegación. Son lentes interpretativas de la skill, no opiniones atribuidas a sus autores.

## Alcance y método

Revisión estática de los cuatro archivos solicitados, con líneas de la copia de trabajo:

- `web/src/app/(marketing)/acceder/page.tsx`
- `web/src/app/globals.css`, reglas y keyframes `login-*`, reglas compartidas relevantes.
- `web/src/components/site/client-navigation.tsx`
- `web/src/app/(marketing)/layout.tsx`

También se comprobaron `web/package.json`, `web/AGENTS.md`, el layout raíz, el layout del área cliente, `LogoMark`, `Button` y `AppShell` para verificar montaje, interacción y fallback del destino. No se encontraron archivos `loading` o `error` en el inventario de rutas revisado. `AppShell` sí tiene un skeleton al esperar hidratación/usuario; no se debe confundir esa espera con la del router antes del montaje.

Se leyeron `SKILL.md`, `workflows/audit.md`, `references/audit-checklist.md`, `references/anti-checklist.md`, `references/accessibility.md`, `references/performance.md` y `references/output-format.md` de `C:/Users/PC3/.claude/skills/design-motion-principles`, además de las tres lentes y el cookbook. La ponderación ya venía autorizada en la petición; no necesita otra confirmación. La petición de archivo Markdown y resumen de diez líneas prevalece sobre la salida HTML y las decoraciones del formato por defecto.

No se ejecutó la app ni se midieron frames, foco real o capas. Los tiempos y estados CSS están comprobados en código; la apariencia de un corte, el comportamiento exacto del foco del navegador y el coste GPU requieren validación visual. No se afirma conformidad normativa ni una tasa de frames medida. La API del router se contrastó con la documentación instalada en `web/node_modules/next/dist/docs/01-app/03-api-reference/04-functions/use-router.md`.

## Reconocimiento y frecuencia

Es Next.js con App Router y React, con marketing y área privada. Las dependencias declaradas son Next `16.4.3` y React `19.3.0`. El lenguaje compartido usa curvas suaves, entradas de 220 a 560 ms y escalas moderadas. El logo introduce una escala mucho mayor.

`ClientNavigationProvider` distingue snapshot de servidor/hidratación (`false`) y cliente (`true`), no primera visita ni intención del usuario. `useState(clientNavigation)` captura el valor al montar:

| Situación | Exposición prevista por este código |
|---|---|
| Abrir o recargar directamente `/acceder` con SSR/hidratación | Sin entrada del logo; sí puede entrar el formulario con `anim-swap` |
| Montar `/acceder` mediante navegación cliente tras hidratar | Una entrada de 720 ms |
| Completar acceso o alta con sesión inmediata | Una salida de hasta 400 ms, si el montaje persiste |
| Error de credenciales, validación o cambio de modo | Sin nuevo gesto del logo |
| Alta que pide confirmar correo o recuperación | Sin salida del logo en ese momento |
| Volver a montar acceso durante la sesión | Puede repetir la entrada; no hay límite por sesión |

Un recorrido cliente seguido de autenticación correcta puede producir **dos gestos**; un acceso directo correcto, **uno**. No equivale necesariamente a dos reproducciones completas, porque la salida puede cortarse. No hay analítica para cuantificar visitas reales: frecuencia diaria u ocasional son escenarios, no datos. Para clientes que entran a trabajar a diario debe tratarse como interacción recurrente, aunque el resto del sitio sea marketing.

## Cronología comprobada

Todos los tiempos siguientes empiezan en el montaje o cambio de clase, no al pulsar el enlace ni al enviar credenciales.

| Momento | Estado |
|---|---|
| Entrada, 0 ms | Logo con opacidad 0, giro -120°, escala 0,9; tarjeta invisible por `backwards` |
| 129,6 ms (18 %) | Logo alcanza opacidad 1 |
| 300 ms | Comienza la tarjeta, opacidad 0 y escala 0,96 |
| 324 ms (45 %) | Logo llega a giro 0°, escala 1; comienza su expansión y fundido |
| 720 ms | Logo invisible a escala 4 y tarjeta completa |
| Salida, 0 ms | Se solicita prefetch, se activa `saliendo` si procede y se llama a `router.push` sin espera |
| Salida, 100 ms (25 %) | Logo alcanza opacidad 1 |
| Salida, 180 ms | Tarjeta invisible e inerte |
| Salida, 400 ms | Logo queda visible, giro 0°, escala 1,15, hasta desmontaje |

La salida **no repite el gesto de entrada**: gira 45°, crece de 0,95 a 1,15 y no termina fundiéndose. Es una reducción razonable de protagonismo, pero el estado final comunica espera, no transición completada. El login no espera 400 ms para navegar. El prefetch inmediato es una oportunidad de carga, no una garantía de destino listo.

Con destino inmediato puede no llegar a pintarse la salida o verse solo una fracción. Con destino lento no hay un blanco total causado por estos keyframes: permanece el logo y el fondo, además del marco de marketing mientras siga montado. Sí desaparecen formulario y contexto útil. Al desmontar marketing cambian cabecera, pie y composición; no hay un puente persistente del logo entre ambos layouts.

## Jakub Krehel: acabado de producción, lente principal

### Qué funciona

- Curva explícita `cubic-bezier(.2,.8,.2,1)`, sin rebote ni elasticidad: `globals.css:77`.
- `backwards` evita el flash inicial de la tarjeta durante el delay: `globals.css:147`.
- La salida de tarjeta dura 180 ms frente a 420 ms de entrada; el logo de salida también tiene menos recorrido: `globals.css:151` y `globals.css:159`.
- Solo se animan `transform` y `opacity` en los keyframes auditados. No hace falta añadir blur para aprobar el acabado.

### H1. Alta: controles enfocables mientras la tarjeta es invisible

**Archivo:línea:** `web/src/app/(marketing)/acceder/page.tsx:115`; `web/src/app/globals.css:147` y `:173`.

**Qué pasa:** `inert` solo depende de `saliendo`. Durante los primeros 300 ms de entrada la tarjeta tiene opacidad cero, pero sus campos y botones conservan interacción y presencia accesible. El overlay con `pointer-events-none` no cambia esto. Tampoco se impide interactuar mientras el logo se expande por encima.

**Por qué importa:** Tab puede llegar a un campo con indicador de foco invisible; también se puede pulsar un control todavía no visible. El problema existe antes de valorar la belleza del gesto.

**Arreglo concreto:** preferiblemente eliminar el delay de tarjeta y mostrar el formulario de inmediato, con movimiento decorativo separado. Si se mantiene la ocultación, añadir estado TSX `entradaPendiente`, usar `inert={saliendo || entradaPendiente}` y desactivarlo en `onAnimationEnd` únicamente cuando `event.target === event.currentTarget` y `animationName === "login-card-enter"`. Contemplar también cancelación y cambio a reduced motion, sin depender exclusivamente del evento. Mantener un destino de foco visible fuera del bloque; al liberar el formulario, mover foco solo si el usuario no lo ha llevado a otro lugar. No usar `aria-hidden` como sustituto de `inert`.

### H3. Media: la navegación rápida puede cortar el gesto de salida

**Archivo:línea:** `web/src/app/(marketing)/acceder/page.tsx:51`; `web/src/app/(marketing)/layout.tsx:8`; `web/src/app/globals.css:156`.

**Qué pasa:** `router.push` se llama inmediatamente después de actualizar estado. El logo está dentro de la página que se desmonta; no existe compromiso de reproducción de 400 ms. Una ruta disponible puede sustituir el árbol sin mostrar toda la animación, o interrumpirla en una escala/opacidad intermedia.

**Por qué importa:** el acabado varía según caché y red. Un destello parcial o un cambio brusco de marco puede resultar menos pulido que un acceso inmediato.

**Arreglo concreto:** aceptar que el destino tiene prioridad y reducir la salida local a un fundido discreto de 120 a 180 ms, sin secuencia que necesite completarse. Si completar el logo es requisito de marca, alojar un puente en un componente cliente persistente bajo el layout raíz, fuera de ambos grupos, con estado de destino y cierre al confirmar cambio de ruta. No retrasar `router.push` con un timeout fijo ni tratarlo como una promesa de carga. Para la solución mínima, eliminar `.login-mark-exit` del render de salida y conservar únicamente feedback accesible pendiente.

### H4. Media: zoom de entrada demasiado dominante sobre un formulario

**Archivo:línea:** `web/src/app/globals.css:143`, `:147` y `:165`; `web/src/app/(marketing)/acceder/page.tsx:112`.

**Qué pasa:** la secuencia dura 720 ms y retrasa la aparición de tarjeta 300 ms. El logo pasa de escala 1 a 4 durante los últimos 396 ms, delante de la tarjeta por `z-10`. Su caja nominal final equivale aproximadamente a 320 o 384 px con las utilidades de tamaño usadas. El fundido reduce su visibilidad final, pero no elimina el recorrido amplio.

**Por qué importa:** compite con la lectura de credenciales y añade zoom y giro, dos estímulos vestibulares. En este umbral hacia el área de trabajo el peso de marca supera al de orientación.

**Arreglo concreto:** en CSS, sustituir la cola `scale(4)` por un máximo de `scale(1.08)`, reducir el giro inicial a unos -12° y el logo a 320 ms; tarjeta de 220 ms sin delay. Usar esos números como propuesta de diseño a validar, no como límite universal de la skill. Si se conserva la pieza expresiva, reservarla al primer acceso cliente de la sesión según H5. No replicar el zoom x4 en salida para lograr simetría.

### H7. Baja: la curva se reinicia por segmentos del logo

**Archivo:línea:** `web/src/app/globals.css:159` y `:165`.

**Qué pasa:** la curva de la animación se aplica entre keyframes relevantes, no como una única aceleración sobre 720 ms. La transformación de entrada llega a escala 1 y giro 0 en el 45 %, y vuelve a arrancar hacia escala 4. Opacidad tiene hitos distintos. La salida también separa el tramo de aparición del recorrido de transformación.

**Por qué importa:** puede percibirse una pausa seguida de otro impulso en lugar de un gesto continuo. Es una hipótesis visual derivada de la estructura CSS, no un tirón medido.

**Arreglo concreto:** con la versión contenida de H4, dejar solo `from/to` para transformación y fundido; si interesa mantener dos fases, animar opacidad en un wrapper y transformación en el SVG con duraciones explícitas. Conservar `--ease-brand` para entrar; probar `cubic-bezier(.4,0,1,1)` en la salida breve para acelerar hacia el destino, sin cambiar el token global.

**Desde la lente de Jakub:** la base técnica es sobria; el acabado mejora reduciendo protagonismo y haciendo que cada estado intermedio tenga sentido con cualquier velocidad de navegación.

## Jhey Tompkins: identidad de marca, lente secundaria

### Qué funciona

- Se usa un símbolo propio y un momento acotado, con comentario de intención de marca: `globals.css:139`.
- No hay bucle de pulso, resorte elástico ni repetición infinita del logo.
- La versión de salida más contenida puede pertenecer a la misma familia sin copiar exactamente giro, escala o duración de entrada.

### H5. Media: la entrada se repite por montaje, sin política de frecuencia

**Archivo:línea:** `web/src/components/site/client-navigation.tsx:8` y `:13`; `web/src/app/(marketing)/acceder/page.tsx:38`.

**Qué pasa:** el contexto solo detecta ejecución cliente frente a hidratación. No registra que el usuario ya haya visto el gesto. Cada nuevo montaje cliente elegible vuelve a habilitar la entrada, incluidas revisitas; una restauración que conserve el árbol puede comportarse de forma distinta.

**Por qué importa:** una bienvenida ocasional se convierte en fricción recurrente. Recargar directamente y navegar internamente también producen experiencias distintas, aunque el usuario tenga la misma intención.

**Arreglo concreto:** añadir una política explícita de una entrada de marca por sesión, con una referencia de “visto” en un proveedor persistente. Capturar elegibilidad al montar y marcarla al iniciar el gesto; no cambiar una entrada ya iniciada al actualizar el proveedor. Si se necesita recordar tras recarga, leer almacenamiento de sesión después de hidratar sin iniciar una animación tardía sobre contenido visible. Mantener acceso directo inmediato. Para revisitas, formulario instantáneo o fundido corto sin giro.

### Puerta anti AI-slop

No se alcanza ningún umbral de abuso demostrado: no hay pulso del logo, blur repetido, stagger de listas, rebotes utilitarios ni cuatro componentes distintos con idéntica entrada en esta vista. El gesto de marca aislado tiene intención explícita. `anim-swap` reutilizado en ramas mutuamente excluyentes no demuestra por sí solo uniformidad abusiva.

H4 y H5 sí identifican **riesgo de decoración de montaje y sobreactuación recurrente**, pero no permiten atribuir origen a IA. No se propone añadir blur, spring, stagger o movimiento a todos los errores por cumplir mecánicamente una receta.

**Desde la lente de Jhey:** merece conservarse la firma del símbolo en un momento elegido. Su personalidad debe estar en el dibujo y el ritmo, sin exigir una pequeña intro cada vez que alguien vuelve a entrar.

## Emil Kowalski: formulario y navegación, lente selectiva

### Qué funciona

- La navegación no espera artificialmente al final del gesto: `page.tsx:56`.
- El formulario queda inerte al salir con movimiento normal: `page.tsx:115`.
- Los errores de acceso no vuelven a disparar el logo; el botón da feedback de autenticación mediante `loading`.
- Reduced motion elimina el logo y las animaciones de tarjeta: `globals.css:183`. El guard TSX evita activar la salida decorativa en ese modo: `page.tsx:53`.

### H2. Alta: la espera de navegación queda sin estado accesible y recuperable

**Archivo:línea:** `web/src/app/(marketing)/acceder/page.tsx:51`, `:104`, `:112` y `:115`; `web/src/app/globals.css:151` y `:162`.

**Qué pasa:** tras autenticación, `finally` vuelve `loading` a falso aunque la navegación pueda seguir pendiente. Con movimiento normal, la tarjeta acaba invisible e inerte y el único feedback local es un logo `aria-hidden` estático desde 400 ms. No hay mensaje local de navegación pendiente, destino de foco ni restauración de `saliendo` si la navegación no progresa. La captura de errores de autenticación no equivale a gestionar un fallo asíncrono del router.

**Por qué importa:** una ruta lenta puede parecer bloqueada, especialmente con lector de pantalla. Si el foco estaba dentro de la tarjeta, se vuelve inerte sin un relevo explícito; el resultado concreto depende del navegador. Con reduced motion la tarjeta permanece operable tras `finally`, permitiendo otro envío durante la espera. No hay hueco visual vacío por CSS, pero sí un hueco de información y de control.

**Arreglo concreto:** separar `navegando` de `saliendo`. Activar `navegando` antes de `router.push` para todos los modos, bloquear reenvíos con `loading={loading || navegando}` y una guarda en `onSubmit`. Añadir fuera del bloque inerte un estado visible `role="status"` con “Abriendo tu área de cliente…”, y un contenedor de transición con `aria-busy={navegando}`. Antes de volver inerte el bloque, pasar el foco a un destino visible con `tabIndex={-1}` si el foco sigue dentro; no robarlo si ya está fuera. Mantener ese estado hasta desmontaje. Para espera prolongada, ofrecer una acción visible de reintento de navegación al destino ya validado, sin volver a autenticar, y una salida segura de ese estado. Si se conserva la tarjeta visible mientras se navega, no hacerla totalmente inerte: deshabilitar solo acciones incompatibles. Verificar también foco de llegada en el destino, sin asumir que el router lo resuelve para todos los casos.

### H6. Media: el origen de teclado no reduce la decoración

**Archivo:línea:** `web/src/app/(marketing)/acceder/page.tsx:69` y `:95`; `web/src/components/site/client-navigation.tsx:13`.

**Qué pasa:** Enter en el formulario activa la misma salida que un clic. La entrada tampoco sabe si el enlace de origen se activó con teclado. Solo se consulta reduced motion, que es una preferencia distinta del método de interacción.

**Por qué importa:** según la lente selectiva de Emil, el teclado debe dar respuesta inmediata. No es por sí solo prueba de infracción de accesibilidad, pero junto con H1/H2 hace más difícil seguir el foco.

**Arreglo concreto:** conservar en una referencia la última modalidad relevante mediante `onKeyDownCapture` y `onPointerDownCapture`; capturar esa modalidad al enviar, antes de los `await`, y omitir `setSaliendo(true)` para envío por teclado. Para la entrada, transportar modalidad desde navegación en el proveedor persistente, o suprimir el gesto en todas las revisitas según H5. No inferir teclado solo de `event.detail`: el evento recibido es un submit y también existen tecnologías de asistencia. Mantener siempre el feedback textual de H2.

### H8. Baja: los cambios internos de formulario solo animan el contenido nuevo

**Archivo:línea:** `web/src/app/(marketing)/acceder/page.tsx:122`, `:133`, `:147` y `:166`; `web/src/app/globals.css:93`.

**Qué pasa:** cambiar `mode` remonta el formulario con `key={mode}` y entrada `anim-swap` de 220 ms. Nombre/contraseña, confirmaciones y errores modifican altura sin transición de contenedor; los estados anteriores se retiran inmediatamente. Títulos y textos cambian fuera del formulario animado. Es un hueco de continuidad interno, no del logo.

**Por qué importa:** puede moverse el centro de la tarjeta y la posición visual del logo durante cambios de modo o mensajes. El salto efectivo depende del alto resultante y del viewport.

**Arreglo concreto:** primero quitar `anim-swap` del `<form>` y conservar campos comunes montados al cambiar de modo, con claves estables; mostrar validación inmediatamente. Si las pruebas muestran saltos molestos, preparar espacio para mensajes y aplicar un fundido corto solo al panel que cambia, sin animar `height` ni añadir una librería de presencia solo para este caso. En teclado y reduced motion usar sustitución directa. No se recomienda animar cada error ni retrasar su anuncio.

### H9. Baja: el logo invisible sigue montado con estado final de animación

**Archivo:línea:** `web/src/app/(marketing)/acceder/page.tsx:38` y `:112`; `web/src/app/globals.css:143` y `:169`.

**Qué pasa:** `animarEntrada` nunca se apaga. Tras 720 ms permanece el wrapper absoluto y el SVG con `animation-fill-mode: both`, opacidad 0 y transformación escala 4. No consume frames continuamente, pero mantiene nodos y propiedades finales; una capa retenida es posible, no confirmada.

**Por qué importa:** es trabajo y estado innecesarios en la pantalla que el usuario usará para escribir. Con rasterización de gran escala y alta densidad puede haber coste de memoria, aunque este SVG sea sencillo.

**Arreglo concreto:** añadir `entradaTerminada` y desmontar el overlay al recibir `onAnimationEnd` de `login-mark-enter`; no tocar la tarjeta ni reiniciar la entrada. Si cambia a reduced motion, ocultar y limpiar también ese estado sin esperar un evento que ya no llegará. No añadir `will-change` permanente. Si un perfil demuestra tirón de promoción inicial, usarlo solo antes/durante el gesto y retirarlo al terminar.

**Desde la lente de Emil:** los 720 ms no son automáticamente incorrectos por superar 300 ms; lo relevante aquí es que se aplican al acceso a una herramienta. Autenticar, anunciar progreso y navegar deben tener prioridad sobre la decoración.

## Accesibilidad y rendimiento: resultado transversal

**Reduced motion: correcto en el alcance estático.** Las reglas específicas usan `display:none` para ambos logos y `animation:none` para tarjetas. No quedan delays de entrada activos en esas reglas. `anim-swap` también se desactiva en la regla compartida. Cambiar la preferencia en mitad de una salida oculta el logo y revela de nuevo la tarjeta sin animación, aunque `saliendo` siga manteniéndola inerte: H2 debe resolver el estado funcional de forma independiente. No se necesita control de pausa para un gesto finito; sí feedback estable de navegación.

**Foco e interacción:** el overlay es decorativo y no intercepta puntero, lo cual está bien. `aria-hidden` evita duplicar el símbolo al lector de pantalla. `inert` es adecuado para contenido retirado, pero está ausente durante la ocultación de entrada y carece de relevo de foco al salir. La regla global `:focus-visible` existe en `globals.css:83`, pero no puede hacer visible un foco dentro de un ancestro con opacidad 0.

**Rendimiento:** los cuatro keyframes `login-*` solo cambian transformación/opacidad; fondo degradado y sombra no se interpolan. No hay JS por frame, layout animado ni `will-change` indiscriminado en estas reglas. La sombra y el texto de la tarjeta deben rasterizarse al componer; el SVG escalado puede requerir otra resolución de rasterizado. Composición eficiente es plausible, no una garantía de cero repaints ni de 60 fps. El mayor riesgo práctico es coincidir carga de ruta, montaje del destino y primer frame de salida. No se recomienda añadir filtros ni capas preventivas sin perfil.

## Recomendaciones combinadas

### Alta: resolver estados funcionales

| ID | Problema | Referencia | Arreglo prioritario |
|---|---|---|---|
| H1 | Foco e interacción invisibles al entrar | `page.tsx:115`, `globals.css:147` | Tarjeta inmediata o inert temporal con liberación robusta |
| H2 | Espera inaccesible y sin recuperación local | `page.tsx:51`, `page.tsx:104` | Estado navegando independiente, mensaje y relevo de foco |

### Media: reducir fricción y discontinuidad

| ID | Problema | Referencia | Arreglo prioritario |
|---|---|---|---|
| H3 | Salida cortable por navegación | `page.tsx:56`, `(marketing)/layout.tsx:8` | Salida mínima o puente persistente si fuese requisito |
| H4 | Zoom x4 y lectura retrasada | `globals.css:165`, `globals.css:147` | Gesto contenido y tarjeta sin delay |
| H5 | Repetición por montaje | `client-navigation.tsx:13`, `page.tsx:38` | Una entrada expresiva por sesión |
| H6 | Misma decoración al usar teclado | `page.tsx:69`, `page.tsx:95` | Capturar modalidad y omitir gesto decorativo |

### Baja: refinamiento y limpieza

| ID | Problema | Referencia | Arreglo prioritario |
|---|---|---|---|
| H7 | Easing por segmentos potencialmente entrecortado | `globals.css:165` | Simplificar fases o separar canales |
| H8 | Cambios de modo con remontaje y salto de altura | `page.tsx:147` | Campos estables y mensajes inmediatos |
| H9 | Overlay invisible retenido | `page.tsx:112`, `globals.css:143` | Desmontar al terminar; no fijar capas |

## Validación propuesta antes de implementar

Estas comprobaciones quedan pendientes; no son resultados ejecutados:

1. Navegación interna a `/acceder`, carga directa y diez revisitas: comprobar política de frecuencia y ausencia de animación tardía tras hidratar.
2. Pulsar Tab durante los primeros 300 ms: ningún control debe tener foco invisible. Probar envío con Enter y activación de enlaces con teclado.
3. Destino caliente/inmediato, red lenta y navegación fallida: ningún destello expresivo truncado, formulario oculto sin mensaje o bloqueo sin salida. Probar cliente y asesor.
4. Activar reduced motion antes de cargar y durante entrada/salida: mantener acceso, feedback pendiente y foco coherentes.
5. Comprobar lector de pantalla: el logo decorativo no se anuncia, el estado pendiente sí y la llegada tiene un punto de orientación útil.
6. Viewports móvil y escritorio, zoom del navegador y tarjeta alta por errores/alta: verificar superposición y cambios de centro.
7. Perfilar durante navegación con CPU ralentizada: Performance y capas para comprobar rasterización, repaints y liberación del overlay. Sin añadir `will-change` hasta identificar un coste real.

## Síntesis de las lentes

La referencia dominante es Jakub: acabado consistente con distintos tiempos de carga y menor protagonismo del zoom. Jhey aporta una firma de marca que merece preservarse una vez por sesión. Emil guía el umbral funcional: formulario inmediato, teclado sin ceremonia y progreso accesible. Aplicar Emil más estrictamente eliminaría los logos de transición; aplicar Jhey con más peso permitiría conservar la entrada expresiva únicamente en una bienvenida deliberada. La recomendación para este producto es conservar identidad sin hacer que el acceso dependa de una coreografía.
