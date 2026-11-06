// Reglas del IRPF como DATOS. La fuente es src/lib/tax/data/irpf-<año>.json (cifras del Manual práctico de la AEAT,
// con la URL de cada una). El mismo JSON alimenta el motor en el navegador y la tabla tax_rules (migración 0005).
// Nada de aquí sirve para presentar una declaración real hasta que un fiscalista lo revise y lo firme.
import irpf2025 from "./data/irpf-2025.json";

export type Bracket = { hasta: number | null; tipo: number };

export type Minimos = {
  personal: number; mayor65: number; mayor75: number;
  descendientes: number[]; menor3: number;
  discapacidad33: number; discapacidad65: number; asistencia: number;
};

// Límite de renta común a todas (tributación individual). `fuente` = URL de la AEAT de donde sale cada cifra.
// `aeat` = slug de la deducción en la guía de la AEAT (clave del comprobador scripts/aeat-check.mjs).
type DedCommon = { code: string; label: string; fuente?: string; aeat?: string; maxBaseImponible?: number; maxBaseMenosMinimo?: number };

export type AutonomicDeduction = DedCommon & (
  | { tipo: "alquiler"; pct: number; max: number; edadMenorDe?: number; edadMaxima?: number; edadMayorDe?: number; alquilerMinPctBase?: number }
  // Hijos nacidos o adoptados en el ejercicio: importe del 1.º, 2.º, 3.º y siguientes (el último se repite).
  | { tipo: "nacimiento"; porHijo: number[] }
  | { tipo: "familia_numerosa"; general: number; especial: number }
  // Donativos a entidades de la comunidad: pct sobre lo donado, con tope opcional en euros o en % de la base.
  | { tipo: "donativos"; pct: number; max?: number; limitePctBase?: number }
);

export type TerritoryRules = {
  escala: Bracket[]; minimos: Minimos | "estatales"; deducciones: AutonomicDeduction[];
  fuentes?: { escala?: string; minimos?: string };
  /** Deducciones de la comunidad que el esquema no sabe calcular: las revisa el asesor. */
  noModeladas?: { nombre: string; url: string; motivo: string; aeat?: string }[];
  /** Dudas que dejó la extracción de cifras, para el fiscalista que revise el paquete. */
  avisos?: string[];
};

export type TaxRules = {
  year: number;
  status: string;
  notes: string;
  sources: Record<string, string>;
  trabajo: {
    otrosGastos: number;
    reduccion: { maxOtrasRentas: number; tramos: { hasta: number; fijo?: number; base?: number; desde?: number; pendiente?: number }[] };
  };
  deduccionSmi: { maxIntegros: number; plenoHasta: number; importe: number; pendiente: number; maxOtrasRentas: number };
  pensiones: { limite: number; pctRendimientos: number };
  donativos: { tramo: number; pctTramo: number; pctResto: number; pctRestoRecurrente: number; limitePctBase: number };
  hipotecaAnterior2013: { baseMax: number; pctEstatal: number; pctAutonomico: number };
  maternidad: { porHijo: number; guarderiaMax: number };
  escalaEstatal: Bracket[];
  escalaAhorroEstatal: Bracket[];
  escalaAhorroAutonomica: Bracket[];
  minimosEstatales: Minimos;
  territorios: Record<string, TerritoryRules>;
};

export const RULES_2025 = irpf2025 as TaxRules;

/** Comunidades con escala, mínimos y deducciones propias cargadas. El resto usa la escala supletoria y es una estimación. */
export const SUPPORTED_CCAA = Object.keys(RULES_2025.territorios);

export const FORAL_CCAA = ["Navarra", "País Vasco"] as const;
export const isForal = (ccaa: string) => (FORAL_CCAA as readonly string[]).includes(ccaa);
export const CCAA = [
  "Andalucía", "Aragón", "Asturias", "Baleares", "Canarias", "Cantabria", "Castilla-La Mancha",
  "Castilla y León", "Cataluña", "Comunidad Valenciana", "Extremadura", "Galicia", "La Rioja",
  "Madrid", "Murcia", "Navarra", "País Vasco", "Ceuta", "Melilla",
] as const;
