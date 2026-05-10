export function formatCurrency(value) {
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0
  }).format(Number(value ?? 0));
}

export function firstImage(product) {
  if (Array.isArray(product.imagenes)) {
    return product.imagenes[0];
  }
  try {
    const parsed = JSON.parse(product.imagenes ?? "[]");
    return parsed[0];
  } catch {
    return "";
  }
}
