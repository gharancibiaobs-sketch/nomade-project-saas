export default async function handler(request, response) {
  const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!accessToken || !supabaseUrl || !serviceKey) {
    response.status(500).json({ error: "Webhook no configurado." });
    return;
  }

  try {
    const topic = request.query.topic || request.query.type || request.body?.type;
    const paymentId = request.query.id || request.query["data.id"] || request.body?.data?.id;

    if (!String(topic).includes("payment") || !paymentId) {
      response.status(200).json({ received: true });
      return;
    }

    const paymentResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    });
    const payment = await paymentResponse.json();
    if (!paymentResponse.ok) {
      response.status(paymentResponse.status).json({ error: payment.message ?? "No se pudo consultar el pago." });
      return;
    }

    const orderId = payment.external_reference || payment.metadata?.order_id;
    if (!orderId) {
      response.status(200).json({ received: true, ignored: "missing_external_reference" });
      return;
    }

    const statusPago = mapPaymentStatus(payment.status);
    await updateOrder(supabaseUrl, serviceKey, orderId, {
      payment_id: String(payment.id),
      payment_status: payment.status,
      status_pago: statusPago,
      paid_at: statusPago === "pagado" ? new Date().toISOString() : null
    });

    response.status(200).json({ received: true });
  } catch (error) {
    response.status(500).json({ error: error.message ?? "Error procesando webhook." });
  }
}

function mapPaymentStatus(status) {
  if (status === "approved") return "pagado";
  if (status === "rejected" || status === "cancelled") return "rechazado";
  return "pendiente_pago";
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
    throw new Error("No se pudo actualizar el pedido desde webhook.");
  }
}
