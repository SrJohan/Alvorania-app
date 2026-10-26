// Reglas de DEMOSTRACIÓN. En producción viven en la tabla tax_rules (por ejercicio y territorio),
// con fuente y revisor. Estas cifras son orientativas y NO sirven para presentar una declaración real.
export type Bracket = { upTo: number; rate: number };

export type TaxRules = {
  year: number;
  territory: string;
  sourceNote: string;
  scale: Bracket[];
  minimoPersonal: number;
  minimoDescendientes: number[];
  minimoMenor3: number;
  gastosDeducibles: number;
  limitePensiones: number;
  donativo: { firstTier: number; firstRate: number; restRate: number };
  hipotecaAnterior2013: { rate: number; maxBase: number };
};

export const RULES_2025_DEMO: TaxRules = {
  year: 2025,
  territory: "ESTATAL (escala general combinada)",
  sourceNote: "Datos de demostración pendientes de revisión por tu equipo fiscal y verificación con el simulador de la AEAT.",
  scale: [
    { upTo: 12450, rate: 0.19 },
    { upTo: 20200, rate: 0.24 },
    { upTo: 35200, rate: 0.3 },
    { upTo: 60000, rate: 0.37 },
    { upTo: 300000, rate: 0.45 },
    { upTo: Infinity, rate: 0.47 },
  ],
  minimoPersonal: 5550,
  minimoDescendientes: [2400, 2700, 4000, 4500],
  minimoMenor3: 2800,
  gastosDeducibles: 2000,
  limitePensiones: 1500,
  donativo: { firstTier: 250, firstRate: 0.8, restRate: 0.4 },
  hipotecaAnterior2013: { rate: 0.15, maxBase: 9040 },
};

export const FORAL_CCAA = ["Navarra", "País Vasco"] as const;
export const isForal = (ccaa: string) => (FORAL_CCAA as readonly string[]).includes(ccaa);
export const CCAA = [
  "Andalucía", "Aragón", "Asturias", "Baleares", "Canarias", "Cantabria", "Castilla-La Mancha",
  "Castilla y León", "Cataluña", "Comunidad Valenciana", "Extremadura", "Galicia", "La Rioja",
  "Madrid", "Murcia", "Navarra", "País Vasco", "Ceuta", "Melilla",
] as const;
