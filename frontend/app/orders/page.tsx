// frontend/app/orders/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "../AuthContext";

const API_BASE = "https://ecommerce-fashion-case.onrender.com";


type OrderItem = {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  color?: string | null;
  image?: string | null;
};

type Order = {
  _id: string;
  orderCode?: string;
  total?: number;
  status?: string;
  createdAt?: string;
  shippingName?: string;
  items: OrderItem[];
};

export default function MyOrdersPage() {
  const { user, token, loading } = useAuth();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    const fetchOrders = async () => {
      try {
        setLoadingOrders(true);
        setError(null);

        const res = await fetch(`${API_BASE}/api/orders/my`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.message || "Could not load orders");
        }

        const json = await res.json();
        setOrders(json.orders ?? []);
      } catch (err: any) {
        console.error("orders/my error:", err);
        setError(err?.message || "Something went wrong");
      } finally {
        setLoadingOrders(false);
      }
    };

    fetchOrders();
  }, [token]);

  // Login değilse
  if (!loading && !user) {
    return (
      <main className="min-h-screen bg-slate-50">
        <div className="mx-auto max-w-4xl px-4 py-10 space-y-4">
          <h1 className="text-2xl font-semibold text-slate-900">
            My Orders
          </h1>
          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <p className="mb-4 text-sm text-slate-600">
              You need to be logged in to see your order history.
            </p>
            <div className="flex gap-3">
              <Link
                href="/"
                className="rounded-full bg-slate-900 px-4 py-2 text-xs font-medium text-white hover:bg-slate-800"
              >
                Back to store
              </Link>
              <Link
                href="/login"
                className="rounded-full border border-slate-200 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
              >
                Go to login
              </Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-4xl px-4 py-10 space-y-6">
        <header className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-slate-900">
            My Orders
          </h1>
          <Link
            href="/"
            className="text-xs text-slate-600 hover:underline"
          >
            ← Back to store
          </Link>
        </header>

        {loadingOrders ? (
          <div className="rounded-2xl bg-white p-6 text-sm text-slate-500 shadow-sm">
            Loading your orders...
          </div>
        ) : error ? (
          <div className="rounded-2xl bg-white p-6 text-sm text-red-500 shadow-sm">
            {error}
          </div>
        ) : orders.length === 0 ? (
          <div className="rounded-2xl bg-white p-6 text-sm text-slate-500 shadow-sm">
            You have no orders yet.
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div
                key={order._id}
                className="rounded-2xl bg-white p-4 shadow-sm"
              >
                {/* Üst satır: kod, tarih, status, total */}
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="text-sm font-semibold text-slate-900">
                      {order.orderCode || "Order"}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      {order.createdAt
                        ? new Date(order.createdAt).toLocaleString()
                        : ""}
                    </div>
                    {order.shippingName && (
                      <div className="text-[11px] text-slate-500">
                        {order.shippingName}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col items-end gap-1 text-right">
                    <span className="inline-flex items-center justify-center rounded-full bg-slate-100 px-3 py-1 text-[11px] font-medium capitalize text-slate-700">
                      {order.status ?? "created"}
                    </span>
                    <div className="text-sm font-semibold text-slate-900">
                      {(order.total ?? 0).toFixed(1)} ₺
                    </div>
                    <div className="text-[11px] text-slate-500">
                      {order.items.length} items
                    </div>
                  </div>
                </div>

                {/* Ürünler listesi */}
                <div className="space-y-2 border-t border-slate-100 pt-3">
                  {order.items.map((item, idx) => (
                    <div
                      key={`${item.productId}-${item.color || "default"}-${idx}`}
                      className="flex gap-3 rounded-xl bg-slate-50 p-2"
                    >
                      {/* Küçük görsel varsa göster */}
                      {item.image ? (
                        <div className="relative h-14 w-14 overflow-hidden rounded-lg bg-slate-200">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={item.image}
                            alt={item.name}
                            className="h-full w-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="h-14 w-14 rounded-lg bg-slate-200" />
                      )}

                      <div className="flex flex-1 flex-col text-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-slate-900">
                            {item.name}
                          </span>
                          <span className="text-[11px] text-slate-500">
                            x{item.quantity}
                          </span>
                        </div>

                        {item.color && (
                          <span className="text-[11px] text-slate-500">
                            Color: {item.color}
                          </span>
                        )}

                        <div className="mt-1 flex items-center justify-between">
                          <span className="text-[11px] text-slate-500">
                            {item.price.toFixed(1)} ₺ / adet
                          </span>
                          <span className="text-[11px] font-semibold text-slate-900">
                            {(item.price * item.quantity).toFixed(1)} ₺
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
