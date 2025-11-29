"use client";

import {
  createContext,
  useContext,
  useMemo,
  useState,
  ReactNode,
} from "react";

type CartItem = {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  color?: string; // 🔹 renk
  image?: string;
};

type CartContextType = {
  items: CartItem[];
  totalItems: number;
  totalPrice: number;
  addToCart: (item: CartItem) => void;
  removeFromCart: (productId: string, color?: string) => void;
  updateQuantity: (productId: string, quantity: number, color?: string) => void;
  clearCart: () => void;
};

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  const totalItems = useMemo(
    () => items.reduce((sum, it) => sum + it.quantity, 0),
    [items]
  );

  const totalPrice = useMemo(
    () => items.reduce((sum, it) => sum + it.price * it.quantity, 0),
    [items]
  );

  // 🔹 Aynı productId + color için quantity arttır
  const addToCart = (newItem: CartItem) => {
    setItems((prev) => {
      const idx = prev.findIndex(
        (it) =>
          it.productId === newItem.productId &&
          (it.color || "") === (newItem.color || "")
      );

      if (idx !== -1) {
        const copy = [...prev];
        copy[idx] = {
          ...copy[idx],
          quantity: copy[idx].quantity + newItem.quantity,
        };
        return copy;
      }
      return [...prev, newItem];
    });
  };

  const removeFromCart = (productId: string, color?: string) => {
    setItems((prev) =>
      prev.filter(
        (it) =>
          !(
            it.productId === productId &&
            (it.color || "") === (color || "")
          )
      )
    );
  };

  const updateQuantity = (
    productId: string,
    quantity: number,
    color?: string
  ) => {
    if (quantity < 1) quantity = 1;
    setItems((prev) =>
      prev.map((it) =>
        it.productId === productId && (it.color || "") === (color || "")
          ? { ...it, quantity }
          : it
      )
    );
  };

  const clearCart = () => setItems([]);

  return (
    <CartContext.Provider
      value={{
        items,
        totalItems,
        totalPrice,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error("useCart must be used inside CartProvider");
  }
  return ctx;
};
