import { defaultShippingRegions } from "./commerce.js";
import { hasSupabaseConfig, supabase } from "./supabase.js";

const SHIPPING_REGIONS_KEY = "shipping_regions";
const SHIPPING_NOTES_KEY = "shipping_admin_notes";
const DEMO_SHIPPING_KEY = "nomade-shipping-settings";

export const defaultShippingSettings = {
  regions: defaultShippingRegions,
  notes: "Revisar cobertura, tiempos y costos antes de confirmar despachos especiales."
};

export async function loadShippingSettings() {
  if (!hasSupabaseConfig) {
    return readDemoShippingSettings();
  }

  const { data } = await supabase
    .from("configuracion_sitio")
    .select("clave, valor")
    .in("clave", [SHIPPING_REGIONS_KEY, SHIPPING_NOTES_KEY]);
  const values = Object.fromEntries((data ?? []).map((item) => [item.clave, item.valor]));

  return {
    regions: parseRegions(values[SHIPPING_REGIONS_KEY]),
    notes: values[SHIPPING_NOTES_KEY] ?? defaultShippingSettings.notes
  };
}

export async function saveShippingSettings(settings) {
  const normalized = normalizeSettings(settings);
  if (!hasSupabaseConfig) {
    window.localStorage.setItem(DEMO_SHIPPING_KEY, JSON.stringify(normalized));
    return { error: null };
  }

  return supabase.from("configuracion_sitio").upsert([
    { clave: SHIPPING_REGIONS_KEY, valor: JSON.stringify(normalized.regions) },
    { clave: SHIPPING_NOTES_KEY, valor: normalized.notes }
  ]);
}

function readDemoShippingSettings() {
  try {
    const stored = JSON.parse(window.localStorage.getItem(DEMO_SHIPPING_KEY));
    return normalizeSettings(stored ?? defaultShippingSettings);
  } catch {
    return defaultShippingSettings;
  }
}

function normalizeSettings(settings) {
  return {
    regions: parseRegions(JSON.stringify(settings?.regions ?? defaultShippingRegions)),
    notes: String(settings?.notes ?? defaultShippingSettings.notes)
  };
}

function parseRegions(value) {
  try {
    const parsed = typeof value === "string" ? JSON.parse(value) : value;
    if (!Array.isArray(parsed)) return defaultShippingRegions;
    return parsed.map((region, index) => ({
      id: String(region.id || `region_${index + 1}`),
      nombre: String(region.nombre || "Region sin nombre"),
      costo: Math.max(0, Number(region.costo ?? 0))
    }));
  } catch {
    return defaultShippingRegions;
  }
}
