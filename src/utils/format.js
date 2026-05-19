export function formatCurrency(value) {
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0
  }).format(Number(value ?? 0));
}

export function effectivePrice(product) {
  const originalPrice = Number(product?.precio_original ?? product?.unit_price ?? 0);
  const offerPrice = Number(product?.precio_oferta ?? 0);
  return offerPrice > 0 && offerPrice < originalPrice ? offerPrice : originalPrice;
}

export function hasValidOffer(product) {
  const originalPrice = Number(product?.precio_original ?? 0);
  const offerPrice = Number(product?.precio_oferta ?? 0);
  return offerPrice > 0 && offerPrice < originalPrice;
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

export function slugify(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function productSlug(product) {
  return product?.slug || slugify(product?.nombre) || product?.id;
}
