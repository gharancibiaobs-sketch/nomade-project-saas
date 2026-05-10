import React from "react";
import { createContext, useContext, useEffect, useMemo, useState } from "react";

const CartContext = createContext(null);
const CART_KEY = "nomade-cart";

function readStoredCart() {
  try {
    return JSON.parse(window.localStorage.getItem(CART_KEY)) ?? [];
  } catch {
    return [];
  }
}

function writeStoredCart(cart) {
  try {
    window.localStorage.setItem(CART_KEY, JSON.stringify(cart));
  } catch {
    // Storage can be unavailable in restricted browser previews.
  }
}

export function CartProvider({ children }) {
  const [cart, setCart] = useState(readStoredCart);
  const [categoriaActiva, setCategoriaActiva] = useState("todos");

  useEffect(() => {
    writeStoredCart(cart);
  }, [cart]);

  const addToCart = (product) => {
    setCart((current) => {
      const existing = current.find((item) => item.id === product.id);
      if (existing) {
        return current.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...current, { ...product, quantity: 1 }];
    });
  };

  const removeFromCart = (productId) => {
    setCart((current) => current.filter((item) => item.id !== productId));
  };

  const updateQuantity = (productId, quantity) => {
    const nextQuantity = Math.max(0, Number(quantity) || 0);
    setCart((current) => {
      if (nextQuantity === 0) {
        return current.filter((item) => item.id !== productId);
      }
      return current.map((item) =>
        item.id === productId ? { ...item, quantity: nextQuantity } : item
      );
    });
  };

  const clearCart = () => setCart([]);

  const totals = useMemo(() => {
    return cart.reduce(
      (acc, item) => {
        const unitPrice = Number(item.precio_oferta ?? item.precio_original);
        acc.items += item.quantity;
        acc.amount += unitPrice * item.quantity;
        return acc;
      },
      { items: 0, amount: 0 }
    );
  }, [cart]);

  const value = {
    cart,
    totals,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    categoriaActiva,
    setCategoriaActiva
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart debe usarse dentro de CartProvider");
  }
  return context;
}
