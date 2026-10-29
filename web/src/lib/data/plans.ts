import type { Plan } from "./types";

// Precios de ejemplo. Los definitivos se fijan en /replica-launch.
export const PLANS: Plan[] = [
  { code: "PRO", name: "Esencial", priceCents: 3480, period: "year", chat: false,
    blurb: "Un asesor revisa tu renta y la presenta.",
    features: ["Revisión por un asesor", "Presentación ante Hacienda", "Seguimiento en tu panel"] },
  { code: "LIVE", name: "Acompañado", priceCents: 7080, period: "year", chat: true, recommended: true,
    blurb: "Además, hablas con tu asesor cuando lo necesites.",
    features: ["Todo lo de Esencial", "Chat con tu asesor", "Respuesta en 24 h laborables"] },
  { code: "FULL", name: "Completo", priceCents: 14280, period: "year", chat: true,
    blurb: "Para situaciones complejas: varias fuentes de ingresos o inversiones.",
    features: ["Todo lo de Acompañado", "Ventas de acciones y fondos", "Revisión de años anteriores"] },
];

export const planByCode = (c: string) => PLANS.find((p) => p.code === c) ?? null;

// Planes mensuales para autónomos: los usan la página de autónomos y la de precios.
export const AUTONOMO_PLANS = [
  { name: "Estándar", price: "35,88 €", list: ["Modelos trimestrales 130 y 303", "Declaración anual", "Consultas por email"] },
  { name: "Premium", price: "71,88 €", list: ["Todo lo de Estándar", "Contabilidad y facturación", "Asesor asignado por chat"], rec: true },
];
