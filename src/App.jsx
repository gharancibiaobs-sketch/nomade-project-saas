import React from "react";
import { useEffect, useMemo, useState } from "react";
import CheckoutPanel from "./components/CheckoutPanel.jsx";
import Navbar from "./components/Navbar.jsx";
import ProductCard from "./components/ProductCard.jsx";
import QuietLoader from "./components/QuietLoader.jsx";
import { useCart } from "./context/CartContext.jsx";
import { readDemoCategories, readDemoLogo, readDemoProducts } from "./lib/demoStore.js";
import { hasSupabaseConfig, supabase } from "./lib/supabase.js";
import { formatCurrency } from "./utils/format.js";

export default function App() {
  const { categoriaActiva, totals, cart, removeFromCart, updateQuantity, clearCart } = useCart();
  const [categorias, setCategorias] = useState([]);
  const [productos, setProductos] = useState([]);
  const [logoUrl, setLogoUrl] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadShell() {
      if (!hasSupabaseConfig) {
        setCategorias(readDemoCategories());
        setLogoUrl(readDemoLogo());
        return;
      }

      const [{ data: categoryData }, { data: logoData }] = await Promise.all([
        supabase.from("categorias").select("*").order("nombre"),
        supabase.from("configuracion_sitio").select("valor").eq("clave", "logo_url").single()
      ]);
      setCategorias(categoryData ?? []);
      setLogoUrl(logoData?.valor ?? "");
    }

    loadShell();

    const syncDemoLogo = (event) => setLogoUrl(event.detail ?? readDemoLogo());
    const syncDemoCategories = (event) => setCategorias(event.detail ?? readDemoCategories());
    window.addEventListener("nomade-logo-updated", syncDemoLogo);
    window.addEventListener("nomade-categories-updated", syncDemoCategories);
    return () => {
      window.removeEventListener("nomade-logo-updated", syncDemoLogo);
      window.removeEventListener("nomade-categories-updated", syncDemoCategories);
    };
  }, []);

  useEffect(() => {
    async function loadProducts() {
      setLoading(true);
      if (!hasSupabaseConfig) {
        const demoProductos = readDemoProducts();
        const activeProducts = demoProductos.filter((item) => item.activo !== false);
        const filtered =
          categoriaActiva === "todos"
            ? activeProducts
            : activeProducts.filter((item) => item.categoria_id === categoriaActiva);
        window.setTimeout(() => {
          setProductos(filtered);
          setLoading(false);
        }, 260);
        return;
      }

      let query = supabase.from("productos").select("*").eq("activo", true).order("nombre");
      if (categoriaActiva !== "todos") {
        query = query.eq("categoria_id", categoriaActiva);
      }
      const { data } = await query;
      setProductos(data ?? []);
      setLoading(false);
    }

    loadProducts();
  }, [categoriaActiva]);

  const activeCategoryName = useMemo(() => {
    if (categoriaActiva === "todos") return "Coleccion completa";
    return categorias.find((cat) => cat.id === categoriaActiva)?.nombre ?? "Seleccion";
  }, [categoriaActiva, categorias]);

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-[#252321]">
      <Navbar categorias={categorias} logoUrl={logoUrl} />

      <main className="mx-auto grid max-w-7xl gap-14 px-5 py-12 md:px-8 lg:grid-cols-[1fr_320px] lg:px-10 lg:py-16">
        <section>
          <div className="mb-12 max-w-3xl animate-fadeIn">
            <p className="font-sans text-[9pt] uppercase tracking-[0.16em] text-[#6B655F]">
              Catalogo B2B curado
            </p>
            <h1 className="mt-5 font-serif text-5xl leading-[1.05] text-[#252321] md:text-7xl">
              {activeCategoryName}
            </h1>
            <p className="mt-7 max-w-2xl font-serif text-xl leading-9 text-[#5F5A55]">
            </p>
          </div>

          {loading ? (
            <QuietLoader label="Afinando seleccion" />
          ) : (
            <div className="grid animate-fadeIn grid-cols-1 gap-x-8 gap-y-14 sm:grid-cols-2 xl:grid-cols-3">
              {productos.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </section>

        <aside className="h-fit border-l border-[#CCC5BD] pl-8 lg:sticky lg:top-40">
          <p className="font-sans text-[9pt] uppercase tracking-[0.16em] text-[#6B655F]">
            Pedido en curso
          </p>
          <div className="mt-6 space-y-5">
            {cart.length === 0 ? (
              <p className="font-serif text-lg leading-7 text-[#5F5A55]">
                Selecciona tus productos para este pedido.
              </p>
            ) : (
              cart.map((item) => (
                <div key={item.id} className="border-b border-[#CCC5BD] pb-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-serif text-lg">{item.nombre}</p>
                      <div className="mt-3 flex w-fit items-center border border-[#CCC5BD]">
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="flex h-8 w-8 items-center justify-center font-sans text-sm text-[#6B655F] transition hover:text-[#252321]"
                          aria-label={`Restar ${item.nombre}`}
                        >
                          -
                        </button>
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(event) => updateQuantity(item.id, event.target.value)}
                          className="h-8 w-12 border-x border-[#CCC5BD] bg-transparent text-center font-sans text-[9pt] text-[#252321] outline-none"
                          aria-label={`Cantidad de ${item.nombre}`}
                        />
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="flex h-8 w-8 items-center justify-center font-sans text-sm text-[#6B655F] transition hover:text-[#252321]"
                          aria-label={`Sumar ${item.nombre}`}
                        >
                          +
                        </button>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFromCart(item.id)}
                      className="font-sans text-[9pt] uppercase tracking-[0.16em] text-[#6B655F] hover:text-[#252321]"
                    >
                      Quitar
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
          <div className="mt-8 flex items-center justify-between border-t border-[#CCC5BD] pt-5">
            <span className="font-sans text-[9pt] uppercase tracking-[0.16em] text-[#6B655F]">
              Total
            </span>
            <span className="font-serif text-2xl">{formatCurrency(totals.amount)}</span>
          </div>
          {cart.length > 0 && (
            <>
              <CheckoutPanel />
              <button
                type="button"
                onClick={clearCart}
                className="mt-5 w-full border border-[#CCC5BD] px-4 py-3 font-sans text-[9pt] uppercase tracking-[0.16em] text-[#6B655F] transition hover:border-[#252321] hover:text-[#252321]"
              >
                Vaciar orden
              </button>
            </>
          )}
        </aside>
      </main>
    </div>
  );
}
