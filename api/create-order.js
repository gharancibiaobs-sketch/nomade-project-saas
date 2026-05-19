export default async function handler(request, response) {
  if (request.method !== "POST") {
    response.status(405).json({ error: "Method not allowed" });
    return;
  }

  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) {
    response.status(500).json({ error: "API de pedidos no configurada." });
    return;
  }

  try {
    const { order } = request.body ?? {};
    if (!order?.items?.length) {
      response.status(400).json({ error: "Pedido sin items." });
      return;
    }

    const created = await insertOrder(supabaseUrl, serviceKey, order);
    await updateStock(supabaseUrl, serviceKey, order);
    await upsertClient(supabaseUrl, serviceKey, order);
    await notifyOrder(order, created?.[0]?.id);
    response.status(200).json({ orderId: created?.[0]?.id, whatsappUrl: buildWhatsAppUrl(order, created?.[0]?.id) });
  } catch (error) {
    response.status(500).json({ error: error.message ?? "No se pudo crear el pedido." });
  }
}

function buildWhatsAppUrl(order, orderId) {
  const number = process.env.ADMIN_WHATSAPP_NUMBER;
  if (!number) return "";
  const text = encodeURIComponent(`Nuevo pedido Nomade ${orderId ?? ""}\nCliente: ${order.customer_name}\nTotal: ${order.total}\nPago: ${order.status_pago}`);
  return `https://wa.me/${number.replace(/\D/g, "")}?text=${text}`;
}

async function insertOrder(supabaseUrl, serviceKey, order) {
  const result = await fetch(`${supabaseUrl}/rest/v1/pedidos?select=id`, {
    method: "POST",
    headers: headers(serviceKey),
    body: JSON.stringify(order)
  });
  const payload = await result.json();
  if (!result.ok) throw new Error(payload.message ?? "No se pudo registrar el pedido.");
  return payload;
}

async function updateStock(supabaseUrl, serviceKey, order) {
  for (const item of order.items) {
    const product = await getProduct(supabaseUrl, serviceKey, item.id);
    const quantity = Number(item.quantity ?? 0);
    const payload =
      order.status_pago === "pagado"
        ? { stock_quantity: Math.max(Number(product.stock_quantity ?? 0) - quantity, 0) }
        : order.status_pago === "pendiente_pago"
          ? { reserved_quantity: Number(product.reserved_quantity ?? 0) + quantity }
          : {};
    if (Object.keys(payload).length) {
      await patchProduct(supabaseUrl, serviceKey, item.id, payload);
    }
  }
}

async function getProduct(supabaseUrl, serviceKey, id) {
  const result = await fetch(`${supabaseUrl}/rest/v1/productos?id=eq.${id}&select=id,stock_quantity,reserved_quantity`, {
    headers: headers(serviceKey)
  });
  const payload = await result.json();
  if (!result.ok || !payload?.[0]) throw new Error("Producto no encontrado para stock.");
  return payload[0];
}

async function patchProduct(supabaseUrl, serviceKey, id, payload) {
  const result = await fetch(`${supabaseUrl}/rest/v1/productos?id=eq.${id}`, {
    method: "PATCH",
    headers: { ...headers(serviceKey), Prefer: "return=minimal" },
    body: JSON.stringify(payload)
  });
  if (!result.ok) throw new Error("No se pudo actualizar stock.");
}

async function upsertClient(supabaseUrl, serviceKey, order) {
  if (!order.customer_email) return;
  await fetch(`${supabaseUrl}/rest/v1/clientes?on_conflict=email`, {
    method: "POST",
    headers: { ...headers(serviceKey), Prefer: "resolution=merge-duplicates,return=minimal" },
    body: JSON.stringify({
      nombre: order.customer_name,
      empresa: order.customer_company,
      email: order.customer_email,
      region: order.delivery_region
    })
  });
}

async function notifyOrder(order, orderId) {
  const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL;
  const resendKey = process.env.RESEND_API_KEY;
  if (!adminEmail || !resendKey) return;
  const body = `Pedido ${orderId ?? ""}\nCliente: ${order.customer_name}\nEmail: ${order.customer_email}\nTotal: ${order.total}\nEstado pago: ${order.status_pago}`;
  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: process.env.RESEND_FROM_EMAIL || "Nomade <onboarding@resend.dev>",
      to: [adminEmail, order.customer_email].filter(Boolean),
      subject: "Nuevo pedido Nomade",
      text: body
    })
  });
}

function headers(serviceKey) {
  return {
    apikey: serviceKey,
    Authorization: `Bearer ${serviceKey}`,
    "Content-Type": "application/json"
  };
}
