import React, { useEffect, useMemo, useState } from "react";
import PageHeader from "../components/PageHeader.jsx";
import ProductCard from "../components/ProductCard.jsx";
import QuietLoader from "../components/QuietLoader.jsx";
import { readDemoProducts } from "../lib/demoStore.js";
import { hasSupabaseConfig, supabase } from "../lib/supabase.js";

export default function Search() {
  const [query, setQuery] = useState("");
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProducts() {
      setLoading(true);
      if (!hasSupabaseConfig) {
        setProducts(readDemoProducts().filter((product) => product.activo !== false));
        setLoading(false);
        return;
      }
      const { data } = await supabase.from("productos").select("*").eq("activo", true).order("nombre");
      setProducts(data ?? []);
      setLoading(false);
    }
    loadProducts();
  }, []);

  const results = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return products;
    return products.filter((product) =>
      [product.nombre, product.descripcion, product.talles, product.medidas, product.material, product.origen, product.color, product.sku]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(needle)
    );
  }, [products, query]);

  return (
    <main className="min-h-screen bg-[#FAF9F6] text-[#252321]">
      <PageHeader backLabel="Volver al catalogo" title="Busqueda" />
      <section className="mx-auto max-w-7xl px-5 py-12 md:px-10">
        <label className="block max-w-2xl">
          <span className="mb-2 block font-sans text-[9pt] uppercase tracking-[0.16em] text-[#6B655F]">
            Buscar productos
          </span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="input text-lg"
            placeholder="Nombre, material, color, medidas, SKU"
          />
        </label>

        {loading ? (
          <QuietLoader label="Buscando seleccion" />
        ) : (
          <div className="mt-12 grid grid-cols-1 gap-x-8 gap-y-14 sm:grid-cols-2 xl:grid-cols-3">
            {results.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
