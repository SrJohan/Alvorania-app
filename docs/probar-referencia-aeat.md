# Probar la opción "Con la Agencia Tributaria"

Qué hace: el usuario saca una **referencia de Renta** en la web de la AEAT con su propia Cl@ve y la pega en nuestra app junto con su NIF. El asesor, como colaborador social, abre Renta WEB con ese NIF y esa referencia y trae los datos fiscales. **Nuestra app nunca ve la Cl@ve del usuario** (la AEAT considera indebido que un tercero entre con las credenciales del ciudadano).

Dónde está: `src/app/(app)/app/conectar/page.tsx` (tarjeta del cliente) y `src/components/asesor/case-detail.tsx` (bloque "Acceso a Renta WEB" del asesor). Se guarda en `tax_data` con `source = 'aeat_datos_fiscales'` y `raw_json = { nif, referencia, savedAt }`.

## Ojo antes de probar

- Local (`http://localhost:3001`) y el servidor usan **la misma base de Supabase**. Lo que crees es real: usa una cuenta de prueba.
- Tiene que ser en modo live. En modo demo el bloque del asesor no sale, porque la demo no guarda el NIF ni la referencia.

## Como cliente

1. Entra con una cuenta de cliente (o crea una) y ve a **Datos fiscales** (`/app/conectar`). La tarjeta "Con la Agencia Tributaria" sale la primera.
2. Pulsa "Obtener referencia": se abre la web de la AEAT en otra pestaña. Ciérrala.
3. Escribe un NIF con letra válida (por ejemplo `12345678Z`) y una referencia de 6 caracteres (por ejemplo `QBW2X9`) y pulsa **Guardar**. Debe salir "Referencia guardada".
4. Prueba también un NIF malo (`12345678A`) y una referencia corta: deben dar error.
5. Marca las tres casillas, continúa, rellena el cuestionario y calcula, para que el caso exista con resultado.

## Como asesor

1. Entra con una cuenta de **administrador** del equipo (su lista incluye casos ya calculados, aunque no estén pagados).
2. En `/asesor` abre el caso del cliente.
3. En "Datos del cliente" debe salir **"Acceso a Renta WEB"** con el botón **"Abrir Renta WEB"**, los cuatro pasos y el NIF y la referencia con su botón **Copiar**.
4. Comprueba que "Copiar" pasa a "Copiado" y que al pegar sale el valor correcto.

## Qué no se puede probar con datos de mentira

Entrar de verdad en Renta WEB: pide el certificado de la gestoría y una referencia real de un cliente. Con la inventada solo se comprueba que el botón abre la página de la AEAT.

## Límites conocidos

- La app solo comprueba el **formato** del NIF (con su letra) y de la referencia (6 a 10 letras o números; el formato exacto no está confirmado con la AEAT). Una referencia inventada solo falla cuando el asesor la usa en Renta WEB.
- No se sabe cuánto dura una referencia.
- El NIF y la referencia están sin cifrar en `tax_data.raw_json`. El esquema pide cifrar en reposo y está pendiente.
- La dirección de Renta WEB lleva el año (`...2025RVlt`). Con otra campaña hay que cambiarla en `case-detail.tsx` (constante `RENTA_WEB_URL`).
- No hay descarga automática de datos: la AEAT no ofrece, que se sepa, un servicio público para ello; la hace el asesor a mano.

## Tarjeta de pago de prueba (Stripe, modo test)

`4242 4242 4242 4242`, cualquier fecha futura y cualquier CVC.
