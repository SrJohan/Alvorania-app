# Auditoria IRPF 2025, deducciones autonomicas, grupo A

Comunidades: Madrid, Cataluña, Andalucía, Asturias, Baleares. Fuente: subpaginas AEAT `irpf-2025-deducciones-autonomicas/<carpeta>/<aeat>.html`. Tributacion individual. Fichero auditado: `web/src/lib/tax/data/irpf-2025.json`.

Notas de metodo:
- WebFetch devuelve un resumen del texto, no el HTML literal; las citas entre comillas son fragmentos que el propio resumen marca como literales.
- Los `avisos` del JSON existen a nivel de territorio (`territorios[c].avisos`), no por deduccion. Madrid, Cataluña y Andalucía no tienen `avisos`; Asturias y Baleares si. Las deducciones no modeladas estan en `noModeladas`.
- No se leyeron los arboles `fuente` (manuales-ayuda-presentacion) de Asturias y Baleares: son el mismo contenido y la subpagina `manuales-practicos` bastaba para cada cifra.

## Madrid

| code | campo | valor en JSON | valor en AEAT (cita) | veredicto |
|---|---|---|---|---|
| madrid_alquiler | pct | 0.30 | "el 30 por ciento de lo pagado por el alquiler" | ok |
| madrid_alquiler | max | 1237.20 | "El límite máximo de deducción será de 1.237,20 euros" (igual en individual y conjunta) | ok |
| madrid_alquiler | edadMenorDe | 40 | "menos de 40 años de edad a la fecha de devengo del impuesto" | ok |
| madrid_alquiler | maxBaseImponible | 26414.22 | "26.414,22 euros" en individual (37.322,20 en conjunta) | ok |
| madrid_alquiler | alquilerMinPctBase | 0.20 | "deben superar el 20 por 100" de la suma de bases del contribuyente | ok |
| madrid_alquiler | limite unidad familiar (no modelado, sin aviso) | no existe | "no podrá ser superior a 61.860 euros" (suma de bases de los miembros de la unidad familiar) | distinto |

Requisitos sin reflejo en avisos (Madrid no tiene `avisos`): limite de 61.860 euros de la unidad familiar, fianza depositada en la Agencia de Vivienda Social (o copia de denuncia), contrato que cubra vivienda permanente (temporada valido si dura al menos un año), solo el conyuge firmante.

## Cataluña

| code | campo | valor en JSON | valor en AEAT (cita) | veredicto |
|---|---|---|---|---|
| cataluna_alquiler | pct | 0.10 | "El 10 por 100" de lo pagado | ok |
| cataluna_alquiler | max | 500 | "El límite máximo será de 500 euros anuales" | ok |
| cataluna_alquiler | edadMaxima | 35 | "Tener 35 años o menos a la fecha de devengo del impuesto" | ok |
| cataluna_alquiler | maxBaseMenosMinimo | 30000 | 0435 + 0460 menos 0520 no debe superar 30.000 (individual), 45.000 (conjunta) | ok |
| cataluna_alquiler | requisitos alternativos (no modelados, sin aviso) | solo edad <= 35 | Basta uno: "Haber estado en paro durante 183 días o más", "grado de discapacidad igual o superior al 65", "Ser viudo o viuda y tener 65 años o más" | distinto |
| cataluna_alquiler | apartado B familia numerosa/monoparental (no modelado, sin aviso) | no existe | 10 % con "El límite máximo será de 1.000 euros anuales" | distinto |
| cataluna_alquiler | definicion de minAut frente a casilla 0520 | `minAut` del motor | "0435 y 0460, menos 0520" (minimo personal y familiar) | duda |

Duda: no se ha comprobado que `minAut` del motor coincida con la casilla 0520 (incluye minimo por descendientes, ascendientes y discapacidad). Revisar `engine.ts`.

## Andalucía

| code | campo | valor en JSON | valor en AEAT (cita) | veredicto |
|---|---|---|---|---|
| andalucia_alquiler | pct | 0.15 | "El 15 por 100 de las cantidades satisfechas en el período impositivo" | ok |
| andalucia_alquiler | max | 1200 | 1.200 euros con carácter general | ok |
| andalucia_alquiler | edadMenorDe | 35 | "no hayan cumplido los 35 años de edad" | ok |
| andalucia_alquiler | edadMayorDe | 65 | "sean mayores de 65 años" | ok |
| andalucia_alquiler | maxBaseImponible | 25000 | 0435 + 0460 no superior a 25.000 (individual), 30.000 (conjunta) | ok |
| andalucia_alquiler | tope para discapacidad (no modelado, sin aviso) | 1200 para todos | 1.500 euros si el contribuyente tiene discapacidad | distinto |
| andalucia_alquiler | otros supuestos (no modelados, sin aviso) | solo edad | Tambien valen: victima de violencia domestica o de terrorismo, o persona con discapacidad (Ley 5/2021) | distinto |

Requisitos sin reflejo en avisos (Andalucía no tiene `avisos`): NIF del arrendador, solo el titular del contrato, compatibilidad con deduccion por compra de vivienda solo si cada vivienda cumple el art. 2 de la Ley 5/2021.

## Asturias

