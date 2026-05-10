import React from "react";
import { Link, NavLink } from "react-router-dom";
import { Gem, LayoutDashboard, ShoppingBag } from "lucide-react";
import { useCart } from "../context/CartContext.jsx";

export default function Navbar({ categorias, logoUrl }) {
  const { categoriaActiva, setCategoriaActiva, totals } = useCart();

  return (
    <header className="sticky top-0 z-20 border-b border-[#E5E2DE] bg-[#FAF9F6]/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl flex-col gap-8 px-5 py-6 md:px-8 lg:px-10">
        <div className="flex items-center justify-between gap-6">
          <Link to="/" className="flex items-center gap-4">
            {logoUrl ? (
              <img
                src={logoUrl}
                alt="Nomade Project"
                className="h-auto max-h-16 max-w-[58vw] object-contain md:max-h-20 md:max-w-[520px]"
              />
            ) : (
              <span className="font-serif text-4xl text-[#2C2A29]">Nomade Project</span>
            )}
          </Link>

          <nav className="flex items-center gap-2">
            <NavLink
              to="/admin"
              className="flex h-10 w-10 items-center justify-center border border-[#E5E2DE] transition hover:border-[#2C2A29]"
              title="Admin"
              aria-label="Admin"
            >
              <LayoutDashboard size={16} strokeWidth={1.5} />
            </NavLink>
            <span
              className="flex h-10 min-w-10 items-center justify-center gap-2 border border-[#E5E2DE] px-3 font-sans text-[9pt] uppercase tracking-[0.2em]"
              title="Carrito"
            >
              <ShoppingBag size={15} strokeWidth={1.5} />
              {totals.items}
            </span>
          </nav>
        </div>

        <div className="flex flex-wrap items-center gap-y-4">
          <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
            <button
              type="button"
              onClick={() => setCategoriaActiva("todos")}
              className={`font-sans text-[9pt] uppercase tracking-[0.2em] transition ${
                categoriaActiva === "todos" ? "text-[#2C2A29]" : "text-[#999591] hover:text-[#2C2A29]"
              }`}
            >
              Todos
            </button>
            {categorias.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setCategoriaActiva(cat.id)}
                className={`font-sans text-[9pt] uppercase tracking-[0.2em] transition ${
                  categoriaActiva === cat.id ? "text-[#2C2A29]" : "text-[#999591] hover:text-[#2C2A29]"
                }`}
              >
                {cat.nombre}
              </button>
            ))}
          </div>

          <Gem
            size={15}
            strokeWidth={1.4}
            className="mx-7 shrink-0 text-[#B8B2AB]"
            aria-hidden="true"
          />

          <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
            <Link
              to="/acerca"
              className="font-sans text-[9pt] uppercase tracking-[0.2em] text-[#999591] transition hover:text-[#2C2A29]"
            >
              Acerca de Nomade
            </Link>
            <Link
              to="/contacto"
              className="font-sans text-[9pt] uppercase tracking-[0.2em] text-[#999591] transition hover:text-[#2C2A29]"
            >
              Contacto
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
