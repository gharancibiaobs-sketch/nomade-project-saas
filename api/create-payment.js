export default async function handler(request, response) {
  if (request.method !== "POST") {
    response.status(405).json({ error: "Method not allowed" });
    return;
  }

  const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
  const siteUrl = process.env.VITE_SITE_URL;
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!accessToken || !siteUrl || !supabaseUrl || !serviceKey) {
    response.status(500).json({
      error: "Mercado Pago no esta configurado. Faltan variables privadas en Vercel."
    });
    return;
  }

  try {
    const { orderId, order } = request.body ?? {};
    if (!orderId || !order?.items?.length) {
      response.status(400).json({ error: "Pedido invalido para iniciar el pago." });
      return;
    }

    const preference = {
      items: [
        {
          id: String(orderId),
          title: "Pedido Nomade Project",
          quantity: 1,
          unit_price: Number(order.total),
          currency_id: "CLP"
        }
      ],
      external_reference: String(orderId),
      notification_url: `${siteUrl}/api/mercadopago-webhook`,
      back_urls: {
        success: `${siteUrl}/pago/exito`,
        pending: `${siteUrl}/pago/pendiente`,
        failure: `${siteUrl}/pago/error`
      },
      auto_return: "approved",
      metadata: {
        order_id: String(orderId)
      }
    };

    const mpResponse = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(preference)
    });
    const mpPayload = await mpResponse.json();
    if (!mpResponse.ok) {
      response.status(mpResponse.status).json({ error: mpPayload.message ?? "Mercado Pago rechazo la preferencia." });
      return;
    }

    const checkoutUrl = mpPayload.init_point || mpPayload.sandbox_init_point;
    await updateOrder(supabaseUrl, serviceKey, orderId, {
      payment_preference_id: mpPayload.id,
      checkout_url: checkoutUrl,
      payment_status: "preference_created"
    });

    response.status(200).json({ checkoutUrl, preferenceId: mpPayload.id });
  } catch (error) {
    response.status(500).json({ error: error.message ?? "Error al crear preferencia de pago." });
  }
}

async function updateOrder(supabaseUrl, serviceKey, orderId, payload) {
  const result = await fetch(`${supabaseUrl}/rest/v1/pedidos?id=eq.${orderId}`, {
    method: "PATCH",
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal"
    },
    body: JSON.stringify(payload)
  });

  if (!result.ok) {
    throw new Error("No se pudo actualizar el pedido con la preferencia de pago.");
  }
}
