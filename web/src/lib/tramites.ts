// Los textos repiten solo lo que ya promete el resto de la web (Precios, planes, gestoría para autónomos).
export type Tramite = {
  slug: string; name: string; summary: string;
  price: string; priceNote: string;
  includes: string[]; need?: string[];
  href?: string; cta?: string; soon?: boolean;
};

const START = "/acceder?next=/app/conectar";
const LETTER = "/acceder?next=/app/requerimiento";

export const tramiteGroups: { title: string; items: Tramite[] }[] = [
  { title: "Particulares", items: [
    {
      slug: "declaracion-renta", name: "Declaración de la renta", href: START, cta: "Calcular mi renta",
      summary: "Calculas tu resultado gratis y, si quieres, un asesor revisa tu declaración y la presenta por ti.",
      price: "Desde 29 € al año", priceNote: "Calcular es gratis. Si quieres que la presentemos, ves el precio cerrado antes de pagar.",
      includes: ["Cálculo de tu resultado, sin tarjeta", "Revisión por un asesor antes de presentar", "Presentación ante Hacienda cuando tú la apruebas", "Seguimiento en tu panel"],
      need: ["Tus datos fiscales del ejercicio", "Unas respuestas sobre tu situación: hijos, hipoteca, aportaciones y donativos"],
    },
    {
      slug: "revision-ejercicios", name: "Revisión de ejercicios anteriores", href: START, cta: "Revisar mis años",
      summary: "Un asesor revisa tus declaraciones de los últimos cuatro años y, si encuentra dinero a tu favor, lo reclama por ti.",
      price: "10 € por año + 20 % del ahorro", priceNote: "El 20 % se calcula solo sobre lo que consigamos ahorrarte.",
      includes: ["Revisión de hasta cuatro ejercicios anteriores", "Reclamación ante Hacienda si hay dinero a tu favor"],
      need: ["Tus datos fiscales de los años que quieras revisar"],
    },
  ]},
  { title: "Hacienda y requerimientos", items: [
    {
      slug: "analisis-carta-hacienda", name: "Análisis de una carta de Hacienda", href: LETTER, cta: "Subir mi carta",
      summary: "Subes la carta y te explicamos qué reclama Hacienda y qué plazo tienes para responder.",
      price: "Gratis", priceNote: "Si después quieres que respondamos por ti, te decimos el precio antes.",
      includes: ["Qué te pide Hacienda, explicado sin tecnicismos", "El plazo que tienes para responder"],
      need: ["La carta de Hacienda"],
    },
    {
      slug: "respuesta-requerimiento", name: "Respuesta a un requerimiento", href: LETTER, cta: "Subir mi carta",
      summary: "Un asesor redacta la respuesta a Hacienda y la presenta por ti.",
      price: "Desde 50 €", priceNote: "50 € si el requerimiento es básico y desde 239 € si es complejo. Te decimos cuál es el tuyo antes de empezar.",
      includes: ["Análisis de la carta", "Respuesta redactada por un asesor", "Presentación ante Hacienda"],
      need: ["La carta de Hacienda", "Los documentos que pida la carta"],
    },
  ]},
  { title: "Autónomos", items: [
    {
      slug: "alta-autonomo", name: "Alta de autónomo", href: "/asesoria-gestoria", cta: "Ver la gestoría para autónomos",
      summary: "Tramitamos tu alta como autónomo y te asesoramos sobre tu base de cotización.",
      price: "Presupuesto previo", priceNote: "Depende de tu caso. Te decimos el precio antes de empezar.",
      includes: ["Trámite del alta", "Asesoramiento sobre la base de cotización"],
    },
    {
      slug: "gestoria-mensual", name: "Gestoría mensual", href: "/asesoria-gestoria", cta: "Ver los planes",
      summary: "Un gestor lleva tus impuestos trimestrales y anuales mientras tú te dedicas a tu negocio.",
      price: "Desde 29,90 € al mes", priceNote: "Plan Estándar, con un compromiso mínimo de 3 meses.",
      includes: ["Modelos trimestrales 130 y 303", "Declaración anual", "Consultas por email"],
    },
  ]},
  { title: "Internacional", items: [
    {
      slug: "modelo-720", name: "Modelo 720 (bienes en el extranjero)", soon: true,
      summary: "La declaración de las cuentas, valores e inmuebles que tienes fuera de España.",
      price: "Presupuesto previo", priceNote: "Lo valoramos caso a caso. Todavía no se tramita online.",
      includes: ["Valoración de tu caso", "Presupuesto antes de empezar"],
    },
    {
      slug: "residencia-fiscal", name: "Residencia fiscal y salida de España", soon: true,
      summary: "Para saber dónde debes tributar si vives entre países o dejas España.",
      price: "Presupuesto previo", priceNote: "Lo valoramos caso a caso. Todavía no se tramita online.",
      includes: ["Valoración de tu caso", "Presupuesto antes de empezar"],
    },
  ]},
];

export const tramites = tramiteGroups.flatMap((g) => g.items);
