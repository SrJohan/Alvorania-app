export function comparar({ catalogo, hashes, baseline, json, mapaCcaa }) {
  const ccaa = {};
  const avisos = [];
  const slugsPorTerritorio = new Map();
  const territoriosMapeados = new Set(Object.values(mapaCcaa));

  for (const [nombre, territorio] of Object.entries(json.territorios)) {
    if (!territoriosMapeados.has(nombre)) {
      avisos.push(`Territorio "${nombre}" sin carpeta en mapaCcaa.`);
    }
    const slugs = new Set();
    for (const campo of ["deducciones", "noModeladas"]) {
      for (const [indice, entrada] of (territorio[campo] ?? []).entries()) {
        if (entrada.aeat) {
          slugs.add(entrada.aeat);
        } else {
          avisos.push(`Entrada ${campo}[${indice}] de "${nombre}" sin aeat.`);
        }
      }
    }
    slugsPorTerritorio.set(nombre, slugs);
  }

  for (const carpeta of Object.keys(catalogo).sort()) {
    const nombre = mapaCcaa[carpeta];
    if (!slugsPorTerritorio.has(nombre)) {
      avisos.push(`Carpeta "${carpeta}" del catálogo sin territorio en el JSON.`);
      continue;
    }
    const slugsJson = slugsPorTerritorio.get(nombre);
    const slugsCatalogo = new Set(catalogo[carpeta].map(({ slug }) => slug));
    const resultado = {
      nuevas: [], desaparecidas: [...slugsJson].filter((slug) => !slugsCatalogo.has(slug)).sort(),
      cambiadas: [], sinLineaBase: [], sinCambios: 0,
    };
    for (const slug of [...slugsCatalogo].sort()) {
      if (!slugsJson.has(slug)) resultado.nuevas.push(slug);
      if (!Object.hasOwn(baseline?.[carpeta] ?? {}, slug)) {
        resultado.sinLineaBase.push(slug);
      } else if (hashes[carpeta]?.[slug] !== baseline[carpeta][slug]) {
        resultado.cambiadas.push(slug);
      } else {
        resultado.sinCambios++;
      }
    }
    ccaa[nombre] = resultado;
  }

  return {
    ccaa: Object.fromEntries(Object.keys(ccaa).sort().map((nombre) => [nombre, ccaa[nombre]])),
    avisos: avisos.sort(),
  };
}
