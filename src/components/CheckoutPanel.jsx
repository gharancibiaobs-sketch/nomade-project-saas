import React, { useEffect, useMemo, useState } from "react";
import { CreditCard, MapPin, PackageCheck, Truck } from "lucide-react";
import { useCart } from "../context/CartContext.jsx";
import { calculateOrderTotals, getRegionCost, PAYMENT_MODE, paymentOutcomes, shippingRegions } from "../lib/commerce.js";
import { loadBranding } from "../lib/branding.js";
import { appendDemoOrder } from "../lib/demoStore.js";
import { hasSupabaseConfig, supabase } from "../lib/supabase.js";
import { effectivePrice, formatCurrency } from "../utils/format.js";

export default function CheckoutPanel() {
  const { cart, totals, clearCart } = useCart();
  const [branding, setBranding] = useState({ tax_condition: "exento", tax_percent: "19" });
  const [deliveryMethod, setDeliveryMethod] = useState("retiro");
  const [region, setRegion] = useState("metropolitana");
  const [paymentMethod, setPaymentMethod] = useState("transferencia");
  const [paymentOutcome, setPaymentOutcome] = useState("pagado");
  const [couponCode, setCouponCode] = useState("");
  const [coupon, setCoupon] = useState(null);
  const [customer, setCustomer] = useState({
    nombre: "",
    empresa: "",
    email: "",
    direccion: ""
  });
  const [status, setStatus] = useState("");
  const [isPaying, setIsPaying] = useState(false);

  useEffect(() => {
    loadBranding().then((value) => setBranding(value));
  }, []);

  const shippingCost = deliveryMethod === "domicilio" ? getRegionCost(region) : 0;
  const discountAmount = coupon ? calculateDiscount(totals.amount, coupon) : 0;
  const computed = calculateOrderTotals({
    subtotal: Math.max(totals.amount - discountAmount, 0),
    shippingCost,
    paymentMethod,
    branding
  });
  const canPay = cart.length > 0 && customer.nombre.trim() && customer.email.trim();
  const needsAddress = deliveryMethod === "domicilio";
  const addressReady = !needsAddress || customer.direccion.trim();

  const summary = useMemo(
    () =>
      cart.map((item) => ({
        id: item.id,
        nombre: item.nombre,
        categoria_id: item.categoria_id,
        quantity: item.quantity,
        unit_price: effectivePrice(item)
      })),
    [cart]
  );

  const updateCustomer = (event) => {
    const { name, value } = event.target;
    setCustomer((current) => ({ ...current, [name]: value }));
  };

  const payOrder = async () => {
    if (!canPay || !addressReady) {
      setStatus("Completa nombre, email y direccion cuando corresponda.");
      return;
    }

    setIsPaying(true);
    const order = {
      id: crypto.randomUUID(),
      items: summary,
      subtotal: totals.amount,
      discount_code: coupon?.codigo ?? "",
      discount_amount: discountAmount,
      shipping_cost: shippingCost,
      card_surcharge: computed.cardSurcharge,
      tax_condition: branding.tax_condition ?? "exento",
      tax_rate: computed.taxRate,
      tax_amount: computed.taxAmount,
      total: computed.total,
      delivery_method: deliveryMethod,
      delivery_region: deliveryMethod === "domicilio" ? region : "",
      payment_method: paymentMethod,
      payment_provider: PAYMENT_MODE === "mercadopago" ? "mercadopago" : "demo",
      payment_status: PAYMENT_MODE === "mercadopago" ? "pending" : paymentOutcome,
      status_pago: PAYMENT_MODE === "mercadopago" ? "pendiente_pago" : paymentOutcome,
      estado_logistico: "nuevo",
      reservation_expires_at:
        paymentOutcome === "pendiente_pago" || PAYMENT_MODE === "mercadopago"
          ? new Date(Date.now() + Number(branding.reservation_minutes ?? 60) * 60000).toISOString()
          : null,
      customer_name: customer.nombre.trim(),
      customer_company: customer.empresa.trim(),
      customer_email: customer.email.trim(),
      customer_address: customer.direccion.trim(),
      paid_at: paymentOutcome === "pagado" ? new Date().toISOString() : null,
      created_at: new Date().toISOString()
    };

    if (PAYMENT_MODE === "mercadopago") {
      await startMercadoPagoOrder(order);
      return;
    }

    if (!hasSupabaseConfig) {
      appendDemoOrder(order);
      clearCart();
      setStatus(buildDemoStatus(order));
      setIsPaying(false);
      return;
    }

    try {
      const response = await fetch("/api/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order: toOrderInsert(order) })
      });
      if (!response.ok) {
        const payload = await response.json();
        throw new Error(payload.error ?? "API de pedidos no disponible.");
      }
      clearCart();
      setStatus(buildDemoStatus(order));
    } catch {
      const { error } = await supabase.from("pedidos").insert(toOrderInsert(order));
      if (error) {
        setStatus(error.message);
      } else {
        clearCart();
        setStatus(`${buildDemoStatus(order)} Stock pendiente de ajustar por API.`);
      }
    }
    setIsPaying(false);
  };

  const startMercadoPagoOrder = async (order) => {
    if (!hasSupabaseConfig) {
      setStatus("Mercado Pago requiere Supabase y variables privadas de Vercel.");
      setIsPaying(false);
      return;
    }

    try {
      const orderResponse = await fetch("/api/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order: toOrderInsert(order) })
      });
      const orderPayload = await orderResponse.json();
      if (!orderResponse.ok) throw new Error(orderPayload.error ?? "No se pudo registrar el pedido.");
      const response = await fetch("/api/create-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: orderPayload.orderId, order: { ...order, id: orderPayload.orderId } })
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "No se pudo iniciar Mercado Pago.");
      window.location.href = payload.checkoutUrl;
    } catch (error) {
      setStatus(error.message);
      setIsPaying(false);
    }
  };

  const applyCoupon = async () => {
    const code = couponCode.trim().toUpperCase();
    if (!code) return;
    if (!hasSupabaseConfig) {
      if (code === "NOMADE10") {
        setCoupon({ codigo: "NOMADE10", tipo: "porcentaje", valor: 10 });
        setStatus("Cupon aplicado.");
      } else {
        setCoupon(null);
        setStatus("Cupon no encontrado.");
      }
      return;
    }
    const { data } = await supabase
      .from("cupones")
      .select("*")
      .eq("codigo", code)
      .eq("activo", true)
      .maybeSingle();
    setCoupon(data ?? null);
    setStatus(data ? "Cupon aplicado." : "Cupon no encontrado.");
  };

  return (
    <section className="mt-10 border-t border-[#CCC5BD] pt-8">
      <p className="font-sans text-[9pt] uppercase tracking-[0.16em] text-[#6B655F]">
        Confirmacion
      </p>

      <div className="mt-5 grid gap-3">
        <ChoiceButton
          active={deliveryMethod === "retiro"}
          icon={<PackageCheck size={16} strokeWidth={1.5} />}
          label="Retiro en tienda"
          detail="Sin costo adicional"
          onClick={() => setDeliveryMethod("retiro")}
        />
        <ChoiceButton
          active={deliveryMethod === "domicilio"}
          icon={<Truck size={16} strokeWidth={1.5} />}
          label="Envio a domicilio"
          detail={`Costo segun region desde ${formatCurrency(shippingRegions[0].costo)}`}
          onClick={() => setDeliveryMethod("domicilio")}
        />
      </div>

      {deliveryMethod === "domicilio" && (
        <select value={region} onChange={(event) => setRegion(event.target.value)} className="input mt-4 text-sm">
          {shippingRegions.map((item) => (
            <option key={item.id} value={item.id}>
              {item.nombre} / {formatCurrency(item.costo)}
            </option>
          ))}
        </select>
      )}

      <div className="mt-6 space-y-3">
        <input name="nombre" value={customer.nombre} onChange={updateCustomer} placeholder="Nombre comprador" className="input text-sm" />
        <input name="empresa" value={customer.empresa} onChange={updateCustomer} placeholder="Empresa" className="input text-sm" />
        <input name="email" type="email" value={customer.email} onChange={updateCustomer} placeholder="Email" className="input text-sm" />
        {deliveryMethod === "domicilio" && (
          <input name="direccion" value={customer.direccion} onChange={updateCustomer} placeholder="Direccion de envio" className="input text-sm" />
        )}
      </div>

      <div className="mt-6 grid gap-3">
        <ChoiceButton
          active={paymentMethod === "tarjeta_credito"}
          icon={<CreditCard size={16} strokeWidth={1.5} />}
          label="Tarjeta de credito"
          detail="Recargo operacional 2%"
          onClick={() => setPaymentMethod("tarjeta_credito")}
        />
        <ChoiceButton
          active={paymentMethod === "transferencia"}
          icon={<MapPin size={16} strokeWidth={1.5} />}
          label="Transferencia"
          detail="Sin recargo de tarjeta"
          onClick={() => setPaymentMethod("transferencia")}
        />
      </div>

      {PAYMENT_MODE !== "mercadopago" && (
        <select value={paymentOutcome} onChange={(event) => setPaymentOutcome(event.target.value)} className="input mt-4 text-sm">
          {paymentOutcomes.map((item) => (
            <option key={item.id} value={item.id}>
              {item.nombre}
            </option>
          ))}
        </select>
      )}

      <div className="mt-7 space-y-3 border-t border-[#CCC5BD] pt-5 font-sans text-[9pt] uppercase tracking-[0.16em] text-[#6B655F]">
        <div className="grid gap-2">
          <input
            value={couponCode}
            onChange={(event) => setCouponCode(event.target.value)}
            placeholder="Codigo descuento"
            className="input text-sm normal-case tracking-normal"
          />
          <button type="button" onClick={applyCoupon} className="border border-[#CCC5BD] px-4 py-2 transition hover:border-[#252321]">
            Aplicar cupon
          </button>
        </div>
        <Line label="Subtotal" value={formatCurrency(totals.amount)} />
        <Line label="Descuento" value={formatCurrency(discountAmount)} />
        <Line label="Envio" value={formatCurrency(shippingCost)} />
        <Line label="Recargo tarjeta" value={formatCurrency(computed.cardSurcharge)} />
        <Line label={`IVA ${Math.round(computed.taxRate * 100)}%`} value={formatCurrency(computed.taxAmount)} />
        <Line label="Total a pagar" value={formatCurrency(computed.total)} strong />
      </div>

      <button
        type="button"
        onClick={payOrder}
        disabled={!cart.length || isPaying}
        className="mt-6 w-full border border-[#252321] px-4 py-3 font-sans text-[9pt] uppercase tracking-[0.16em] transition hover:bg-[#252321] hover:text-[#FAF9F6] disabled:cursor-not-allowed disabled:border-[#CCC5BD] disabled:text-[#6B655F]"
      >
        {isPaying ? "Procesando" : PAYMENT_MODE === "mercadopago" ? "Pagar con Mercado Pago" : "Confirmar pedido demo"}
      </button>

      {status && <p className="mt-5 font-serif text-lg leading-7 text-[#5F5A55]">{status}</p>}
    </section>
  );
}

