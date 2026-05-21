import React from "react";
import { Link } from "react-router-dom";
import { Eye, Heart, ShoppingBag } from "lucide-react";
import { useCart } from "../context/CartContext.jsx";
import { effectivePrice, formatCurrency, firstImage, hasValidOffer, productSlug } from "../utils/format.js";

export default function ProductCard({ product }) {
  const { addToCart, isFavorite, toggleFavorite } = useCart();
  const image = firstImage(product);
  const originalPrice = Number(product.precio_original ?? 0);
  const offerPrice = effectivePrice(product);
  const hasOffer = hasValidOffer(product);

  return (
    <article className="group flex flex-col gap-3 bg-transparent sm:gap-5">
      <div className="relative overflow-hidden bg-[#F0EEE9]">
        <img
          src={image}
          alt={product.nombre}
          className="aspect-square w-full object-cover grayscale-[0.1] transition duration-700 ease-out group-hover:-translate-y-2 group-hover:scale-[1.045] group-hover:grayscale-0 sm:aspect-[4/5]"
        />
        <div className="pointer-events-none absolute inset-0 flex items-end bg-[#252321]/0 p-5 opacity-0 transition duration-500 group-hover:bg-[#252321]/60 group-hover:opacity-100">
          <div className="translate-y-3 space-y-3 transition duration-500 group-hover:translate-y-0">
            {product.descripcion && (
              <p className="font-serif text-lg leading-7 text-[#FAF9F6]">{product.descripcion}</p>
            )}
            <div className="font-sans text-[9pt] uppercase tracking-[0.16em] text-[#FAF9F6]">
              <p>Stock {product.stock_quantity}</p>
              {hasOffer ? (
                <p>
                  {formatCurrency(offerPrice)} / <span className="line-through opacity-60">{formatCurrency(originalPrice)}</span>
                </p>
              ) : (
                <p>{formatCurrency(originalPrice)}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-3 sm:space-y-4">
        <button
          type="button"
          onClick={() => toggleFavorite(product.id)}
          className={`inline-flex w-full items-center justify-center gap-2 border px-3 py-2.5 font-sans text-[7.5pt] uppercase tracking-[0.12em] transition sm:px-4 sm:py-3 sm:text-[9pt] sm:tracking-[0.16em] ${
            isFavorite(product.id)
              ? "border-[#252321] bg-[#FAF9F6] text-[#252321]"
              : "border-[#CCC5BD] bg-white/40 text-[#5F5A55] hover:border-[#252321] hover:text-[#252321]"
          }`}
          aria-label={isFavorite(product.id) ? `Quitar ${product.nombre} de favoritos` : `Agregar ${product.nombre} a favoritos`}
        >
          <Heart size={14} strokeWidth={1.5} fill={isFavorite(product.id) ? "currentColor" : "none"} />
          {isFavorite(product.id) ? "Quitar de favoritos" : "Guardar como favorito"}
        </button>
        <div className="min-w-0">
          <div className="mb-2 flex flex-wrap gap-2 font-sans text-[7pt] uppercase tracking-[0.12em] text-[#6B655F] sm:mb-3 sm:text-[8pt] sm:tracking-[0.16em]">
            {product.es_oferta === true && <span>En oferta</span>}
            {product.es_novedad === true && <span>Novedad</span>}
          </div>
          <h2 className="font-serif text-[12.5pt] leading-tight text-[#252321] sm:text-[15pt]">
            {product.nombre}
          </h2>
          {(product.talles || product.medidas) && (
            <p className="mt-2 line-clamp-2 font-sans text-[7.5pt] uppercase tracking-[0.12em] text-[#6B655F] sm:mt-3 sm:text-[9pt] sm:tracking-[0.16em]">
              {[product.talles, product.medidas].filter(Boolean).join(" / ")}
            </p>
          )}
        </div>
        <Link
          to={`/producto/${productSlug(product)}`}
          className="inline-flex w-full items-center justify-center gap-2 border border-[#CCC5BD] px-3 py-2.5 text-center font-sans text-[7.5pt] uppercase tracking-[0.12em] text-[#252321] transition hover:border-[#252321] sm:px-4 sm:py-3 sm:text-[9pt] sm:tracking-[0.16em]"
        >
          <Eye size={14} strokeWidth={1.5} />
          Ver detalles del producto
        </Link>
        <button
          type="button"
          onClick={() => addToCart(product)}
          className="inline-flex w-full items-center justify-center gap-2 border border-[#252321] bg-[#252321] px-3 py-2.5 text-center font-sans text-[7.5pt] uppercase tracking-[0.12em] text-[#FAF9F6] transition hover:bg-transparent hover:text-[#252321] sm:px-4 sm:py-3 sm:text-[9pt] sm:tracking-[0.16em]"
          aria-label={`Agregar ${product.nombre} al carrito`}
          title="Agregar"
        >
          <ShoppingBag size={14} strokeWidth={1.5} />
          Agregar al carrito
        </button>
      </div>
    </article>
  );
}
