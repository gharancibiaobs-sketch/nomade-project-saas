import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { LogOut, Save, Trash2 } from "lucide-react";
import PageHeader from "../components/PageHeader.jsx";
import QuietLoader from "../components/QuietLoader.jsx";
import { readDemoOrders, writeDemoOrders } from "../lib/demoStore.js";
import { hasSupabaseConfig, supabase } from "../lib/supabase.js";
import { formatCurrency } from "../utils/format.js";

const emptyLogin = { email: "", password: "" };
const emptyOrderForm = {
  status_pago: "pagado",
  estado_logistico: "nuevo",
  delivery_method: "retiro",
  payment_method: "tarjeta_demo",
  subtotal: 0,
  shipping_cost: 0,
  card_surcharge: 0,
  tax_amount: 0,
  total: 0,
  delivery_region: "",
  payment_provider: "",
  payment_id: "",
  payment_status: "",
  checkout_url: "",
  paid_at: "",
  customer_name: "",
  customer_company: "",
  customer_email: "",
  customer_address: ""
};

export default function AdminOrders() {
  const [session, setSession] = useState(null);
  const [authReady, setAuthReady] = useState(!hasSupabaseConfig);
  const [loginForm, setLoginForm] = useState(emptyLogin);
  const [orders, setOrders] = useState([]);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [selectedId, setSelectedId] = useState("");
  const [form, setForm] = useState(emptyOrderForm);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("");

  const selectedOrder = useMemo(
    () => orders.find((order) => order.id === selectedId),
    [orders, selectedId]
  );
  const orderDirty = useMemo(() => {
    if (!selectedOrder) return false;
    return (
      form.status_pago !== (selectedOrder.status_pago ?? "pagado") ||
      form.estado_logistico !== (selectedOrder.estado_logistico ?? "nuevo") ||
      form.delivery_method !== (selectedOrder.delivery_method ?? "retiro") ||
      form.payment_method !== (selectedOrder.payment_method ?? "tarjeta_demo") ||
      Number(form.subtotal || 0) !== Number(selectedOrder.subtotal ?? 0) ||
      Number(form.shipping_cost || 0) !== Number(selectedOrder.shipping_cost ?? 0) ||
      Number(form.card_surcharge || 0) !== Number(selectedOrder.card_surcharge ?? 0) ||
      Number(form.tax_amount || 0) !== Number(selectedOrder.tax_amount ?? 0) ||
      Number(form.total || 0) !== Number(selectedOrder.total ?? 0) ||
      form.delivery_region !== (selectedOrder.delivery_region ?? "") ||
      form.payment_provider !== (selectedOrder.payment_provider ?? "") ||
      form.payment_id !== (selectedOrder.payment_id ?? "") ||
      form.payment_status !== (selectedOrder.payment_status ?? "") ||
      form.checkout_url !== (selectedOrder.checkout_url ?? "") ||
      form.customer_name !== (selectedOrder.customer_name ?? "") ||
      form.customer_company !== (selectedOrder.customer_company ?? "") ||
      form.customer_email !== (selectedOrder.customer_email ?? "") ||
      form.customer_address !== (selectedOrder.customer_address ?? "")
    );
  }, [form, selectedOrder]);
  const visibleOrders = useMemo(() => filterOrdersByDateRange(orders, dateFrom, dateTo), [orders, dateFrom, dateTo]);

  useEffect(() => {
    if (!hasSupabaseConfig) return;

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setAuthReady(true);
    });

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setAuthReady(true);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    async function loadOrders() {
      setLoading(true);
      if (hasSupabaseConfig && !session) {
        setLoading(false);
        return;
      }

      if (!hasSupabaseConfig) {
        const demoOrders = readDemoOrders();
        setOrders(demoOrders);
        setSelectedId(demoOrders[0]?.id ?? "");
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("pedidos")
        .select(
          "id,total,subtotal,discount_code,discount_amount,shipping_cost,card_surcharge,tax_amount,delivery_method,delivery_region,payment_method,payment_provider,payment_id,payment_status,checkout_url,status_pago,estado_logistico,items,customer_name,customer_company,customer_email,customer_address,paid_at,created_at"
        )
        .order("created_at", { ascending: false });

      if (error) {
        setStatus(error.message);
        setOrders([]);
      } else {
        setOrders(data ?? []);
        setSelectedId(data?.[0]?.id ?? "");
      }
      setLoading(false);
    }

    if (authReady) loadOrders();
  }, [authReady, session]);

  useEffect(() => {
    if (!selectedOrder) {
      setForm(emptyOrderForm);
      return;
    }

    setForm({
      status_pago: selectedOrder.status_pago ?? "pagado",
      estado_logistico: selectedOrder.estado_logistico ?? "nuevo",
      delivery_method: selectedOrder.delivery_method ?? "retiro",
      payment_method: selectedOrder.payment_method ?? "tarjeta_demo",
      subtotal: selectedOrder.subtotal ?? 0,
      shipping_cost: selectedOrder.shipping_cost ?? 0,
      card_surcharge: selectedOrder.card_surcharge ?? 0,
      tax_amount: selectedOrder.tax_amount ?? 0,
      total: selectedOrder.total ?? 0,
      delivery_region: selectedOrder.delivery_region ?? "",
      payment_provider: selectedOrder.payment_provider ?? "",
      payment_id: selectedOrder.payment_id ?? "",
      payment_status: selectedOrder.payment_status ?? "",
      checkout_url: selectedOrder.checkout_url ?? "",
      paid_at: selectedOrder.paid_at ? selectedOrder.paid_at.slice(0, 16) : "",
      customer_name: selectedOrder.customer_name ?? "",
      customer_company: selectedOrder.customer_company ?? "",
      customer_email: selectedOrder.customer_email ?? "",
      customer_address: selectedOrder.customer_address ?? ""
    });
  }, [selectedOrder]);

  const updateLoginForm = (event) => {
    const { name, value } = event.target;
    setLoginForm((current) => ({ ...current, [name]: value }));
  };

  const signInAdmin = async (event) => {
    event.preventDefault();
    setStatus("");
    const { error } = await supabase.auth.signInWithPassword({
      email: loginForm.email,
      password: loginForm.password
    });
    if (error) setStatus(error.message);
  };

  const signOutAdmin = async () => {
    await supabase.auth.signOut();
    setOrders([]);
    setSelectedId("");
  };

  const updateForm = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const saveOrder = async (event) => {
    event.preventDefault();
    if (!selectedOrder) return;

    const payload = {
      status_pago: form.status_pago,
      estado_logistico: form.estado_logistico,
      delivery_method: form.delivery_method,
      payment_method: form.payment_method.trim(),
      subtotal: Number(form.subtotal),
      shipping_cost: Number(form.shipping_cost),
      card_surcharge: Number(form.card_surcharge),
      tax_amount: Number(form.tax_amount),
      total: Number(form.total),
      delivery_region: form.delivery_region.trim(),
      payment_provider: form.payment_provider.trim(),
      payment_id: form.payment_id.trim(),
      payment_status: form.payment_status.trim(),
      checkout_url: form.checkout_url.trim(),
      paid_at: form.paid_at ? new Date(form.paid_at).toISOString() : null,
      customer_name: form.customer_name.trim(),
      customer_company: form.customer_company.trim(),
      customer_email: form.customer_email.trim(),
      customer_address: form.customer_address.trim()
    };

    if (!hasSupabaseConfig) {
      const nextOrders = orders.map((order) =>
        order.id === selectedId ? { ...order, ...payload } : order
      );
      setOrders(nextOrders);
      writeDemoOrders(nextOrders);
      setStatus("Pedido actualizado en modo demo.");
      return;
    }

    const { error } = await supabase.from("pedidos").update(payload).eq("id", selectedId);
    if (error) {
      setStatus(error.message);
      return;
    }

    setOrders((current) =>
      current.map((order) => (order.id === selectedId ? { ...order, ...payload } : order))
    );
    await supabase.from("audit_log").insert({
      actor_email: session?.user?.email ?? "",
      entidad: "pedido",
      entidad_id: String(selectedId),
      accion: "update",
      detalle: payload
    });
    setStatus("Pedido actualizado.");
  };

  const deleteOrder = async () => {
    if (!selectedOrder) return;
    const confirmed = window.confirm("Eliminar este pedido historico? Esta accion no se puede deshacer.");
    if (!confirmed) return;

    if (!hasSupabaseConfig) {
      const nextOrders = orders.filter((order) => order.id !== selectedId);
      setOrders(nextOrders);
      writeDemoOrders(nextOrders);
      setSelectedId(nextOrders[0]?.id ?? "");
      setStatus("Pedido eliminado en modo demo.");
      return;
    }

    const { error } = await supabase.from("pedidos").delete().eq("id", selectedId);
    if (error) {
      setStatus(error.message);
      return;
    }

    const nextOrders = orders.filter((order) => order.id !== selectedId);
    setOrders(nextOrders);
    setSelectedId(nextOrders[0]?.id ?? "");
    setStatus("Pedido eliminado.");
  };

  if (!authReady || loading) {
    return (
      <div className="min-h-screen bg-[#FAF9F6] text-[#252321]">
        <QuietLoader label="Abriendo pedidos" />
      </div>
    );
  }

  if (hasSupabaseConfig && !session) {
    return (
      <div className="min-h-screen bg-[#FAF9F6] text-[#252321]">
        <PageHeader backLabel="Catalogo" title="Pedidos historicos" />
        <main className="mx-auto max-w-md px-5 py-16 md:px-10">
          <p className="font-sans text-[9pt] uppercase tracking-[0.16em] text-[#6B655F]">
            Acceso admin
          </p>
          <h1 className="mt-5 font-serif text-5xl leading-tight">Pedidos historicos</h1>
          <form onSubmit={signInAdmin} className="mt-8 space-y-5">
            <Field label="Email">
              <input
                name="email"
                type="email"
                value={loginForm.email}
                onChange={updateLoginForm}
                className="input"
              />
            </Field>
            <Field label="Password">
              <input
                name="password"
                type="password"
                value={loginForm.password}
                onChange={updateLoginForm}
                className="input"
              />
            </Field>
            <button
              type="submit"
              className="w-full border border-[#252321] px-5 py-3 font-sans text-[9pt] uppercase tracking-[0.16em] transition hover:bg-[#252321] hover:text-[#FAF9F6]"
            >
              Entrar
            </button>
          </form>
          {status && <p className="mt-6 font-serif text-lg leading-7 text-[#5F5A55]">{status}</p>}
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-[#252321]">
      <PageHeader backLabel="Admin" backTo="/admin" title="Pedidos historicos" />
      {hasSupabaseConfig && (
        <div className="mx-auto flex max-w-7xl justify-end px-5 pt-5 md:px-8 lg:px-10">
          <button
            type="button"
            onClick={signOutAdmin}
            className="inline-flex items-center gap-3 font-sans text-[9pt] uppercase tracking-[0.16em] text-[#6B655F] hover:text-[#252321]"
          >
            <LogOut size={15} strokeWidth={1.5} />
            Salir
          </button>
        </div>
      )}

      <main className="mx-auto grid max-w-7xl gap-10 px-5 py-10 md:px-8 lg:grid-cols-[360px_minmax(0,1fr)] lg:px-10">
        <aside>
          <p className="font-sans text-[9pt] uppercase tracking-[0.16em] text-[#6B655F]">
            Seleccionar pedido
          </p>
          <div className="mt-5 grid gap-3">
            <Field label="Fecha desde">
              <input type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} className="input" />
            </Field>
            <Field label="Fecha hasta">
              <input type="date" value={dateTo} onChange={(event) => setDateTo(event.target.value)} className="input" />
            </Field>
          </div>
          <div className="quiet-scrollbar mt-5 max-h-[640px] space-y-2 overflow-auto pr-2">
            {visibleOrders.map((order) => (
              <button
                key={order.id}
                type="button"
                onClick={() => setSelectedId(order.id)}
                className={`w-full border px-4 py-3 text-left transition ${
                  selectedId === order.id ? "border-[#252321]" : "border-[#CCC5BD] hover:border-[#AFA79E]"
                }`}
              >
                <span className="block font-serif text-lg">{formatOrderName(order)}</span>
                <span className="mt-2 block font-sans text-[9pt] uppercase tracking-[0.16em] text-[#6B655F]">
                  {formatCurrency(order.total)} / {order.status_pago}
                </span>
              </button>
            ))}
            {!visibleOrders.length && (
              <p className="border border-[#CCC5BD] p-5 font-serif text-lg leading-7 text-[#5F5A55]">
                No hay pedidos registrados.
              </p>
            )}
          </div>
          <CustomerSummary orders={orders} />
        </aside>

        {selectedOrder ? (
          <section className="space-y-8">
            <div className="border-b border-[#CCC5BD] pb-6">
              <p className="font-sans text-[9pt] uppercase tracking-[0.16em] text-[#6B655F]">
                Pedido {String(selectedOrder.id).slice(0, 8)}
              </p>
              <h2 className="mt-3 font-serif text-4xl">{formatCurrency(selectedOrder.total)}</h2>
              <p className="mt-3 font-serif text-lg leading-7 text-[#5F5A55]">
                {formatDate(selectedOrder.created_at)}
              </p>
            </div>

            <form onSubmit={saveOrder} className="space-y-6">
              <div className="grid gap-5 md:grid-cols-3">
                <Field label="Estado pago">
                  <select name="status_pago" value={form.status_pago} onChange={updateForm} className="input">
                    <option value="pagado">pagado</option>
                    <option value="pendiente_pago">pendiente_pago</option>
                    <option value="rechazado">rechazado</option>
                    <option value="anulado">anulado</option>
                  </select>
                </Field>
                <Field label="Entrega">
                  <select
                    name="delivery_method"
                    value={form.delivery_method}
                    onChange={updateForm}
                    className="input"
                  >
                    <option value="retiro">retiro</option>
                    <option value="domicilio">domicilio</option>
                  </select>
                </Field>
                <Field label="Estado logistico">
                  <select name="estado_logistico" value={form.estado_logistico} onChange={updateForm} className="input">
                    <option value="nuevo">nuevo</option>
                    <option value="preparando">preparando</option>
                    <option value="listo_para_retiro">listo_para_retiro</option>
                    <option value="enviado">enviado</option>
                    <option value="entregado">entregado</option>
                    <option value="cerrado">cerrado</option>
                  </select>
                </Field>
                <Field label="Metodo pago">
                  <input
                    name="payment_method"
                    value={form.payment_method}
                    onChange={updateForm}
                    className="input"
                  />
                </Field>
              </div>

              <div className="grid gap-5 md:grid-cols-3">
                <Field label="Subtotal">
                  <input
                    name="subtotal"
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.subtotal}
                    onChange={updateForm}
                    className="input"
                  />
                </Field>
                <Field label="Envio">
                  <input
                    name="shipping_cost"
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.shipping_cost}
                    onChange={updateForm}
                    className="input"
                  />
                </Field>
                <Field label="Total">
                  <input
                    name="total"
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.total}
                    onChange={updateForm}
                    className="input"
                  />
                </Field>
                <Field label="Recargo tarjeta">
                  <input
                    name="card_surcharge"
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.card_surcharge}
                    onChange={updateForm}
                    className="input"
                  />
                </Field>
                <Field label="IVA">
                  <input
                    name="tax_amount"
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.tax_amount}
                    onChange={updateForm}
                    className="input"
                  />
                </Field>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <Field label="Region entrega">
                  <input
                    name="delivery_region"
                    value={form.delivery_region}
                    onChange={updateForm}
                    className="input"
                  />
                </Field>
                <Field label="Proveedor pago">
                  <input
                    name="payment_provider"
                    value={form.payment_provider}
                    onChange={updateForm}
                    className="input"
                  />
                </Field>
                <Field label="ID pago">
                  <input
                    name="payment_id"
                    value={form.payment_id}
                    onChange={updateForm}
                    className="input"
                  />
                </Field>
                <Field label="Estado proveedor">
                  <input
                    name="payment_status"
                    value={form.payment_status}
                    onChange={updateForm}
                    className="input"
                  />
                </Field>
                <Field label="URL checkout">
                  <input
                    name="checkout_url"
                    value={form.checkout_url}
                    onChange={updateForm}
                    className="input"
                  />
                </Field>
                <Field label="Fecha pago">
                  <input
                    name="paid_at"
                    type="datetime-local"
                    value={form.paid_at}
                    onChange={updateForm}
                    className="input"
                  />
                </Field>
                <Field label="Comprador">
                  <input
                    name="customer_name"
                    value={form.customer_name}
                    onChange={updateForm}
                    className="input"
                  />
                </Field>
                <Field label="Empresa">
                  <input
                    name="customer_company"
                    value={form.customer_company}
                    onChange={updateForm}
                    className="input"
                  />
                </Field>
                <Field label="Email">
                  <input
                    name="customer_email"
                    type="email"
                    value={form.customer_email}
                    onChange={updateForm}
                    className="input"
                  />
                </Field>
                <Field label="Direccion">
                  <input
                    name="customer_address"
                    value={form.customer_address}
                    onChange={updateForm}
                    className="input"
                  />
                </Field>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  type="submit"
                  className={saveButtonClass(orderDirty, "inline-flex items-center gap-3")}
                >
                  <Save size={15} strokeWidth={1.5} />
                  Guardar pedido
                </button>
                <button
                  type="button"
                  onClick={deleteOrder}
                  className="inline-flex items-center gap-3 border border-[#9A3F35] px-5 py-3 font-sans text-[9pt] uppercase tracking-[0.16em] text-[#7B3028] transition hover:bg-[#7B3028] hover:text-[#FAF9F6]"
                >
                  <Trash2 size={15} strokeWidth={1.5} />
                  Eliminar pedido
                </button>
              </div>
            </form>

            <OrderItems items={selectedOrder.items} />
            {status && <p className="font-serif text-lg leading-7 text-[#5F5A55]">{status}</p>}
          </section>
        ) : (
          <section className="border border-[#CCC5BD] p-8">
            <p className="font-serif text-xl leading-8 text-[#5F5A55]">
              Selecciona un pedido para editarlo o eliminarlo.
            </p>
          </section>
        )}
      </main>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="mb-2 block font-sans text-[9pt] uppercase tracking-[0.16em] text-[#6B655F]">
        {label}
      </span>
      {children}
    </label>
  );
}