function ChoiceButton({ active, icon, label, detail, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-3 border px-4 py-3 text-left transition ${
        active ? "border-[#252321]" : "border-[#CCC5BD] hover:border-[#AFA79E]"
      }`}
    >
      <span className="text-[#252321]">{icon}</span>
      <span>
        <span className="block font-sans text-[9pt] uppercase tracking-[0.16em] text-[#252321]">
          {label}
        </span>
        <span className="mt-1 block font-serif text-sm text-[#77716B]">{detail}</span>
      </span>
    </button>
  );
}

function Line({ label, value, strong = false }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span>{label}</span>
      <span className={strong ? "text-[#252321]" : ""}>{value}</span>
    </div>
  );
}

function buildDemoStatus(order) {
  if (order.status_pago === "pagado") return `Pago aprobado. Pedido ${order.id.slice(0, 8).toUpperCase()} confirmado.`;
  if (order.status_pago === "rechazado") return "Pedido registrado como rechazado para prueba.";
  return "Pedido registrado como pendiente de pago para prueba.";
}

function toOrderInsert(order) {
  return {
    total: order.total,
    status_pago: order.status_pago,
    items: order.items,
    subtotal: order.subtotal,
    discount_code: order.discount_code,
    discount_amount: order.discount_amount,
    shipping_cost: order.shipping_cost,
    card_surcharge: order.card_surcharge,
    tax_condition: order.tax_condition,
    tax_rate: order.tax_rate,
    tax_amount: order.tax_amount,
    delivery_method: order.delivery_method,
    delivery_region: order.delivery_region,
    payment_method: order.payment_method,
    payment_provider: order.payment_provider,
    payment_status: order.payment_status,
    estado_logistico: order.estado_logistico,
    reservation_expires_at: order.reservation_expires_at,
    customer_name: order.customer_name,
    customer_company: order.customer_company,
    customer_email: order.customer_email,
    customer_address: order.customer_address,
    paid_at: order.paid_at
  };
}

function calculateDiscount(subtotal, coupon) {
  if (!coupon) return 0;
  if (coupon.tipo === "porcentaje") return Math.round(Number(subtotal ?? 0) * (Number(coupon.valor ?? 0) / 100));
  return Math.min(Number(coupon.valor ?? 0), Number(subtotal ?? 0));
}
