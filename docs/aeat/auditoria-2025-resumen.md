# Auditoria de cifras IRPF 2025: deducciones autonomicas modeladas

Fecha: 2026-11-06. Alcance: las 18 deducciones que el motor calcula (`territorios[*].deducciones` de `irpf-2025.json`) contrastadas con su subpagina de la AEAT. Las otras 308 deducciones de la guia estan registradas como `noModeladas` ("pendiente de auditoria") y no se han revisado. Detalle por comunidad: `auditoria-2025-grupo-a.md` (Madrid, Cataluña, Andalucia, Asturias, Baleares), `-grupo-b.md` (Canarias, Cantabria, Castilla-La Mancha, Extremadura), `-grupo-c.md` (Murcia, La Rioja).

Recuento de los auditores: 58 ok, 12 distinto, 6 duda. Los auditores leyeron resumenes de WebFetch, no el HTML completo; los cuatro hallazgos marcados "verificado" los he contrastado yo con el texto de la AEAT.

## Resultado general

Ninguna cifra modelada (porcentaje, maximo, edad, limite de base) esta mal. Los fallos son de **cobertura y de reglas que el motor no aplica**: gente con derecho a quien el motor dice "no aplica", y dos casos donde el calculo da de mas. Para el fiscalista, de mas a menos importante:

## Sobrestiman la deduccion (el cliente veria mas ahorro del real)

1. **Cantabria, nacimiento** (verificado): en declaracion individual la deduccion "se prorrateara por mitad a cada progenitor"; el motor da el importe entero. Hasta el doble de lo correcto. Ademas vale el año del nacimiento y los dos siguientes (desde 2024) y el motor solo cuenta nacidos en el ejercicio, asi que aqui infravalora.
2. **Castilla-La Mancha, donativos** (verificado): el tope del 10 % es sobre la **base liquidable** y el motor lo aplica sobre la base imponible. El aviso del JSON lo reconoce pero el calculo no lo corrige.

## Infravaloran (el motor dice "no aplica" a quien si tiene derecho)

3. **Baleares, alquiler** (verificado): el JSON corta en 33.000 para todos; la AEAT admite 39.600 individual para familia numerosa general o monoparental con 2 o mas hijos y 42.900 para numerosa especial. Falta tambien la variante 20 %/650 (menores de 30, mayores de 65 sin actividad).
4. **Cataluña, alquiler**: solo modela 35 o menos; tambien tienen derecho parados 183 dias o mas, discapacidad 65 % o mas, viudos 65 o mas, y falta el apartado de familia numerosa o monoparental (10 %, max 1.000). Sin avisos.
5. **Andalucia, alquiler** (verificado): el tope es 1.500 con discapacidad y 1.200 en general; faltan victimas de violencia y terrorismo como supuestos. Sin avisos.
6. **Asturias, alquiler**: falta la variante 30 %/1.500 (jovenes hasta 35 y el año que cumplen 36, familias numerosas y monoparentales, violencia de genero). Ya consta en avisos.
7. **Madrid, alquiler**: falta el limite de 61.860 euros de base de la unidad familiar; sin aviso de fianza ni de que solo deduce el conyuge titular del contrato.
8. **Asturias, familia numerosa**: faltan avisos de convivencia y de reparto a partes iguales.

## Dudas abiertas

- Asturias, limite 35.000 en familia numerosa: la AEAT lo liga a un caso concreto (1 o 2 ascendientes con dos hijos); no se pudo confirmar si es general. El JSON ya lo avisa.
- Cantabria, alquiler: el minimo del 10 % es sobre la "renta del contribuyente"; el motor lo compara con la base imponible. Magnitud por aclarar. Tampoco aplica la exencion de edad por discapacidad >= 65 % que figura en avisos.
- Cataluña `minAut`: sin confirmar que sea la casilla 0520 que usa la AEAT (mirar `engine.ts`).
- Murcia: los avisos no recogen la incompatibilidad de donativos con el credito fiscal del art. 12 de la Ley 4/2022, y dicen "base liquidable del ahorro" donde la AEAT dice "base imponible del ahorro" (1.800). Leve.
- Extremadura: los avisos no recogen exclusiones por parentesco o participacion >= 50 % ni la residencia en la comunidad.
- La Rioja, mecenazgo: la entrada `noModeladas` esta bien mapeada (15 %, tope 500, 30 % de la cuota autonomica coinciden), pero su slug es la pagina padre, que agrupa 4 deducciones.

## Correctas

Canarias familia numerosa (597/796), Murcia alquiler, nacimiento y donativos, La Rioja nacimiento, Extremadura donativos y las cifras base de alquiler de Madrid, Cataluña, Andalucia, Asturias, Cantabria y Baleares coinciden con la AEAT.

## Antes de dar nada por cerrado

- Las dudas y los puntos 1 a 8 son para que un fiscalista los resuelva; esta auditoria no corrige el JSON.
- Pendiente: auditar las 308 deducciones no modeladas y las escalas y minimos por comunidad, que quedaron fuera de este alcance.
