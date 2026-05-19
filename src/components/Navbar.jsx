import React from "react";
import { Link, NavLink } from "react-router-dom";
import { Gem, Heart, LayoutDashboard, Search, ShoppingBag } from "lucide-react";
import { useCart } from "../context/CartContext.jsx";

export default function Navbar({ categorias, logoUrl, bannerText }) {
  const { categoriaActiva, setCategoriaActiva, totals, favorites } = useCart();

  return (
    <header className="sticky top-0 z-20 border-b border-[#CCC5BD] bg-[#FAF9F6]/95 backdrop-blur">
      {bannerText && (
        <div className="border-b border-[#CCC5BD] bg-[#252321] px-5 py-2 text-center font-sans text-[8pt] uppercase tracking-[0.16em] text-[#FAF9F6]">
          {bannerText}
        </div>
      )}
      <div className="mx-auto flex max-w-7xl flex-col gap-8 px-5 py-6 md:px-8 lg:px-10">
        <div className="flex items-center justify-between gap-6">
          <Link to="/" className="flex items-center gap-4">
            {logoUrl ? (
              <img
                src={logoUrl}
                alt="Nomade Project"
                className="h-auto max-h-24 max-w-[64vw] object-contain md:max-h-32 md:max-w-[680px]"
              />
            ) : (
              <span className="font-serif text-4xl text-[#252321]">Nomade Project</span>
            )}
          </Link>

          <nav className="flex items-center gap-2">
            <NavLink
              to="/buscar"
              className="flex h-10 w-10 items-center justify-center border border-[#CCC5BD] transition hover:border-[#252321]"
              title="Buscar"
              aria-label="Buscar"
            >
              <Search size={16} strokeWidth={1.5} />
            </NavLink>
            <NavLink
              to="/favoritos"
              className="flex h-10 min-w-10 items-center justify-center gap-2 border border-[#CCC5BD] px-3 font-sans text-[9pt] uppercase tracking-[0.16em] transition hover:border-[#252321]"
              title="Favoritos"
              aria-label="Favoritos"
            >
              <Heart size={15} strokeWidth={1.5} />
              {favorites.length}
            </NavLink>
            <NavLink
              to="/admin"
              className="flex h-10 w-10 items-center justify-center border border-[#CCC5BD] transition hover:border-[#252321]"
              title="Admin"
              aria-label="Admin"
            >
              <LayoutDashboard size={16} strokeWidth={1.5} />
            </NavLink>
            <span
              className="flex h-10 min-w-10 items-center justify-center gap-2 border border-[#CCC5BD] px-3 font-sans text-[9pt] uppercase tracking-[0.16em]"
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
              className={`font-sans text-[9pt] uppercase tracking-[0.16em] transition ${
                categoriaActiva === "todos" ? "text-[#252321]" : "text-[#6B655F] hover:text-[#252321]"
              }`}
            >
              Todos
            </button>
            {categorias.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setCategoriaActiva(cat.id)}
                className={`font-sans text-[9pt] uppercase tracking-[0.16em] transition ${
                  categoriaActiva === cat.id ? "text-[#252321]" : "text-[#6B655F] hover:text-[#252321]"
                }`}
              >
                {cat.nombre}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setCategoriaActiva("ofertas")}
              className={`font-sans text-[9pt] uppercase tracking-[0.16em] transition ${
                categoriaActiva === "ofertas" ? "text-[#252321]" : "text-[#6B655F] hover:text-[#252321]"
              }`}
            >
              En oferta
            </button>
            <button
              type="button"
              onClick={() => setCategoriaActiva("novedades")}
              className={`font-sans text-[9pt] uppercase tracking-[0.16em] transition ${
                categoriaActiva === "novedades" ? "text-[#252321]" : "text-[#6B655F] hover:text-[#252321]"
              }`}
            >
              Novedades
            </button>
          </div>

          <Gem
            size={15}
            strokeWidth={1.4}
            className="mx-7 shrink-0 text-[#AFA79E]"
            aria-hidden="true"
          />

          <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
            <Link
              to="/acerca"
              className="font-sans text-[9pt] uppercase tracking-[0.16em] text-[#6B655F] transition hover:text-[#252321]"
            >
              Acerca de Nomade
            </Link>
            <Link
              to="/contacto"
              className="font-sans text-[9pt] uppercase tracking-[0.16em] text-[#6B655F] transition hover:text-[#252321]"
            >
              Contacto
            </Link>
            <Link
              to="/politicas/despacho"
              className="font-sans text-[9pt] uppercase tracking-[0.16em] text-[#6B655F] transition hover:text-[#252321]"
            >
              Despacho
            </Link>
            <Link
              to="/politicas/terminos"
              className="font-sans text-[9pt] uppercase tracking-[0.16em] text-[#6B655F] transition hover:text-[#252321]"
            >
              Terminos
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