| code | campo | valor en JSON | valor en AEAT (cita) | veredicto |
|---|---|---|---|---|
| asturias_alquiler | pct | 0.10 | "El 10 por 100 de las cantidades satisfechas en el período impositivo por alquiler de la vivienda habitual" | ok |
| asturias_alquiler | max | 500 | 10 % con maximo de 500 euros | ok |
| asturias_alquiler | maxBaseImponible | 35000 | 35.000 (individual), 45.000 (conjunta) | ok |
| asturias_alquiler | variante 30 % / 1.500 (jovenes hasta 35, familias numerosas y monoparentales, violencia de genero) | no modelada (avisada y en `noModeladas`) | "El 30 por 100 de las cantidades satisfechas en el periodo impositivo, con un máximo de 1.500 euros"; tambien el año en que se cumplen 36 | distinto |
| asturias_familia_numerosa | general | 1000 | 1.000 euros categoria general | ok |
| asturias_familia_numerosa | especial | 2000 | 2.000 euros categoria especial | ok |
| asturias_familia_numerosa | limite de base imponible | ninguno (avisado) | 35.000 (individual) / 45.000 (conjunta); el texto lo liga al caso de familias "constituidas por uno o dos ascendientes con dos hijos" | duda |
| asturias_familia_numerosa | convivencia y reparto (no modelados, sin aviso) | no existe | Solo si convive con la familia a fecha de devengo; con varios declarantes se divide a partes iguales | distinto |

Duda: el resumen de la AEAT mezcla el limite de 35.000 con el caso de ascendientes con dos hijos; no se pudo confirmar si aplica a toda familia numerosa. El aviso del JSON ya lo reconoce. Verificar leyendo el HTML literal.

## Baleares

| code | campo | valor en JSON | valor en AEAT (cita) | veredicto |
|---|---|---|---|---|
| baleares_alquiler | pct | 0.15 | 15 % de los importes pagados | ok |
| baleares_alquiler | max | 530 | maximo de 530 euros | ok |
| baleares_alquiler | edadMenorDe | 36 | "menores de 36 años" | ok |
| baleares_alquiler | maxBaseImponible | 33000 | 33.000 individual (52.800 conjunta) en el caso normal | ok |
| baleares_alquiler | mayores de 65 sin actividad (no modelado, avisado) | no existe | "mayores de 65 años y no ejerzan ninguna actividad laboral o profesional" | distinto |
| baleares_alquiler | variante 20 % / 650 (menores de 30, discapacidad 33 %, familia numerosa, monoparental con 2+ hijos, autonomo 183 dias) | no modelada (avisada y en `noModeladas`) | 20 % con maximo de 650 euros | distinto |
| baleares_alquiler | limites de base por familia numerosa (no modelado, sin aviso) | 33000 para todos | 39.600 (numerosa general o monoparental 2+ hijos) y 42.900 (especial), individual | distinto |
| baleares_donativos_tercer_sector | pct | 0.25 | "El 25 por 100 del importe de las donaciones dinerarias" | ok |
| baleares_donativos_tercer_sector | max | 41.25 | "La base máxima de la deducción es de 165 euros anuales" (25 % x 165 = 41,25, calculo propio, la pagina no da la cifra) | ok |

Requisitos sin reflejo claro en avisos de alquiler: vivienda habitual con contrato de al menos un año, no ser titular de otra vivienda a menos de 70 km durante la mitad del periodo (hay aviso parcial), incompatibilidad con deduccion por inversion en vivienda habitual. Donativos: entidad inscrita en el registro de la Consejería de Familias y Asuntos Sociales y certificado de la entidad (aviso parcial: "inscritas en Baleares").

## Resumen de recuento

ok: 25. distinto: 10 (7 sin aviso en el JSON, 3 ya avisados). duda: 2.

## Hallazgos (por gravedad)

Ninguna cifra numerica modelada esta mal: todos los porcentajes, maximos, edades y limites de base presentes coinciden con la AEAT. Los problemas son de cobertura, y varios hacen que el motor diga "no aplica" a quien si tiene derecho.

1. Baleares, limites de base por familia numerosa (sin aviso). El JSON corta en 33.000 a todos. La AEAT permite 39.600 (general/monoparental 2+ hijos) y 42.900 (especial). Una familia numerosa con base entre 33.000 y 42.900 recibe "no aplica" indebidamente. Ademas tendria derecho al 20 %/650 (no modelado).
2. Cataluña, requisitos alternativos (sin aviso). Solo se modela edad <= 35. Tambien tienen derecho parados 183 dias, discapacidad >= 65 % y viudos >= 65. Indicar en un aviso territorial o añadir campos. Falta tambien el apartado B (familia numerosa/monoparental, 10 %, tope 1.000, mismo limite).
3. Andalucía, discapacidad (sin aviso). El tope es 1.500, no 1.200, para contribuyentes con discapacidad; ademas victimas de violencia domestica/terrorismo y discapacitados quedan fuera aunque superen la edad. Hay que avisar o añadir campos.
4. Asturias, 30 %/1.500 para jovenes hasta 35 (y año en que cumplen 36), familias numerosas/monoparentales y victimas de violencia de genero. El motor infravalora (ya avisado). Correcto: 30 %, max 1.500, mismo limite de base 35.000.
5. Baleares, 20 %/650 y mayores de 65 sin actividad: ya avisados; el motor infravalora a menores de 30 y descarta a mayores de 65 sin actividad.
6. Madrid, limite de unidad familiar de 61.860 euros no modelado ni avisado. Con tributacion individual puede haber base propia baja pero unidad familiar por encima. Añadir aviso territorial (tambien fianza y titularidad del contrato).
7. Asturias, familia numerosa: falta aviso de convivencia con la familia y de reparto a partes iguales entre declarantes. Duda abierta sobre el limite 35.000 (ya avisada).
8. Cataluña, comprobar que `minAut` equivale a la casilla 0520 (duda).
9. Madrid, Cataluña y Andalucía no tienen campo `avisos`: ningun requisito no expresable (fianza, NIF del arrendador, contrato, titularidad, compatibilidades) llega al fiscalista.
