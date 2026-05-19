export const PAYMENT_MODE = import.meta.env.VITE_PAYMENT_MODE ?? "demo";
export const CREDIT_CARD_SURCHARGE_RATE = 0.02;

export const shippingRegions = [
  { id: "metropolitana", nombre: "Region Metropolitana", costo: 6000 },
  { id: "valparaiso", nombre: "Region de Valparaiso", costo: 9000 },
  { id: "ohiggins", nombre: "Region de O'Higgins", costo: 9500 },
  { id: "maule", nombre: "Region del Maule", costo: 11000 },
  { id: "biobio", nombre: "Region del Biobio", costo: 13000 },
  { id: "araucania", nombre: "Region de La Araucania", costo: 14000 },
  { id: "los_lagos", nombre: "Region de Los Lagos", costo: 16000 },
  { id: "otras", nombre: "Otras regiones", costo: 18000 }
];

export const paymentOutcomes = [
  { id: "pagado", nombre: "Simular aprobado" },
  { id: "pendiente_pago", nombre: "Simular pendiente" },
  { id: "rechazado", nombre: "Simular rechazado" }
];

export function getRegionCost(regionId) {
  return shippingRegions.find((region) => region.id === regionId)?.costo ?? 0;
}

export function shouldApplyTax(branding) {
  return branding?.tax_condition === "responsable_inscripto";
}

export function getTaxRate(branding) {
  return shouldApplyTax(branding) ? Number(branding?.tax_percent ?? 19) / 100 : 0;
}

export function calculateOrderTotals({ subtotal, shippingCost, paymentMethod, branding }) {
  const cardSurcharge =
    paymentMethod === "tarjeta_credito" ? Math.round(Number(subtotal ?? 0) * CREDIT_CARD_SURCHARGE_RATE) : 0;
  const taxableAmount = Number(subtotal ?? 0) + Number(shippingCost ?? 0) + cardSurcharge;
  const taxRate = getTaxRate(branding);
  const taxAmount = Math.round(taxableAmount * taxRate);

  return {
    cardSurcharge,
    taxRate,
    taxAmount,
    total: taxableAmount + taxAmount
  };
}
