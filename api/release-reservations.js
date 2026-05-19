export default async function handler(request, response) {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) {
    response.status(500).json({ error: "API no configurada." });
    return;
  }

  const orders = await fetchJson(
    `${supabaseUrl}/rest/v1/pedidos?status_pago=eq.pendiente_pago&reservation_expires_at=lt.${encodeURIComponent(new Date().toISOString())}&select=id,items`
    , serviceKey);

  for (const order of orders) {
    for (const item of order.items ?? []) {
      const products = await fetchJson(`${supabaseUrl}/rest/v1/productos?id=eq.${item.id}&select=reserved_quantity`, serviceKey);
      const current = Number(products?.[0]?.reserved_quantity ?? 0);
      await patch(`${supabaseUrl}/rest/v1/productos?id=eq.${item.id}`, serviceKey, {
        reserved_quantity: Math.max(current - Number(item.quantity ?? 0), 0)
      });
    }
    await patch(`${supabaseUrl}/rest/v1/pedidos?id=eq.${order.id}`, serviceKey, {
      status_pago: "anulado",
      payment_status: "reservation_expired"
    });
  }

  response.status(200).json({ released: orders.length });
}

async function fetchJson(url, serviceKey) {
  const result = await fetch(url, { headers: headers(serviceKey) });
  if (!result.ok) throw new Error("No se pudieron leer reservas.");
  return result.json();
}

async function patch(url, serviceKey, body) {
  const result = await fetch(url, {
    method: "PATCH",
    headers: { ...headers(serviceKey), Prefer: "return=minimal" },
    body: JSON.stringify(body)
  });
  if (!result.ok) throw new Error("No se pudo liberar reserva.");
}

function headers(serviceKey) {
  return {
    apikey: serviceKey,
    Authorization: `Bearer ${serviceKey}`,
    "Content-Type": "application/json"
  };
}
