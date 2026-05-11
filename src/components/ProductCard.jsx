import React from "react";
import { ShoppingBag } from "lucide-react";
import { useCart } from "../context/CartContext.jsx";
import { formatCurrency, firstImage } from "../utils/format.js";

export default function ProductCard({ product }) {
  const { addToCart } = useCart();
  const image = firstImage(product);
  const originalPrice = Number(product.precio_original ?? 0);
  const offerPrice = Number(product.precio_oferta ?? 0);
  const hasOffer = offerPrice > 0 && offerPrice < originalPrice;

  return (
    <article className="group flex flex-col gap-5 bg-transparent">
      <div className="relative overflow-hidden bg-[#F0EEE9]">
        <img
          src={image}
          alt={product.nombre}
          className="aspect-[4/5] w-full object-cover grayscale-[0.1] transition duration-700 ease-out group-hover:-translate-y-2 group-hover:scale-[1.045] group-hover:grayscale-0"
        />
        {product.descripcion && (
          <div className="pointer-events-none absolute inset-0 flex items-end bg-[#2C2A29]/0 p-5 opacity-0 transition duration-500 group-hover:bg-[#2C2A29]/55 group-hover:opacity-100">
            <p className="translate-y-3 font-serif text-lg leading-7 text-[#FAF9F6] transition duration-500 group-hover:translate-y-0">
              {product.descripcion}
            </p>
          </div>
        )}
      </div>

      <div className="space-y-4">
        <div className="min-w-0">
          <h2 className="font-serif text-[15pt] leading-tight text-[#2C2A29]">
            {product.nombre}
          </h2>
          <p className="mt-3 line-clamp-2 font-sans text-[9pt] uppercase tracking-[0.2em] text-[#999591]">
            Stock {product.stock_quantity} / Serie B2B
          </p>
        </div>
        <button
          type="button"
          onClick={() => addToCart(product)}
          className="inline-flex w-full items-center justify-center gap-2 border border-[#2C2A29] bg-[#2C2A29] px-4 py-3 font-sans text-[9pt] uppercase tracking-[0.2em] text-[#FAF9F6] transition hover:bg-transparent hover:text-[#2C2A29]"
          aria-label={`Agregar ${product.nombre} al carrito`}
          title="Agregar"
        >
          <ShoppingBag size={16} strokeWidth={1.5} />
          Agregar
        </button>
      </div>

      <div className="flex items-center gap-3 font-sans text-[9pt] uppercase tracking-[0.2em] text-[#999591]">
        {hasOffer ? (
          <>
            <span className="text-[#2C2A29]">{formatCurrency(offerPrice)}</span>
            <span className="line-through opacity-40">{formatCurrency(originalPrice)}</span>
          </>
        ) : (
          <span className="text-[#2C2A29]">{formatCurrency(originalPrice)}</span>
        )}
      </div>
    </article>
  );
}
