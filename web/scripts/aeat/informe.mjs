export const MAPA_CCAA = {
  "comunidad-madrid": "Madrid",
  "comunidad-autonoma-cataluna": "Cataluña",
  "comunidad-autonoma-andalucia": "Andalucía",
  "comunidad-autonoma-aragon": "Aragón",
  "comunidad-autonoma-principado-asturias": "Asturias",
  "comunidad-autonoma-illes-balears": "Baleares",
  "comunidad-autonoma-canarias": "Canarias",
  "comunidad-autonoma-cantabria": "Cantabria",
  "comunidad-autonoma-castilla-mancha": "Castilla-La Mancha",
  "comunidad-autonoma-castilla-leon": "Castilla y León",
  "comunidad-autonoma-extremadura": "Extremadura",
  "comunidad-autonoma-galicia": "Galicia",
  "comunidad-autonoma-region-murcia": "Murcia",
  "comunidad-autonoma-rioja": "La Rioja",
  "comunitat-valenciana": "Comunidad Valenciana",
};

export function formatearInforme(informe, fecha) {
  const lineas = [`# Informe de deducciones AEAT (${fecha})`, ""];
  const apartados = [
    ["nuevas", "Nuevas"], ["desaparecidas", "Desaparecidas"],
    ["cambiadas", "Cambiadas"], ["sinLineaBase", "Sin linea base"],
  ];
  for (const [nombre, resultado] of Object.entries(informe.ccaa)) {
    if (apartados.every(([campo]) => resultado[campo].length === 0)) {
      lineas.push(`- ${nombre}: Sin cambios: ${resultado.sinCambios}`, "");
      continue;
    }
    lineas.push(`## ${nombre}`, "");
    for (const [campo, titulo] of apartados) {
      lineas.push(`### ${titulo}`, "", ...resultado[campo].map((slug) => `- ${slug}`), "");
    }
    lineas.push(`Sin cambios: ${resultado.sinCambios}`, "");
  }
  if (informe.avisos.length) {
    lineas.push("## Avisos", "", ...informe.avisos.map((aviso) => `- ${aviso}`), "");
  }
  return lineas.join("\n");
}
