import React, { useMemo, useState } from "react";
import { CreditCard, MapPin, PackageCheck, Truck } from "lucide-react";
import { useCart } from "../context/CartContext.jsx";
import { appendDemoOrder } from "../lib/demoStore.js";
import { hasSupabaseConfig, supabase } from "../lib/supabase.js";
import { formatCurrency } from "../utils/format.js";

const SHIPPING_COST = 18;

export default function CheckoutPanel() {
  const { cart, totals, clearCart } = useCart();
  const [deliveryMethod, setDeliveryMethod] = useState("retiro");
  const [paymentMethod, setPaymentMethod] = useState("tarjeta_demo");
  const [customer, setCustomer] = useState({
    nombre: "",
    empresa: "",
    email: "",
    direccion: ""
  });
  const [status, setStatus] = useState("");
  const [isPaying, setIsPaying] = useState(false);

  const shippingCost = deliveryMethod === "domicilio" ? SHIPPING_COST : 0;
  const grandTotal = totals.amount + shippingCost;
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
        unit_price: Number(item.precio_oferta ?? item.precio_original)
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
      shipping_cost: shippingCost,
      total: grandTotal,
      delivery_method: deliveryMethod,
      payment_method: paymentMethod,
      status_pago: "pagado",
      customer_name: customer.nombre.trim(),
      customer_company: customer.empresa.trim(),
      customer_email: customer.email.trim(),
      customer_address: customer.direccion.trim(),
      created_at: new Date().toISOString()
    };

    if (!hasSupabaseConfig) {
      appendDemoOrder(order);
      clearCart();
      setStatus(`Pago aprobado. Orden ${order.id.slice(0, 8).toUpperCase()} confirmada.`);
      setIsPaying(false);
      return;
    }

    const { error } = await supabase.from("pedidos").insert({
      total: order.total,
      status_pago: order.status_pago,
      items: order.items,
      subtotal: order.subtotal,
      shipping_cost: order.shipping_cost,
      delivery_method: order.delivery_method,
      payment_method: order.payment_method,
      customer_name: order.customer_name,
      customer_company: order.customer_company,
      customer_email: order.customer_email,
      customer_address: order.customer_address
    });

    if (error) {
      setStatus(error.message);
    } else {
      clearCart();
      setStatus("Pago aprobado y pedido registrado.");
    }
    setIsPaying(false);
  };

  return (
    <section className="mt-10 border-t border-[#E5E2DE] pt-8">
      <p className="font-sans text-[9pt] uppercase tracking-[0.2em] text-[#999591]">
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
          detail={`Costo ${formatCurrency(SHIPPING_COST)}`}
          onClick={() => setDeliveryMethod("domicilio")}
        />
      </div>

      <div className="mt-6 space-y-3">
        <input
          name="nombre"
          value={customer.nombre}
          onChange={updateCustomer}
          placeholder="Nombre comprador"
          className="input text-sm"
        />
        <input
          name="empresa"
          value={customer.empresa}
          onChange={updateCustomer}
          placeholder="Empresa"
          className="input text-sm"
        />
        <input
          name="email"
          type="email"
          value={customer.email}
          onChange={updateCustomer}
          placeholder="Email"
          className="input text-sm"
        />
        {deliveryMethod === "domicilio" && (
          <input
            name="direccion"
            value={customer.direccion}
            onChange={updateCustomer}
            placeholder="Direccion de envio"
            className="input text-sm"
          />
        )}
      </div>

      <div className="mt-6 grid gap-3">
        <ChoiceButton
          active={paymentMethod === "tarjeta_demo"}
          icon={<CreditCard size={16} strokeWidth={1.5} />}
          label="Pago tarjeta demo"
          detail="Aprueba inmediatamente"
          onClick={() => setPaymentMethod("tarjeta_demo")}
        />
        <ChoiceButton
          active={paymentMethod === "transferencia"}
          icon={<MapPin size={16} strokeWidth={1.5} />}
          label="Transferencia"
          detail="Registra pago como aprobado para demo"
          onClick={() => setPaymentMethod("transferencia")}
        />
      </div>

      <div className="mt-7 space-y-3 border-t border-[#E5E2DE] pt-5 font-sans text-[9pt] uppercase tracking-[0.2em] text-[#999591]">
        <Line label="Subtotal" value={formatCurrency(totals.amount)} />
        <Line label="Envio" value={formatCurrency(shippingCost)} />
        <Line label="Total a pagar" value={formatCurrency(grandTotal)} strong />
      </div>

      <button
        type="button"
        onClick={payOrder}
        disabled={!cart.length || isPaying}
        className="mt-6 w-full border border-[#2C2A29] px-4 py-3 font-sans text-[9pt] uppercase tracking-[0.2em] transition hover:bg-[#2C2A29] hover:text-[#FAF9F6] disabled:cursor-not-allowed disabled:border-[#E5E2DE] disabled:text-[#999591]"
      >
        {isPaying ? "Procesando" : "Confirmar y pagar"}
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
        active ? "border-[#2C2A29]" : "border-[#E5E2DE] hover:border-[#B8B2AB]"
      }`}
    >
      <span className="text-[#2C2A29]">{icon}</span>
      <span>
        <span className="block font-sans text-[9pt] uppercase tracking-[0.2em] text-[#2C2A29]">
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
      <span className={strong ? "text-[#2C2A29]" : ""}>{value}</span>
    </div>
  );
}
