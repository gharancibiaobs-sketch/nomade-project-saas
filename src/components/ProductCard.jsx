import React from "react";
import { ShoppingBag } from "lucide-react";
import { useCart } from "../context/CartContext.jsx";
import { formatCurrency, firstImage } from "../utils/format.js";

export default function ProductCard({ product }) {
  const { addToCart } = useCart();
  const image = firstImage(product);
  const hasOffer = product.precio_oferta !== null && product.precio_oferta !== undefined;

  return (
    <article className="group flex flex-col gap-5 bg-transparent">
      <div className="overflow-hidden bg-[#F0EEE9]">
        <img
          src={image}
          alt={product.nombre}
          className="aspect-[4/5] w-full object-cover grayscale-[0.1] transition duration-700 ease-out group-hover:-translate-y-2 group-hover:scale-[1.045] group-hover:grayscale-0"
        />
      </div>

      <div className="flex items-start justify-between gap-5">
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
          className="flex shrink-0 items-center justify-center gap-2 border border-[#2C2A29] bg-[#2C2A29] px-4 py-3 font-sans text-[9pt] uppercase tracking-[0.2em] text-[#FAF9F6] transition hover:bg-transparent hover:text-[#2C2A29]"
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
            <span className="text-[#2C2A29]">{formatCurrency(product.precio_oferta)}</span>
            <span className="line-through opacity-40">{formatCurrency(product.precio_original)}</span>
          </>
        ) : (
          <span className="text-[#2C2A29]">{formatCurrency(product.precio_original)}</span>
        )}
      </div>
    </article>
  );
}
