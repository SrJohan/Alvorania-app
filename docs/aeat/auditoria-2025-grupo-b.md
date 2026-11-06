# Auditoria IRPF 2025, grupo B (Canarias, Cantabria, Castilla-La Mancha, Extremadura)

Fichero auditado: `web/src/lib/tax/data/irpf-2025.json`. Fuente: subpaginas de `irpf-2025-deducciones-autonomicas` de la AEAT y, cuando existe `fuente`, el arbol `manuales-ayuda-presentacion/irpf-2025` (mismo contenido). Tributacion individual. Las citas de la AEAT son las que devolvio la lectura de cada pagina (extracto, no copia integral).

## Canarias

| code | campo | valor en JSON | valor en AEAT (cita) | veredicto |
|---|---|---|---|---|
| canarias_familia_numerosa | general | 597 | 597 euros categoria general (sin discapacidad) | ok |
| canarias_familia_numerosa | especial | 796 | 796 euros categoria especial | ok |
| canarias_familia_numerosa | limite de renta | ninguno | la pagina no indica limite de renta | ok |

Avisos: recogen los importes con discapacidad >=65% (1.326 / 1.459) como no modelados. Bien.

## Cantabria

| code | campo | valor en JSON | valor en AEAT (cita) | veredicto |
|---|---|---|---|---|
| cantabria_alquiler_jovenes | pct | 0,10 | "podrá deducir el 10%, hasta un límite de 300 euros anuales" | ok |
| cantabria_alquiler_jovenes | max | 300 | 300 euros en individual (600 en conjunta) | ok |
| cantabria_alquiler_jovenes | edadMenorDe | 36 | "Tener menos de 36 años cumplidos, o tener 65 o más años." | ok |
| cantabria_alquiler_jovenes | alquilerMinPctBase | 0,10 de la base imponible | "deben exceder del 10% de la renta del contribuyente" | duda |
| cantabria_alquiler_mayores | pct | 0,10 | idem | ok |
| cantabria_alquiler_mayores | max | 300 | idem | ok |
| cantabria_alquiler_mayores | edadMayorDe | 64 (edad > 64) | "tener 65 o más años" | ok |
| cantabria_alquiler_mayores | alquilerMinPctBase | 0,10 de la base imponible | "renta del contribuyente" | duda |
| cantabria_nacimiento | porHijo | 1400 por hijo, sin reparto | "1.400 euros por nacimiento o adopción de hijos" | ok |
| cantabria_nacimiento | reparto en individual | el motor da 1.400 enteros al declarante | "En declaración individual, la deducción se reparte por mitad entre los progenitores" | distinto |
| cantabria_nacimiento | vigencia | solo hijos nacidos en el ejercicio (`bornThisYear`) | "se aplica en el ejercicio del nacimiento o adopción y en los dos siguientes"; nacimientos "a partir del 1 de enero de 2024" | duda |

Avisos: cubren la incompatibilidad (despoblamiento, cuidado de familiares), el reparto por mitad y los dos ejercicios siguientes, la exencion de edad por discapacidad >=65% y la duda de "renta". Pero el reparto y los ejercicios siguientes no se aplican en el calculo.

## Castilla-La Mancha

| code | campo | valor en JSON | valor en AEAT (cita) | veredicto |
|---|---|---|---|---|
| clm_familia_numerosa | general | 200 | "200 euros, cuando se trate de familia numerosa de categoría general." | ok |
| clm_familia_numerosa | especial | 400 | 400 euros categoria especial | ok |
| clm_familia_numerosa | maxBaseImponible | 27000 | suma de bases general y ahorro (casillas 0435 y 0460) no superior a 27.000 euros en individual (36.000 conjunta) | ok |
| clm_donativos | pct | 0,15 | "El 15% de las donaciones dinerarias" | ok |
| clm_donativos | limitePctBase | 0,10 de la base imponible | "no podrá exceder del 10% de la base liquidable del contribuyente" | distinto |

Avisos: cubren discapacidad 300/900, incompatibilidad con alquiler de familias numerosas, el limite sobre base liquidable y la inscripcion en registros de CLM. Bien.

## Extremadura

| code | campo | valor en JSON | valor en AEAT (cita) | veredicto |
|---|---|---|---|---|
| extremadura_donativos_cultura_deporte | pct | 0,20 | "El 20% de las cantidades donadas durante el ejercicio" | ok |
| extremadura_donativos_cultura_deporte | max | 500 | "El importe máximo conjunto de las dos deducciones no podrá superar los 500 euros anuales por contribuyente." | ok |

Avisos: recogen el tope conjunto (son dos deducciones modeladas como una), domicilio en Extremadura y donacion pura, simple e irrevocable por escrito. Faltan las exclusiones (donante socio con >=50% en la entidad cultural; donante conyuge o familiar directo del deportista) y la residencia del contribuyente en Extremadura, que la AEAT exige; conviene anadirlas.

## Recuento

ok: 16, distinto: 2, duda: 3.

## Hallazgos (por gravedad)

1. Cantabria nacimiento, declaracion individual (distinto, el mas grave): el motor da 1.400 euros por hijo al declarante. La AEAT dice que en individual se reparte por mitad entre los progenitores, o sea 700 euros si ambos tienen derecho; solo corresponde la mitad restante al otro progenitor si este no tiene derecho (p. ej. residio en otra comunidad). Sobreestima la deduccion hasta el doble. Correccion: aplicar 700 por defecto o preguntar si el otro progenitor tiene derecho.
2. Castilla-La Mancha donativos (distinto): el tope del 10% es sobre la base liquidable, no la imponible (el aviso ya lo dice, pero el motor usa `baseImponible`). La base liquidable es menor o igual, asi que el motor puede permitir de mas. Correccion: aplicar el limite sobre la base liquidable.
3. Cantabria nacimiento, vigencia (duda): la deduccion se aplica en el ano del nacimiento y los dos siguientes, para nacimientos desde 2024. El motor solo cuenta hijos nacidos en 2025 (`bornThisYear`), por lo que infravalora a quien tenga hijos nacidos en 2024. Hace falta un campo "hijos nacidos en 2024".
4. Cantabria alquiler, minimo del 10% (duda): la AEAT dice "renta del contribuyente", no base imponible. El motor compara con la base imponible; hay que decidir con fiscalista si "renta" es base imponible, rendimientos u otra magnitud.
5. Cantabria alquiler, discapacidad >=65% (no modelado): exenta del requisito de edad. Esta en avisos pero el motor niega a esos contribuyentes con edad fuera de rango.
6. Extremadura (avisos incompletos): anadir las exclusiones por parentesco o participacion >=50% y la exigencia de residencia en la comunidad.
7. Menores: Canarias y Castilla-La Mancha con discapacidad (1.326/1.459 y 300/900) no modeladas, ya avisado; no hay error de cifra base.
