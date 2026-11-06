# Auditoria IRPF 2025, grupo C: Murcia y La Rioja

Fuente: fichero `web/src/lib/tax/data/irpf-2025.json`, comparado con las subpaginas oficiales de la AEAT (arbol `manuales-practicos/irpf-2025-deducciones-autonomicas`) y con la pagina `fuente` de cada entrada (arbol `manuales-ayuda-presentacion`). Ambos arboles coinciden en todas las cifras. Tributacion individual.

## Murcia

| code | campo | valor en JSON | valor en AEAT (cita) | veredicto |
|---|---|---|---|---|
| murcia_alquiler | pct | 0.1 | "El 10% de las cantidades no subvencionadas satisfechas en el ejercicio" | ok |
| murcia_alquiler | max | 300 | "importe máximo de deducción será de 300 euros anuales por contrato" | ok |
| murcia_alquiler | edadMaxima | 40 | "Que tenga 40 años o menos a la fecha de devengo del impuesto" | ok (inclusive) |
| murcia_alquiler | maxBaseMenosMinimo | 40000 | "inferior a 40.000 euros" sobre base imponible general menos minimo personal y familiar; sin distincion individual/conjunta | ok |
| murcia_alquiler | avisos (familia numerosa, discapacidad >=65%, base ahorro) | reflejados en avisos | "Que forme parte de una familia que tenga la consideración legal de numerosa"; "discapacidad con un grado reconocido igual o superior al 65 por 100"; ahorro "no supere los 1.800 euros" | ok, con matiz de redaccion (ver hallazgo 3) |
| murcia_nacimiento | porHijo | [100, 200, 300] | "100 euros ... primer hijo", "200 euros ... segundo hijo", "300 euros ... tercer hijo o sucesivos" | ok |
| murcia_nacimiento | maxBaseImponible | 30000 | "no supere: 30.000 euros en declaración individual" (suma casillas 0435 y 0460, general y ahorro) | ok |
| murcia_nacimiento | avisos (reparto, orden por progenitor) | reflejados | "se practicará por mitad en la declaración de cada uno de los progenitores o adoptantes" | ok |
| murcia_donativos | pct | 0.5 | "El 50 por 100 de las donaciones dinerarias puras y simples" | ok |
| murcia_donativos | max / limitePctBase | sin valor | "no se fija límite" (la pagina no indica importe maximo) | ok |
| murcia_donativos | avisos (reduccion por deduccion estatal) | reflejado | "se minorará en las cantidades que constituyan la base de deducción en aquellas" | ok |
| murcia_donativos | incompatibilidad con credito fiscal | no recogida | "incompatible con el crédito fiscal a que se refiere el artículo 12" | duda (falta en avisos, ver hallazgo 2) |

Murcia: 11 ok, 0 distinto, 1 duda.

## La Rioja

| code | campo | valor en JSON | valor en AEAT (cita) | veredicto |
|---|---|---|---|---|
| la_rioja_nacimiento | porHijo | [600, 750, 900] | "600 euros, cuando se trate del primer hijo"; "750 euros ... segundo"; "900 euros ... tercero y sucesivos" | ok |
| la_rioja_nacimiento | limite de renta | sin limite | La pagina no incluye ningun limite de renta | ok |
| la_rioja_nacimiento | parto multiple | no modelado, en avisos (+60) | "60 euros adicionales por cada hijo, en caso de nacimientos o adopciones múltiples" | ok (aviso correcto, el motor no lo aplica) |
| la_rioja_nacimiento | reparto individual | en avisos (mitades) | "se prorrateará entre ellos por partes iguales si tributan de forma individual" | ok |
| noModeladas donaciones (aeat `donaciones-irrevocables-puras-simples-materia-mecenazgo`) | correspondencia con su `url` | url 10_14_17-donaciones-promocion | La `url` (10_14_17) lleva el titulo "Por donaciones para la promoción y estímulo de las actividades de fomento de mecenazgo" | ok (ver hallazgo 4) |
| noModeladas donaciones | pct, tope, limite | 15%, 500 euros conjunto, 30% cuota integra autonomica, incompatibilidades | "El 15 %"; "límite conjunto de 500 euros anuales por declaración"; "no podrá exceder del 30% de la cuota íntegra autonómica" | ok |

La Rioja: 6 ok, 0 distinto, 0 duda.

## Totales

ok: 17, distinto: 0, duda: 1.

## Hallazgos (por gravedad)

Ninguna cifra modelada difiere de la AEAT. No hay hallazgos graves.

1. Leve, ningun cambio de cifra necesario. Todas las cifras modeladas de Murcia (alquiler 10 %, 300 euros, 40 anos, 40.000; nacimiento 100/200/300 con 30.000; donativos 50 %) y La Rioja (600/750/900) coinciden con el texto oficial.
2. Leve, aviso incompleto en `murcia_donativos`: la AEAT dice "incompatible con el crédito fiscal a que se refiere el artículo 12" de la Ley 4/2022 mientras siga vigente. El aviso actual no lo menciona. Anadir esa frase a los avisos.
3. Leve, redaccion en el aviso de `murcia_alquiler`: dice "base liquidable del ahorro <=1.800", pero la AEAT dice "la base imponible del ahorro no supere los 1.800 euros". Corregir a "base imponible del ahorro". El tope de 300 euros por contrato y el reparto "por partes iguales" entre dos contribuyentes tambien estan en la AEAT y el aviso ya cubre el primero.
4. Informativo, La Rioja donaciones: el slug `donaciones-irrevocables-puras-simples-materia-mecenazgo` es la pagina padre, titulada "Por donaciones irrevocables, puras y simples en materia de mecenazgo", que agrupa cuatro deducciones (promocion y estimulo, bienes de interes cultural, empresas culturales, donacion de bienes culturales por autores). La `url` de la entrada apunta a 10_14_17, que es solo la primera ("promoción y estímulo de las actividades de fomento de mecenazgo"). El nombre y los datos (15 %, 500 euros, 30 % cuota integra autonomica) corresponden a esa primera; la correspondencia es correcta, pero el slug es mas amplio que la entrada. Los apartados "Requisitos comunes" y "Justificacion documental" de la pagina padre no se leyeron (la pagina solo mostro el indice).
5. Informativo: la pagina de AEAT de Murcia alquiler admite alquiler a mayores de 40 con familia numerosa o discapacidad >=65 %; el esquema solo recoge edad. Ya esta advertido en `avisos`. Como el motor no puede expresarlo, esos contribuyentes quedan sin deduccion modelada.
