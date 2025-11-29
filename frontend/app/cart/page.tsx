"use client";

import { useState } from "react";
import { useCart } from "@/app/CartContext";
import { useRouter } from "next/navigation";
import { useAuth } from "../AuthContext";

const API_BASE = "http://localhost:5000";

export default function CartPage() {
  const {
    items,
    totalItems,
    totalPrice, // subtotal
    removeFromCart,
    updateQuantity,
    clearCart,
  } = useCart();

  const router = useRouter();
  const { user, token } = useAuth();

  // checkout form state
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [zip, setZip] = useState("");
  const [cardName, setCardName] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");

  // tax & shipping
  const tax = totalPrice * 0.18; // %18 KDV
  const shipping = totalPrice > 500 ? 0 : totalPrice > 0 ? 49.9 : 0;
  const grandTotal = totalPrice + tax + shipping;

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!items.length) {
      setError("Your cart is empty.");
      return;
    }

    if (!name || !address || !city || !zip || !cardName || !cardNumber) {
      setError("Please fill all fields.");
      return;
    }

    setProcessing(true);

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
            color: it.color, // seçilen rengi de gönder
          })),
          subtotal: totalPrice,
          tax,
          shipping,
          total: grandTotal,
          shippingName: name,
          shippingAddress: address,
          shippingCity: city,
          shippingZip: zip,
          paymentName: cardName,
          cardNumber,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.message || "Order could not be created.");
        setProcessing(false);
        return;
      }

      const data = await res.json(); // { orderCode, orderId, ... }

      clearCart();
      setProcessing(false);

      // yeni sayfaya yönlendir
      router.push(`/order-success?code=${encodeURIComponent(data.orderCode)}`);
    } catch (err) {
      setError("Something went wrong.");
      setProcessing(false);
    }
  };

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="mb-4 text-2xl font-semibold text-slate-900">
        Your Cart
      </h1>

      <div className="grid gap-6 md:grid-cols-[2fr_1.2fr]">
        {/* Items */}
        <div className="rounded-xl bg-white p-4 shadow-sm">
          {items.length === 0 ? (
            <div className="py-8 text-center text-sm text-slate-500">
              Your cart is empty.
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-xs uppercase text-slate-400">
                  <th className="py-2">Product</th>
                  <th className="py-2">Qty</th>
                  <th className="py-2">Price</th>
                  <th className="py-2">Total</th>
                  <th className="py-2" />
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr
                    key={item.productId}
                    className="border-b border-slate-100"
                  >
                    <td className="py-2 pr-4">
                      <div className="text-slate-800 font-medium">
                        {item.name}
                      </div>
                      {item.color && (
                        <div className="mt-0.5 text-xs text-black text-slate-500">
                          Color: {item.color}
                        </div>
                      )}
                    </td>
                    <td className="py-2">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            updateQuantity(item.productId, item.quantity - 1)
                          }
                          className="flex h-7 w-7 items-center justify-center rounded-full border border-slate-300 text-xs text-slate-700 hover:bg-slate-50"
                        >
                          -
                        </button>
                        <input
                          type="number"
                          min={1}
                          max={10}
                          value={item.quantity}
                          onChange={(e) =>
                            updateQuantity(
                              item.productId,
                              parseInt(e.target.value || "1", 10)
                            )
                          }
                          className="h-7 w-12 rounded-lg border border-slate-300 px-2 text-center text-xs text-slate-900 outline-none focus:border-slate-500"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            updateQuantity(item.productId, item.quantity + 1)
                          }
                          className="flex h-7 w-7 items-center justify-center rounded-full border border-slate-300 text-xs text-slate-700 hover:bg-slate-50"
                        >
                          +
                        </button>
                      </div>
                    </td>
                    <td className="py-2 text-slate-700">
                      {item.price.toFixed(1)} ₺
                    </td>
                    <td className="py-2 text-slate-900">
                      {(item.price * item.quantity).toFixed(1)} ₺
                    </td>
                    <td className="py-2 text-right">
                      <button
                        onClick={() => removeFromCart(item.productId)}
                        className="text-xs text-red-500 hover:underline"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Summary + Checkout */}
        <div className="space-y-4">
          {/* Summary */}
          <div className="rounded-xl bg-white p-4 shadow-sm">
            <h2 className="mb-3 text-lg font-semibold text-slate-900">
              Summary
            </h2>
            <div className="mb-1 flex justify-between text-sm text-slate-700">
              <span>Items</span>
              <span>{totalItems}</span>
            </div>
            <div className="mb-1 flex justify-between text-sm text-slate-700">
              <span>Subtotal</span>
              <span>{totalPrice.toFixed(1)} ₺</span>
            </div>
            <div className="mb-1 flex justify-between text-sm text-slate-700">
              <span>Tax (18%)</span>
              <span>{tax.toFixed(1)} ₺</span>
            </div>
            <div className="mb-3 flex justify-between text-sm text-slate-700">
              <span>Shipping</span>
              <span>
                {shipping === 0 ? "Free" : `${shipping.toFixed(1)} ₺`}
              </span>
            </div>
            <div className="flex justify-between border-t border-slate-200 pt-3 text-sm font-semibold text-slate-900">
              <span>Total</span>
              <span>{grandTotal.toFixed(1)} ₺</span>
            </div>
          </div>

          {/* Checkout form */}
          <div className="rounded-xl bg-white p-4 shadow-sm">
            <h2 className="mb-3 text-lg font-semibold text-slate-900">
              Checkout
            </h2>

            {error && (
              <p className="mb-2 text-xs text-red-500">{error}</p>
            )}

            <form onSubmit={handleCheckout} className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">
                  Full name
                </label>
                <input
                  type="text"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-900 outline-none focus:border-slate-400"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">
                  Address
                </label>
                <textarea
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-900 outline-none focus:border-slate-400"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600">
                    City
                  </label>
                  <input
                    type="text"
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-900 outline-none focus:border-slate-400"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600">
                    ZIP Code
                  </label>
                  <input
                    type="text"
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-900 outline-none focus:border-slate-400"
                    value={zip}
                    onChange={(e) => setZip(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="border-t border-slate-200 pt-3">
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Dummy payment
                </h3>
                <div className="mb-2">
                  <label className="mb-1 block text-xs font-medium text-slate-600">
                    Name on card
                  </label>
                  <input
                    type="text"
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-900 outline-none focus:border-slate-400"
                    value={cardName}
                    onChange={(e) => setCardName(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600">
                    Card number (dummy)
                  </label>
                  <input
                    type="text"
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-900 outline-none focus:border-slate-400"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={processing}
                className="mt-3 w-full rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
              >
                {processing ? "Processing..." : "Place order"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </main>
  );
}