function OrderItems({ items }) {
  const safeItems = Array.isArray(items) ? items : [];

  return (
    <section className="border-t border-[#CCC5BD] pt-8">
      <p className="font-sans text-[9pt] uppercase tracking-[0.16em] text-[#6B655F]">
        Productos del pedido
      </p>
      <div className="mt-5 divide-y divide-[#CCC5BD] border-y border-[#CCC5BD]">
        {safeItems.map((item) => (
          <div key={`${item.id}-${item.nombre}`} className="grid gap-3 py-4 md:grid-cols-[1fr_120px_140px]">
            <span className="font-serif text-xl">{item.nombre}</span>
            <span className="font-sans text-[9pt] uppercase tracking-[0.16em] text-[#6B655F]">
              {item.quantity} unidades
            </span>
            <span className="font-sans text-[9pt] uppercase tracking-[0.16em] text-[#6B655F]">
              {formatCurrency(item.unit_price)}
            </span>
          </div>
        ))}
        {!safeItems.length && (
          <p className="py-4 font-serif text-lg leading-7 text-[#5F5A55]">
            Este pedido no tiene detalle de productos.
          </p>
        )}
      </div>
    </section>
  );
}

function CustomerSummary({ orders }) {
  const customers = new Map();
  orders.forEach((order) => {
    const key = order.customer_email || order.customer_name;
    if (!key) return;
    const current = customers.get(key) ?? {
      name: order.customer_name,
      company: order.customer_company,
      email: order.customer_email,
      orders: 0,
      revenue: 0
    };
    current.orders += 1;
    current.revenue += Number(order.total ?? 0);
    customers.set(key, current);
  });
  const rows = [...customers.values()].sort((a, b) => b.revenue - a.revenue).slice(0, 6);

  return (
    <section className="mt-10 border-t border-[#CCC5BD] pt-6">
      <p className="font-sans text-[9pt] uppercase tracking-[0.16em] text-[#6B655F]">
        Clientes / empresas
      </p>
      <div className="mt-4 space-y-3">
        {rows.map((row) => (
          <div key={row.email || row.name} className="border border-[#CCC5BD] p-3">
            <p className="font-serif text-base">{row.company || row.name}</p>
            <p className="mt-1 font-sans text-[8pt] uppercase tracking-[0.16em] text-[#6B655F]">
              {row.orders} pedidos / {formatCurrency(row.revenue)}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

function formatOrderName(order) {
  const name = order.customer_name || "Cliente sin nombre";
  const date = formatDate(order.created_at);
  return `${name} / ${date}`;
}

function formatDate(value) {
  if (!value) return "Sin fecha";
  return new Intl.DateTimeFormat("es-CL", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

function filterOrdersByDateRange(orders, from, to) {
  if (!from && !to) return orders;
  const fromTime = from ? new Date(`${from}T00:00:00`).getTime() : Number.NEGATIVE_INFINITY;
  const toTime = to ? new Date(`${to}T23:59:59`).getTime() : Number.POSITIVE_INFINITY;
  return orders.filter((order) => {
    const time = new Date(order.created_at).getTime();
    return time >= fromTime && time <= toTime;
  });
}

function saveButtonClass(isDirty, extra = "") {
  const state = isDirty
    ? "border-[#9A3F35] bg-[#FEE2E2] text-[#7B3028] hover:bg-[#7B3028] hover:text-[#FAF9F6]"
    : "border-[#252321] text-[#252321] hover:bg-[#252321] hover:text-[#FAF9F6]";
  return `${extra} border px-5 py-3 font-sans text-[9pt] uppercase tracking-[0.16em] transition ${state}`;
}
