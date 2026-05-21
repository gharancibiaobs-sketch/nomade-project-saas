import React, { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { Gem, Heart, LayoutDashboard, Menu, Search, ShoppingBag, X } from "lucide-react";
import { useCart } from "../context/CartContext.jsx";

export default function Navbar({ categorias, logoUrl, bannerText }) {
  const { categoriaActiva, setCategoriaActiva, totals, favorites } = useCart();
  const [menuOpen, setMenuOpen] = useState(false);

  const selectCategory = (categoryId) => {
    setCategoriaActiva(categoryId);
    setMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-20 border-b border-[#CCC5BD] bg-[#FAF9F6]/95 backdrop-blur">
      {bannerText && (
        <div className="border-b border-[#CCC5BD] bg-[#252321] px-5 py-2 text-center font-sans text-[8pt] uppercase tracking-[0.16em] text-[#FAF9F6] md:text-[9pt]">
          {bannerText}
        </div>
      )}
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 md:gap-8 md:px-8 md:py-6 lg:px-10">
        <div className="grid grid-cols-[44px_1fr_auto] items-center gap-3 md:flex md:justify-between md:gap-6">
          <button
            type="button"
            onClick={() => setMenuOpen((current) => !current)}
            className="flex h-11 w-11 items-center justify-center border border-[#CCC5BD] md:hidden"
            aria-label={menuOpen ? "Cerrar menu" : "Abrir menu"}
            aria-expanded={menuOpen}
          >
            {menuOpen ? <X size={19} strokeWidth={1.5} /> : <Menu size={21} strokeWidth={1.5} />}
          </button>

          <Link to="/" className="flex min-w-0 items-center justify-center gap-4 md:justify-start">
            {logoUrl ? (
              <img
                src={logoUrl}
                alt="Nomade Project"
                className="h-auto max-h-20 max-w-[52vw] object-contain md:max-h-32 md:max-w-[680px]"
              />
            ) : (
              <span className="font-serif text-3xl text-[#252321] md:text-4xl">Nomade Project</span>
            )}
          </Link>

          <nav className="flex items-center justify-end gap-2">
            <NavLink
              to="/buscar"
              className="flex h-11 w-11 items-center justify-center border border-[#CCC5BD] transition hover:border-[#252321]"
              title="Buscar"
              aria-label="Buscar"
            >
              <Search size={18} strokeWidth={1.5} />
            </NavLink>
            <NavLink
              to="/favoritos"
              className="hidden h-11 min-w-11 items-center justify-center gap-2 border border-[#CCC5BD] px-3 font-sans text-[9pt] uppercase tracking-[0.16em] transition hover:border-[#252321] sm:flex"
              title="Favoritos"
              aria-label="Favoritos"
            >
              <Heart size={15} strokeWidth={1.5} />
              {favorites.length}
            </NavLink>
            <NavLink
              to="/admin"
              className="hidden h-11 w-11 items-center justify-center border border-[#CCC5BD] transition hover:border-[#252321] md:flex"
              title="Admin"
              aria-label="Admin"
            >
              <LayoutDashboard size={16} strokeWidth={1.5} />
            </NavLink>
            <NavLink
              to="/checkout"
              className="relative flex h-11 min-w-11 items-center justify-center gap-2 border border-[#CCC5BD] px-3 font-sans text-[9pt] uppercase tracking-[0.16em] transition hover:border-[#252321]"
              title="Carrito"
              aria-label="Carrito"
            >
              <ShoppingBag size={17} strokeWidth={1.5} />
              <span className="hidden sm:inline">{totals.items}</span>
              <span className="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#252321] px-1 font-sans text-[8pt] text-[#FAF9F6] sm:hidden">
                {totals.items}
              </span>
            </NavLink>
          </nav>
        </div>

        <div className={`${menuOpen ? "flex" : "hidden"} flex-col gap-6 border-t border-[#CCC5BD] pt-5 md:flex md:flex-row md:flex-wrap md:items-center md:border-0 md:pt-0`}>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
            <button
              type="button"
              onClick={() => selectCategory("todos")}
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
                onClick={() => selectCategory(cat.id)}
                className={`font-sans text-[9pt] uppercase tracking-[0.16em] transition ${
                  categoriaActiva === cat.id ? "text-[#252321]" : "text-[#6B655F] hover:text-[#252321]"
                }`}
              >
                {cat.nombre}
              </button>
            ))}
            <button
              type="button"
              onClick={() => selectCategory("ofertas")}
              className={`font-sans text-[9pt] uppercase tracking-[0.16em] transition ${
                categoriaActiva === "ofertas" ? "text-[#252321]" : "text-[#6B655F] hover:text-[#252321]"
              }`}
            >
              En oferta
            </button>
            <button
              type="button"
              onClick={() => selectCategory("novedades")}
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
            className="mx-7 hidden shrink-0 text-[#AFA79E] md:block"
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
            <Link
              to="/admin"
              className="font-sans text-[9pt] uppercase tracking-[0.16em] text-[#6B655F] transition hover:text-[#252321] md:hidden"
            >
              Admin
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
