import React from "react";
import { Link } from "react-router-dom";
import PageHeader from "../components/PageHeader.jsx";
import CheckoutPanel from "../components/CheckoutPanel.jsx";
import { useCart } from "../context/CartContext.jsx";
import { effectivePrice, formatCurrency } from "../utils/format.js";

export default function Checkout() {
  const { cart, totals, updateQuantity, removeFromCart } = useCart();

  return (
    <main className="min-h-screen bg-[#FAF9F6] text-[#252321]">
      <PageHeader backLabel="Volver al catalogo" title="Checkout" />
      <section className="mx-auto grid max-w-6xl gap-8 px-4 py-8 md:px-10 md:py-12 lg:grid-cols-[1fr_420px]">
        <div>
          <p className="font-sans text-[9pt] uppercase tracking-[0.16em] text-[#6B655F]">
            Resumen del pedido
          </p>
          <div className="mt-6 divide-y divide-[#CCC5BD] border-y border-[#CCC5BD]">
            {cart.map((item) => (
              <div key={item.id} className="grid gap-4 py-5 md:grid-cols-[1fr_auto]">
                <div>
                  <h2 className="font-serif text-2xl">{item.nombre}</h2>
                  <p className="mt-2 font-sans text-[9pt] uppercase tracking-[0.16em] text-[#6B655F]">
                    {formatCurrency(effectivePrice(item))} unidad
                  </p>
                  <div className="mt-4 flex w-fit items-center border border-[#CCC5BD]">
                    <button type="button" onClick={() => updateQuantity(item.id, item.quantity - 1)} className="h-9 w-9">-</button>
                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(event) => updateQuantity(item.id, event.target.value)}
                      className="h-9 w-14 border-x border-[#CCC5BD] bg-transparent text-center outline-none"
                    />
                    <button type="button" onClick={() => updateQuantity(item.id, item.quantity + 1)} className="h-9 w-9">+</button>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => removeFromCart(item.id)}
                  className="self-start font-sans text-[9pt] uppercase tracking-[0.16em] text-[#6B655F] hover:text-[#252321]"
                >
                  Quitar
                </button>
              </div>
            ))}
            {!cart.length && (
              <div className="py-10">
                <p className="font-serif text-xl text-[#5F5A55]">No hay productos en el pedido.</p>
                <Link to="/" className="mt-5 inline-flex border border-[#252321] px-5 py-3 font-sans text-[9pt] uppercase tracking-[0.16em]">
                  Volver al catalogo
                </Link>
              </div>
            )}
          </div>
          <div className="mt-6 flex justify-between font-serif text-2xl">
            <span>Total productos</span>
            <span>{formatCurrency(totals.amount)}</span>
          </div>
        </div>

        <aside className="h-fit border-t border-[#CCC5BD] pt-8 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0">
          <CheckoutPanel />
        </aside>
      </section>
    </main>
  );
}
