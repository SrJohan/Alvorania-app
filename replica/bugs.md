# Bugs

Solo bugs reproducidos. Lo que podría ser un problema pero no se ha reproducido va en «A comprobar».

| ID | sev | título | estado |
| --- | --- | --- | --- |
| BUG-001 | S3 | Error falso «Elige cómo quieres aportar tus datos» al continuar rápido | fixed in 4bb1b7e |
| BUG-003 | S2 | Régimen foral: callejón sin salida, no hay forma de pedir un asesor | open |
| BUG-004 | S2 | En modo live, las peticiones de enlace de acceso seguidas fallan | parcial: mensaje fixed in 4b3e9a7; falta SMTP propio |

(BUG-002 se abrió como sospecha y no se reprodujo: ver «A comprobar».)

### BUG-001: Error falso al elegir «a mano» y continuar enseguida

- Severity: S3
- Flow / case: F01 / F01-E10
- Screen: S09 Datos fiscales
- Build: 5c7c1cb  Browser / device: Chromium (Playwright), 1440px

Steps
1. Entrar y llegar a Datos fiscales.
2. Marcar las tres casillas.
3. Pulsar «Prefiero introducirlos» y, sin esperar, «Continuar al cuestionario».

Expected: pasa al cuestionario.
Actual: se queda en la pantalla con «Elige cómo quieres aportar tus datos fiscales.», aunque el botón ya muestra «Elegido ✓».
Evidence: prueba `F01-E10 … (BUG-001)` fallaba en 5c7c1cb; arrastró en cascada 8 pruebas más que usan el mismo paso.
Suspected cause: la elección se guarda de forma asíncrona (crea el caso y luego la fuente) y «Continuar» leía el estado antiguo.
Status: fixed in 4bb1b7e. «Continuar» espera a que termine el guardado y comprueba el estado más reciente. La prueba queda como regresión.

### BUG-003: Régimen foral sin salida

- Severity: S2
- Flow / case: F01 / F01-E7
- Screen: S10 Cuestionario
- Build: 4bb1b7e  Browser / device: Chromium, 1440px

Steps
1. Entrar, Datos fiscales a mano, ir al cuestionario.
2. Elegir «País Vasco» (o «Navarra»).

Expected: un aviso y una forma de que un asesor lleve el caso (contacto, cita o pago directo del plan Completo).
Actual: aviso y «Siguiente» desactivado. No hay ningún enlace ni botón para seguir. Un cliente foral no puede contratar.
Evidence: prueba `F01-E7` falla de forma estable (3 de 3 ejecuciones).
Suspected cause: no se ha decidido el canal de contacto para estos casos.
Status: open. **Necesita una decisión tuya**: ¿cómo quieres atender a los clientes forales? Opciones: (a) que contraten directamente el plan Completo sin cálculo previo, (b) un formulario o email de contacto, (c) no aceptarlos por ahora y decirlo claramente.

### BUG-004: Las peticiones seguidas de enlace de acceso fallan en modo live

- Severity: S2
- Flow / case: F01 / M3 (manual)
- Screen: S08 Acceso
- Build: 5c7c1cb, modo live con Supabase real  Browser / device: Chrome del usuario

Steps
1. En `/acceder`, pedir el enlace de acceso.
2. Volver a pedirlo varias veces en pocos minutos.

Expected: o llega el correo, o la pantalla dice claramente que hay que esperar.
Actual: la acción falla en el servidor (`[action] unexpected error: magic link failed` tres veces en el log) y la pantalla muestra el mensaje genérico «Algo ha salido mal».
Evidence: registro del servidor de desarrollo, 2026-10-26.
Suspected cause: límite de envío del SMTP incluido en Supabase gratis (muy pocos correos por hora). Dos problemas: el límite en sí y que el mensaje no lo explica.
Status: parcial. El mensaje se corrigió en 4b3e9a7 (prueba `src/server/auth-errors.test.ts`): ahora dice que hay que esperar unos minutos, sin revelar si la cuenta existe. **Sigue abierto** el límite en sí: hay que configurar Resend como SMTP en Supabase (ajuste en su panel, lo haces tú con tu clave).

## A comprobar (no reproducido)

- **BUG-002 (descartado): selector de archivos con `id` duplicado.** Next 16 mantiene montada la pantalla anterior, así que había dos `<input id="file-drop">`. La prueba `F02-E2` comprobó que la etiqueta abre el campo correcto, así que no se reprodujo un fallo de uso. Aun así se corrigió en 4bb1b7e con un `id` único por instancia, porque un `id` duplicado es HTML inválido y podía romperse en otro navegador.
- **Pantallas ocultas que siguen vivas.** Por el mismo motivo, cualquier pantalla con efectos al montarse (por ejemplo, Resultado lanza el cálculo) puede seguir viva en segundo plano. No se ha visto ningún efecto doble, pero conviene vigilarlo.
- **Dos pestañas a la vez (F01-E11)** y **sesión caducada en live (F01-E12)**: sin probar.
- **Tarjeta rechazada (F01-N6)**: bloqueado hasta configurar Stripe.
