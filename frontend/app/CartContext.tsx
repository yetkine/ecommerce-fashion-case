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
};

type AddItemPayload = {
  productId: string;
  name: string;
  price: number;
  quantity?: number;
};

type CartContextValue = {
  items: CartItem[];
  addToCart: (item: AddItemPayload) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number; // subtotal
};

const CartContext = createContext<CartContextValue | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  const addToCart = (item: AddItemPayload) => {
    const qty = item.quantity && item.quantity > 0 ? item.quantity : 1;

    setItems((prev) => {
      const existing = prev.find((p) => p.productId === item.productId);
      if (existing) {
        return prev.map((p) =>
          p.productId === item.productId
            ? { ...p, quantity: p.quantity + qty }
            : p
        );
      }
      return [...prev, { ...item, quantity: qty }];
    });
  };

  const removeFromCart = (productId: string) => {
    setItems((prev) => prev.filter((p) => p.productId !== productId));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity < 1) quantity = 1;
    if (quantity > 10) quantity = 10;

    setItems((prev) =>
      prev.map((p) =>
        p.productId === productId ? { ...p, quantity } : p
      )
    );
  };

  const clearCart = () => {
    setItems([]);
  };

  const { totalItems, totalPrice } = useMemo(() => {
    let ti = 0;
    let tp = 0;
    for (const item of items) {
      ti += item.quantity;
      tp += item.price * item.quantity;
    }
    return { totalItems: ti, totalPrice: tp };
  }, [items]);

  const value: CartContextValue = {
    items,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    totalItems,
    totalPrice,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error("useCart must be used inside CartProvider");
  }
  return ctx;
}
