"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "./CartContext";
import { useAuth } from "./AuthContext";

const API_BASE = "http://localhost:5000";

type CartDrawerProps = {
  open: boolean;
  onClose: () => void;
};

export function CartDrawer({ open, onClose }: CartDrawerProps) {
  const {
    items,
    totalItems,
    totalPrice,
    updateQuantity,
    removeFromCart,
    clearCart,
  } = useCart();

  const { token } = useAuth();
  const router = useRouter();

  const [shippingName, setShippingName] = useState("");
  const [shippingAddress, setShippingAddress] = useState("");
  const [shippingCity, setShippingCity] = useState("");
  const [shippingZip, setShippingZip] = useState("");
  const [paymentName, setPaymentName] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");

  if (!open) return null;

  const tax = totalPrice * 0.18;
  const shipping = totalPrice > 500 ? 0 : totalPrice > 0 ? 49.9 : 0;
  const grandTotal = totalPrice + tax + shipping;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!items.length) return;

    setProcessing(true);
    setError("");

    try {
      const res = await fetch(`${API_BASE}/api/orders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          items: items.map((it) => ({
            productId: it.productId,
            name: it.name,
            price: it.price,
            quantity: it.quantity,
          })),
          subtotal: totalPrice,
          tax,
          shipping,
          total: grandTotal,
          shippingName,
          shippingAddress,
          shippingCity,
          shippingZip,
          paymentName,
          cardNumber,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.message || "Order failed");
      }

      const data = await res.json();
      clearCart();
      onClose();
      router.push(
        `/order-success?code=${encodeURIComponent(data.orderCode || "")}`
      );
    } catch (err: any) {
      setError(err.message || "Unexpected error");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/40"
      onClick={onClose} // boş alana tıklayınca kapanır
    >
      <div
        className="relative mx-4 my-8 flex w-full max-w-5xl gap-4 rounded-2xl bg-slate-950 p-4 text-sm"
        onClick={(e) => e.stopPropagation()} // içeride tıklanınca KAPANMASIN
      >
        {/* KAPATMA BUTONU */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 rounded-full bg-slate-800 px-2 py-1 text-xs text-slate-200 hover:bg-slate-700"
        >
          ✕
        </button>

        {/* SOL: CART İÇERİĞİ */}
        <div className="flex-1 rounded-2xl bg-white p-5">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">
            Your Cart
          </h2>

          {items.length === 0 ? (
            <div className="flex h-full items-center justify-center text-sm text-slate-400">
              Your cart is empty.
            </div>
          ) : (
            <div className="space-y-3">
              {items.map((item) => (
                <div
                  key={item.productId}
                  className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2"
                >
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      {item.name}
                    </p>
                    <p className="text-xs text-slate-500">
                      {item.price.toFixed(1)} ₺ / adet
                    </p>
                  </div>

                  {/* Adet */}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        if (item.quantity <= 1) {
                          removeFromCart(item.productId);
                        } else {
                          updateQuantity(item.productId, item.quantity - 1);
                        }
                      }}
                      className="flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                    >
                      -
                    </button>
                    <span className="w-8 text-center text-sm font-medium text-slate-900">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        updateQuantity(item.productId, item.quantity + 1)
                      }
                      className="flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                    >
                      +
                    </button>
                  </div>

                  {/* Satır toplamı + remove */}
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-sm font-semibold text-slate-900">
                      {(item.price * item.quantity).toFixed(1)} ₺
                    </span>
                    <button
                      type="button"
                      onClick={() => removeFromCart(item.productId)}
                      className="text-[11px] text-slate-400 hover:text-red-500"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}

              <div className="pt-2 text-right">
                <button
                  type="button"
                  onClick={clearCart}
                  className="text-xs text-slate-500 hover:text-red-500"
                >
                  Clear cart
                </button>
              </div>
            </div>
          )}
        </div>

        {/* SAĞ: SUMMARY + CHECKOUT */}
        <div className="flex w-full max-w-sm flex-col gap-4">
          {/* Summary */}
          <div className="rounded-2xl bg-white p-4">
            <h3 className="mb-3 text-sm font-semibold text-slate-900">
              Summary
            </h3>
            <div className="space-y-1 text-xs text-slate-600">
              <div className="flex justify-between">
                <span>Items</span>
                <span>{totalItems}</span>
              </div>
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>{totalPrice.toFixed(1)} ₺</span>
              </div>
              <div className="flex justify-between">
                <span>Tax (18%)</span>
                <span>{tax.toFixed(1)} ₺</span>
              </div>
              <div className="flex justify-between">
                <span>Shipping</span>
                <span>
                  {shipping === 0 ? "Free" : `${shipping.toFixed(1)} ₺`}
                </span>
              </div>
              <hr className="my-2 border-slate-200" />
              <div className="flex justify-between text-sm font-semibold text-slate-900">
                <span>Total</span>
                <span>{grandTotal.toFixed(1)} ₺</span>
              </div>
            </div>
          </div>

          {/* Checkout */}
          <div className="rounded-2xl bg-white p-4">
            <h3 className="mb-3 text-sm font-semibold text-slate-900">
              Checkout
            </h3>

            <form onSubmit={handleSubmit} className="space-y-2 text-xs">
              <div>
                <label className="mb-1 block text-slate-600">Full name</label>
                <input
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-black outline-none focus:border-slate-400"
                  value={shippingName}
                  onChange={(e) => setShippingName(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="mb-1 block text-slate-600">Address</label>
                <textarea
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-black outline-none focus:border-slate-400"
                  value={shippingAddress}
                  onChange={(e) => setShippingAddress(e.target.value)}
                  rows={2}
                  required
                />
              </div>

              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="mb-1 block text-slate-600">City</label>
                  <input
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-black outline-none focus:border-slate-400"
                    value={shippingCity}
                    onChange={(e) => setShippingCity(e.target.value)}
                    required
                  />
                </div>
                <div className="w-28">
                  <label className="mb-1 block text-slate-600">ZIP Code</label>
                  <input
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-black outline-none focus:border-slate-400"
                    value={shippingZip}
                    onChange={(e) => setShippingZip(e.target.value)}
                    required
                  />
                </div>
              </div>

              <p className="pt-1 text-[11px] font-semibold text-slate-500">
                DUMMY PAYMENT
              </p>

              <div>
                <label className="mb-1 block text-slate-600">
                  Name on card
                </label>
                <input
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-black outline-none focus:border-slate-400"
                  value={paymentName}
                  onChange={(e) => setPaymentName(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="mb-1 block text-slate-600">
                  Card number (dummy)
                </label>
                <input
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-black outline-none focus:border-slate-400"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value)}
                  required
                />
              </div>

              {error && (
                <p className="pt-1 text-[11px] text-red-500">{error}</p>
              )}

              <button
                type="submit"
                disabled={processing || !items.length}
                className="mt-2 w-full rounded-full bg-slate-900 px-4 py-2 text-xs font-medium text-white hover:bg-slate-800 disabled:opacity-60"
              >
                {processing ? "Placing order..." : "Place order"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
