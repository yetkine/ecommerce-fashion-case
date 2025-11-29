"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CartBar } from "../CartBar";
import { useAuth } from "../AuthContext";

const API_BASE = "http://localhost:5000";

type Category = {
  _id: string;
  name: string;
  slug: string;
};

type Product = {
  _id: string;
  name: string;
  description: string;
  price: number;
  gender: "men" | "women" | "unisex";
  ratingAvg: number;
  ratingCount: number;
  categoryId?: {
    _id: string;
    name: string;
    slug: string;
  };
};

type OrderItem = {
  productId: string;
  name: string;
  price: number;
  quantity: number;
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

export default function AdminPage() {
  const { user, token, loading } = useAuth();

  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [cancelProcessingId, setCancelProcessingId] = useState<string | null>(
    null
  );

  // SADECE ADMIN ERİŞSİN
  if (!loading && (!user || !user.isAdmin)) {
    return (
      <main className="min-h-screen bg-slate-50">
        <div className="mx-auto max-w-6xl px-4 py-8">
          <header className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                Admin Dashboard
                </h1>
                <p className="text-sm text-slate-500">
                Key statistics, all orders and popular products.
                </p>
            </div>
            </header>


          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <p className="mb-4 text-sm text-slate-600">
              You are currently logged in as a customer or not logged in.
            </p>
            <div className="flex gap-3">
              <Link
                href="/"
                className="rounded-full bg-slate-900 px-4 py-2 text-xs font-medium text-white hover:bg-slate-800"
              >
                Back to store
              </Link>
              <Link
                href="/admin/login"
                className="rounded-full border border-slate-200 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
              >
                Go to admin login
              </Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  useEffect(() => {
    async function fetchData() {
      try {
        setLoadingData(true);

        const catPromise = fetch(`${API_BASE}/api/categories`);
        const prodPromise = fetch(
          `${API_BASE}/api/products?sort=popularity&limit=100`
        );

        // ADMIN → TÜM SİPARİŞLER
        const ordersPromise =
          token && user?.isAdmin
            ? fetch(`${API_BASE}/api/orders`, {
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              })
            : null;

        const [catRes, prodRes, ordersRes] = await Promise.all([
          catPromise,
          prodPromise,
          ordersPromise,
        ]);

        if (catRes.ok) {
          const json = await catRes.json();
          setCategories(json.data ?? []);
        }

        if (prodRes.ok) {
          const json = await prodRes.json();
          setProducts(json.data ?? []);
        }

        if (ordersRes && ordersRes.ok) {
          const json = await ordersRes.json();
          // backend: { orders: [...] }
          setOrders(json.orders ?? json.data ?? []);
        }
      } catch (err) {
        console.error("Admin fetch error:", err);
      } finally {
        setLoadingData(false);
      }
    }

    if (token && user?.isAdmin) {
      fetchData();
    }
  }, [token, user?.isAdmin]);

  // === METRIKLER ===
  const totalSales = useMemo(
    () => orders.reduce((sum, o) => sum + (o.total ?? 0), 0),
    [orders]
  );

  const orderCount = orders.length;

  const customerCount = useMemo(() => {
    const s = new Set(
      orders.map((o) => o.shippingName || "Unknown customer")
    );
    return s.size;
  }, [orders]);

  const totalOrderItems = useMemo(
    () =>
      orders.reduce(
        (sum, o) =>
          sum + o.items.reduce((s, it) => s + it.quantity, 0),
        0
      ),
    [orders]
  );

  const popularProducts = useMemo(
    () => products.slice(0, 5),
    [products]
  );

  // SALES TREND
  const salesTrend = useMemo(() => {
    const byDay: Record<string, number> = {};

    for (const o of orders) {
      if (!o.createdAt) continue;
      const day = new Date(o.createdAt).toISOString().slice(0, 10);
      byDay[day] = (byDay[day] ?? 0) + (o.total ?? 0);
    }

    const entries = Object.entries(byDay).sort((a, b) =>
      a[0].localeCompare(b[0])
    );
    return entries.slice(-7); // son 7 gün
  }, [orders]);

  const maxSalesInTrend = useMemo(
    () =>
      salesTrend.length
        ? Math.max(...salesTrend.map(([, v]) => v))
        : 1,
    [salesTrend]
  );

  // ORDER STATUS DISTRIBUTION
  const statusDistribution = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const o of orders) {
      const s = o.status || "unknown";
      counts[s] = (counts[s] ?? 0) + 1;
    }
    return Object.entries(counts);
  }, [orders]);

  const maxStatusCount = useMemo(
    () =>
      statusDistribution.length
        ? Math.max(...statusDistribution.map(([, v]) => v))
        : 1,
    [statusDistribution]
  );

  // ADMIN ORDER CANCEL
  const handleCancelOrder = async (orderId: string) => {
    if (!token) return;
    setCancelError(null);
    setCancelProcessingId(orderId);
    try {
      const res = await fetch(
        `${API_BASE}/api/orders/${orderId}/cancel`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.message || "Cancel failed");
      }

      const data = await res.json();
      const updated = data.order;

      // state içindeki order'ı güncelle
      setOrders((prev) =>
        prev.map((o) => (o._id === updated._id ? updated : o))
      );
    } catch (err: any) {
      console.error("admin cancel error:", err);
      setCancelError(
        err?.message || "Failed to cancel this order."
      );
    } finally {
      setCancelProcessingId(null);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-6xl px-4 py-8">
        {/* HEADER */}
        <header className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Admin Dashboard
            </h1>
            <p className="text-sm text-slate-500">
              Key statistics, all orders and popular products.
            </p>
          </div>
                <div className="flex items-center gap-3">
                <Link
                href="/admin/products"
                className="rounded-full border border-slate-200 px-4 py-2 text-xs text-black font-medium text-slate-700 hover:bg-slate-50"
                >
                Product Management
                </Link>
               
            </div>

          <CartBar />
        </header>

        {/* TOP STATS */}
        <section className="mb-6 grid gap-4 md:grid-cols-4">
          <div className="rounded-2xl bg-white p-4 shadow-sm">
            <p className="text-xs text-slate-500">Total sales</p>
            <p className="mt-1 text-2xl font-semibold text-slate-900">
              {totalSales.toFixed(1)} ₺
            </p>
          </div>
          <div className="rounded-2xl bg-white p-4 shadow-sm">
            <p className="text-xs text-slate-500">
              Number of orders
            </p>
            <p className="mt-1 text-2xl font-semibold text-slate-900">
              {orderCount}
            </p>
          </div>
          <div className="rounded-2xl bg-white p-4 shadow-sm">
            <p className="text-xs text-slate-500">Customer count</p>
            <p className="mt-1 text-2xl font-semibold text-slate-900">
              {customerCount}
            </p>
          </div>
          <div className="rounded-2xl bg-white p-4 shadow-sm">
            <p className="text-xs text-slate-500">Items ordered</p>
            <p className="mt-1 text-2xl font-semibold text-slate-900">
              {totalOrderItems}
            </p>
          </div>
        </section>

        {/* CHARTS */}
        <section className="mb-6 grid gap-4 md:grid-cols-2">
          {/* Sales trend chart */}
          <div className="rounded-2xl bg-white p-4 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-900">
              Sales trend (last days)
            </h2>
            {salesTrend.length === 0 ? (
              <p className="mt-3 text-xs text-slate-500">
                No orders yet to display a trend.
              </p>
            ) : (
              <div className="mt-3 space-y-2">
                {salesTrend.map(([day, value]) => (
                  <div
                    key={day}
                    className="flex items-center gap-2"
                  >
                    <span className="w-20 text-[11px] text-slate-500">
                      {day}
                    </span>
                    <div className="h-2 flex-1 rounded-full bg-slate-100">
                      <div
                        className="h-2 rounded-full bg-slate-900"
                        style={{
                          width: `${Math.max(
                            6,
                            (Number(value) /
                              maxSalesInTrend) *
                              100
                          )}%`,
                        }}
                      />
                    </div>
                    <span className="w-20 text-right text-[11px] text-slate-600">
                      {Number(value).toFixed(1)} ₺
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Order status distribution chart */}
          <div className="rounded-2xl bg-white p-4 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-900">
              Order status distribution
            </h2>
            {statusDistribution.length === 0 ? (
              <p className="mt-3 text-xs text-slate-500">
                No orders yet.
              </p>
            ) : (
              <div className="mt-3 space-y-2">
                {statusDistribution.map(([status, count]) => (
                  <div
                    key={status}
                    className="flex items-center gap-2"
                  >
                    <span className="w-24 text-[11px] capitalize text-slate-500">
                      {status}
                    </span>
                    <div className="h-2 flex-1 rounded-full bg-slate-100">
                      <div
                        className="h-2 rounded-full bg-slate-900"
                        style={{
                          width: `${Math.max(
                            6,
                            (Number(count) / maxStatusCount) *
                              100
                          )}%`,
                        }}
                      />
                    </div>
                    <span className="w-10 text-right text-[11px] text-slate-600">
                      {count}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* BOTTOM GRID */}
        {loadingData ? (
          <div className="rounded-2xl bg-white p-6 text-sm text-slate-500 shadow-sm">
            Loading admin data...
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-2">
            {/* POPULAR PRODUCTS */}
            <section className="rounded-2xl bg-white p-4 shadow-sm">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-slate-900">
                  Popular products
                </h2>
                <span className="text-xs text-slate-400">
                  Sorted by popularity / rating
                </span>
              </div>

              {popularProducts.length === 0 ? (
                <p className="text-xs text-slate-500">
                  No products found.
                </p>
              ) : (
                <div className="max-h-[320px] overflow-auto text-xs">
                  <table className="min-w-full border-separate border-spacing-y-1">
                    <thead className="text-[11px] uppercase text-slate-400">
                      <tr>
                        <th className="text-left">Product</th>
                        <th className="text-left">Category</th>
                        <th className="text-right">Price</th>
                        <th className="text-center">Rating</th>
                      </tr>
                    </thead>
                    <tbody>
                      {popularProducts.map((p) => (
                        <tr key={p._id} className="align-top">
                          <td className="rounded-l-xl bg-slate-50 px-3 py-2 text-slate-900">
                            <div className="flex flex-col">
                              <span className="font-medium">
                                {p.name}
                              </span>
                              <span className="text-[11px] text-slate-500">
                                {p.gender.toUpperCase()}
                              </span>
                            </div>
                          </td>
                          <td className="bg-slate-50 px-3 py-2 text-slate-600">
                            {p.categoryId?.name ?? "-"}
                          </td>
                          <td className="bg-slate-50 px-3 py-2 text-right text-slate-900">
                            {p.price.toFixed(1)} ₺
                          </td>
                          <td className="rounded-r-xl bg-slate-50 px-3 py-2 text-center text-slate-700">
                            ⭐ {p.ratingAvg.toFixed(1)}{" "}
                            <span className="text-[11px] text-slate-400">
                              ({p.ratingCount})
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            {/* RECENT ORDERS (ALL USERS) */}
            <section className="rounded-2xl bg-white p-4 shadow-sm">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-slate-900">
                  Recent orders (all customers)
                </h2>
                <span className="text-xs text-slate-400">
                  Latest {Math.min(orders.length, 8)} shown
                </span>
              </div>

              {cancelError && (
                <p className="mb-2 text-xs text-red-500">
                  {cancelError}
                </p>
              )}

              {orders.length === 0 ? (
                <p className="text-xs text-slate-500">
                  No orders yet.
                </p>
              ) : (
                <div className="max-h-[340px] overflow-auto text-xs">
                  <table className="min-w-full border-separate border-spacing-y-1">
                    <thead className="text-[11px] uppercase text-slate-400">
                      <tr>
                        <th className="text-left">Order</th>
                        <th className="text-left">Customer</th>
                        <th className="text-left">Status</th>
                        <th className="text-right">Total</th>
                        <th className="text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.slice(0, 8).map((o) => (
                        <tr key={o._id} className="align-top">
                          <td className="rounded-l-xl bg-slate-50 px-3 py-2 text-slate-900">
                            <div className="flex flex-col">
                              <span className="font-medium">
                                {o.orderCode ?? "-"}
                              </span>
                              <span className="text-[11px] text-slate-500">
                                {o.createdAt
                                  ? new Date(
                                      o.createdAt
                                    ).toLocaleString()
                                  : ""}
                              </span>
                            </div>
                          </td>
                          <td className="bg-slate-50 px-3 py-2 text-[11px] text-slate-600">
                            {o.shippingName || "Unknown"}
                          </td>
                          <td className="bg-slate-50 px-3 py-2">
                            <span className="inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-slate-700">
                              {o.status ?? "unknown"}
                            </span>
                          </td>
                          <td className="bg-slate-50 px-3 py-2 text-right text-slate-900">
                            {(o.total ?? 0).toFixed(1)} ₺
                            <div className="text-[11px] text-slate-500">
                              {o.items.length} items
                            </div>
                          </td>
                          <td className="rounded-r-xl bg-slate-50 px-3 py-2 text-right">
                            {o.status === "cancelled" ? (
                              <span className="text-[11px] text-slate-400">
                                Cancelled
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleCancelOrder(o._id)}
                                disabled={cancelProcessingId === o._id}
                                className="rounded-full border border-slate-300 px-3 py-1 text-[11px] font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-60"
                              >
                                {cancelProcessingId === o._id
                                  ? "Cancelling..."
                                  : "Cancel"}
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </div>
        )}
      </div>
    </main>
  );
}
