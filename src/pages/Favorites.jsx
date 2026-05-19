import React, { useEffect, useMemo, useState } from "react";
import PageHeader from "../components/PageHeader.jsx";
import ProductCard from "../components/ProductCard.jsx";
import { useCart } from "../context/CartContext.jsx";
import { readDemoProducts } from "../lib/demoStore.js";
import { hasSupabaseConfig, supabase } from "../lib/supabase.js";

export default function Favorites() {
  const { favorites } = useCart();
  const [products, setProducts] = useState([]);

  useEffect(() => {
    async function loadProducts() {
      if (!hasSupabaseConfig) {
        setProducts(readDemoProducts().filter((product) => product.activo !== false));
        return;
      }
      const { data } = await supabase.from("productos").select("*").eq("activo", true).order("nombre");
      setProducts(data ?? []);
    }
    loadProducts();
  }, []);

  const selected = useMemo(
    () => products.filter((product) => favorites.includes(product.id)),
    [products, favorites]
  );

  return (
    <main className="min-h-screen bg-[#FAF9F6] text-[#252321]">
      <PageHeader backLabel="Volver al catalogo" title="Favoritos" />
      <section className="mx-auto max-w-7xl px-5 py-12 md:px-10">
        {selected.length ? (
          <div className="grid grid-cols-1 gap-x-8 gap-y-14 sm:grid-cols-2 xl:grid-cols-3">
            {selected.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <p className="font-serif text-xl leading-8 text-[#5F5A55]">
            Todavia no hay productos seleccionados como favoritos.
          </p>
        )}
      </section>
    </main>
  );
}
