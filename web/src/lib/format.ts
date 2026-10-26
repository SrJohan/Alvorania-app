const eur = new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" });
export const formatEuros = (cents: number) => eur.format(cents / 100);
export const formatDateTime = (iso: string) =>
  new Intl.DateTimeFormat("es-ES", { dateStyle: "medium", timeStyle: "short", timeZone: "Europe/Madrid" }).format(new Date(iso));
export const formatDate = (iso: string) =>
  new Intl.DateTimeFormat("es-ES", { dateStyle: "long", timeZone: "Europe/Madrid" }).format(new Date(iso));
