import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { ShoppingBag } from "lucide-react";
import PageHeader from "../components/PageHeader.jsx";
import QuietLoader from "../components/QuietLoader.jsx";
import { useCart } from "../context/CartContext.jsx";
import { readDemoProducts } from "../lib/demoStore.js";
import { hasSupabaseConfig, supabase } from "../lib/supabase.js";
import { effectivePrice, firstImage, formatCurrency, hasValidOffer, productSlug } from "../utils/format.js";

export default function ProductDetail() {
  const { id } = useParams();
  const { addToCart } = useCart();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState("");

  useEffect(() => {
    async function loadProduct() {
      setLoading(true);
      if (!hasSupabaseConfig) {
        const found = readDemoProducts().find(
          (item) => (item.id === id || productSlug(item) === id) && item.activo !== false
        );
        setProduct(found ?? null);
        setActiveImage(firstImage(found ?? {}));
        setLoading(false);
        return;
      }

      const { data } = await supabase
        .from("productos")
        .select("*")
        .eq("activo", true);
      const found = (data ?? []).find((item) => item.id === id || productSlug(item) === id);
      setProduct(found ?? null);
      setActiveImage(firstImage(found ?? {}));
      setLoading(false);
    }

    loadProduct();
  }, [id]);

  const images = useMemo(() => normalizeImages(product?.imagenes), [product]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF9F6] text-[#252321]">
        <QuietLoader label="Abriendo detalle" />
      </div>
    );
  }

  if (!product) {
    return (
      <main className="min-h-screen bg-[#FAF9F6] text-[#252321]">
        <PageHeader backLabel="Catalogo" />
        <section className="mx-auto max-w-2xl px-5 py-20 md:px-10">
          <h1 className="font-serif text-3xl md:text-4xl">Producto no disponible</h1>
          <p className="mt-5 font-serif text-xl leading-8 text-[#5F5A55]">
            Este producto no esta publicado actualmente.
          </p>
        </section>
      </main>
    );
  }

  const originalPrice = Number(product.precio_original ?? 0);
  const price = effectivePrice(product);
  const hasOffer = hasValidOffer(product);
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.nombre,
    description: product.descripcion,
    image: images,
    sku: product.sku,
    brand: { "@type": "Brand", name: "Nomade Project" },
    offers: {
      "@type": "Offer",
      priceCurrency: "CLP",
      price,
      availability: Number(product.stock_quantity ?? 0) > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock"
    }
  };

  return (
    <main className="min-h-screen bg-[#FAF9F6] text-[#252321]">
      <script type="application/ld+json">{JSON.stringify(structuredData)}</script>
      <PageHeader backLabel="Catalogo" />
      <section className="mx-auto grid max-w-7xl gap-8 px-4 py-8 md:px-10 md:py-12 lg:grid-cols-[1.05fr_0.8fr]">
        <div>
          <div className="overflow-hidden bg-[#F0EEE9]">
            <img
              src={activeImage || firstImage(product)}
              alt={product.nombre}
              className="aspect-[4/5] w-full object-cover"
            />
          </div>
          {images.length > 1 && (
            <div className="mt-5 grid grid-cols-4 gap-3 md:grid-cols-6">
              {images.map((image) => (
                <button
                  key={image}
                  type="button"
                  onClick={() => setActiveImage(image)}
                  className={`overflow-hidden border ${
                    activeImage === image ? "border-[#252321]" : "border-[#CCC5BD]"
                  }`}
                >
                  <img src={image} alt="" className="aspect-square w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        <article className="flex flex-col justify-center">
          <p className="font-sans text-[9pt] uppercase tracking-[0.16em] text-[#6B655F]">
            Detalle del producto
          </p>
          <div className="mt-5 flex flex-wrap gap-3 font-sans text-[8pt] uppercase tracking-[0.16em] text-[#6B655F]">
            {product.es_oferta === true && <span>En oferta</span>}
            {product.es_novedad === true && <span>Novedad</span>}
          </div>
          <h1 className="mt-5 font-serif text-3xl leading-tight md:text-5xl">{product.nombre}</h1>
          <p className="mt-6 font-serif text-xl leading-9 text-[#5F5A55]">{product.descripcion}</p>

          <div className="mt-8 space-y-3 border-y border-[#CCC5BD] py-6 font-sans text-[9pt] uppercase tracking-[0.16em] text-[#6B655F]">
            <Line label="Precio" value={formatCurrency(price)} />
            {hasOffer && <Line label="Precio original" value={formatCurrency(originalPrice)} muted />}
            <Line label="Stock" value={product.stock_quantity} />
            {product.talles && <Line label="Talles" value={product.talles} />}
            {product.medidas && <Line label="Medidas" value={product.medidas} />}
            {product.sku && <Line label="SKU" value={product.sku} />}
            {product.material && <Line label="Material" value={product.material} />}
            {product.origen && <Line label="Origen" value={product.origen} />}
            {product.color && <Line label="Color" value={product.color} />}
            {product.peso && <Line label="Peso" value={product.peso} />}
            {product.tiempo_despacho && <Line label="Despacho" value={product.tiempo_despacho} />}
          </div>
          {product.cuidados && (
            <div className="mt-8">
              <p className="font-sans text-[9pt] uppercase tracking-[0.16em] text-[#6B655F]">Cuidados</p>
              <p className="mt-3 whitespace-pre-line font-serif text-lg leading-8 text-[#5F5A55]">{product.cuidados}</p>
            </div>
          )}

          <button
            type="button"
            onClick={() => addToCart(product)}
            className="mt-8 inline-flex w-full items-center justify-center gap-3 border border-[#252321] bg-[#252321] px-5 py-4 font-sans text-[9pt] uppercase tracking-[0.16em] text-[#FAF9F6] transition hover:bg-transparent hover:text-[#252321]"
          >
            <ShoppingBag size={16} strokeWidth={1.5} />
            Agregar al pedido
          </button>
        </article>
      </section>
    </main>
  );
}

function Line({ label, value, muted = false }) {
  return (
    <div className="flex items-center justify-between gap-5">
      <span>{label}</span>
      <span className={muted ? "line-through opacity-50" : "text-[#252321]"}>{value}</span>
    </div>
  );
}

function normalizeImages(value) {
  if (Array.isArray(value)) return value.filter(Boolean);
  try {
    return JSON.parse(value ?? "[]").filter(Boolean);
  } catch {
    return [];
  }
}
