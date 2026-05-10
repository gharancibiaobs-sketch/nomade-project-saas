import { demoBranding } from "./demoData.js";
import { readDemoBranding, writeDemoBranding } from "./demoStore.js";
import { hasSupabaseConfig, supabase } from "./supabase.js";

export const brandingKeys = Object.keys(demoBranding);

export async function loadBranding() {
  if (!hasSupabaseConfig) {
    return readDemoBranding();
  }

  const { data } = await supabase.from("configuracion_sitio").select("clave, valor").in("clave", brandingKeys);
  const fromDb = Object.fromEntries((data ?? []).map((item) => [item.clave, item.valor]));
  return { ...demoBranding, ...fromDb };
}

export async function saveBranding(values) {
  if (!hasSupabaseConfig) {
    writeDemoBranding(values);
    return { error: null };
  }

  const rows = brandingKeys.map((clave) => ({ clave, valor: values[clave] ?? "" }));
  return supabase.from("configuracion_sitio").upsert(rows);
}
