// src/context/CartContext.jsx
import { createContext, useContext, useState, useEffect, useMemo } from "react";
import { updateProductStock } from "../api/xano.js";

const CartContext = createContext(null);

export function CartProvider({ children }) {
  // Inicializamos carrito desde localStorage (si existe)
  const [cart, setCart] = useState(() => {
    const saved = localStorage.getItem("cart_items");
    if (!saved) return [];
    try {
      const parsed = JSON.parse(saved);
      // Normalize older cart items: ensure `image` exists when possible
      return parsed.map((it) => {
        if (it.image) return it;
        const fallback =
          it.images?.[0] ||
          it.image_url ||
          it.thumbnail ||
          it.img ||
          it.photo ||
          it.photos?.[0];
        return { ...it, image: fallback || it.image };
      });
    } catch (e) {
      console.warn("Failed to parse saved cart_items:", e);
      return [];
    }
  });

  // Guardar carrito al cambiar
  useEffect(() => {
    localStorage.setItem("cart_items", JSON.stringify(cart));
  }, [cart]);

  // Calcular total de productos (sumando cantidades)
  const count = useMemo(
    () => cart.reduce((sum, item) => sum + item.quantity, 0),
    [cart]
  );

  // ===============================
  // 🧩 FUNCIONES PRINCIPALES
  // ===============================

  // Añadir producto al carrito (acepta segundo parámetro quantity opcional)
  function addToCart(product, quantity = 1) {
    setCart((prev) => {
      const existing = prev.find((p) => p.id === product.id);
      const stock = product?.stock ?? existing?.stock ?? Infinity;

      if (existing) {
        const newQty = Math.min(existing.quantity + quantity, stock);
        const qtyDifference = newQty - existing.quantity;

        // Only update local cart quantities/reserved values here.
        // Do NOT update Xano stock until order is confirmed by admin.
        return prev.map((p) =>
          p.id === product.id
            ? {
                ...p,
                quantity: newQty,
                stock: Math.max(0, stock - qtyDifference),
                image:
                  p.image ||
                  product.image ||
                  (product.images && product.images[0]),
              }
            : p
        );
      } else {
        const addQty = Math.min(quantity, stock);
        const primaryImage =
          product.image || (product.images && product.images[0]);

        return [
          ...prev,
          {
            ...product,
            image: primaryImage,
            quantity: addQty,
            stock: Math.max(0, stock - addQty),
          },
        ];
      }
    });
  }

  // Quitar producto del carrito
  function removeFromCart(id) {
    setCart((prev) => prev.filter((p) => p.id !== id));
  }

  // Vaciar carrito
  function clearCart() {
    setCart([]);
  }

  // Cambiar cantidad
  function updateQuantity(id, quantity) {
    if (quantity < 1) return removeFromCart(id);
    setCart((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p;
        const stock = p.stock ?? Infinity;
        const newQty = Math.min(quantity, stock);
        return { ...p, quantity: newQty };
      })
    );
  }

  // Calcular total del carrito
  const total = useMemo(
    () => cart.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [cart]
  );

  // ===============================
  // 🆕 NUEVO: Payload listo para Xano
  // ===============================
  function getOrderPayload() {
    return {
      items: cart.map((item) => ({
        product_id: item.id,
        quantity: item.quantity,
        price: item.price,
      })),
      total,
    };
  }

  // ===============================
  // 🔗 EXPONER EN CONTEXTO
  // ===============================
  const value = useMemo(
    () => ({
      cart,
      count,
      total,
      addToCart,
      removeFromCart,
      clearCart,
      updateQuantity,
      getOrderPayload, // 👈 NUEVO
    }),
    [cart, count, total]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

// Hook personalizado
export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart debe usarse dentro de <CartProvider>");
  return ctx;
}
