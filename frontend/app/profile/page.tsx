"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../AuthContext";

const API_BASE = "http://localhost:5000";

type OrderItem = {
  productId?: string;
  name: string;
  price: number;
  quantity: number;
};

type Order = {
  _id: string;
  orderCode: string;
  total: number;
  status: "created" | "processing" | "shipped" | "cancelled" | string;
  createdAt: string;
  items: OrderItem[];
};

export default function ProfilePage() {
  const { user, token, loading, logout } = useAuth();
  const router = useRouter();

  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState("");

  useEffect(() => {
    if (!token) return;
    const fetchOrders = async () => {
      setOrdersLoading(true);
      setOrdersError("");
      try {
        const res = await fetch(`${API_BASE}/api/orders/my`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          setOrdersError(data.message || "Could not load orders.");
          setOrdersLoading(false);
          return;
        }

        const data = await res.json();
        setOrders(data.orders || []);
      } catch (err) {
        console.error("profile orders error", err);
        setOrdersError("Something went wrong.");
      } finally {
        setOrdersLoading(false);
      }
    };

    fetchOrders();
  }, [token]);

  const handleCancelOrder = async (orderId: string) => {
    if (!token) return;

    const ok = window.confirm("Do you really want to cancel this order?");
    if (!ok) return;

    try {
      const res = await fetch(`${API_BASE}/api/orders/${orderId}/cancel`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data.message || "Order could not be cancelled.");
        return;
      }

      const data = await res.json();

      setOrders((prev) =>
        prev.map((o) =>
          o._id === orderId ? { ...o, status: data.order.status } : o
        )
      );
    } catch (err) {
      console.error("cancel order error", err);
      alert("Something went wrong.");
    }
  };

  const renderStatusBadge = (status: Order["status"]) => {
    let text = status;
    let cls = "bg-slate-100 text-slate-700";

    if (status === "created" || status === "processing") {
      text = "Processing";
      cls = "bg-amber-50 text-amber-700";
    } else if (status === "shipped") {
      text = "Shipped";
      cls = "bg-emerald-50 text-emerald-700";
    } else if (status === "cancelled") {
      text = "Cancelled";
      cls = "bg-red-50 text-red-600";
    }

    return (
      <span className={`rounded-full px-2 py-0.5 text-[11px] ${cls}`}>
        {text}
      </span>
    );
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-sm text-slate-500">Loading profile...</p>
      </main>
    );
  }

  if (!user || !token) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-sm space-y-4 text-center">
          <p className="text-sm text-slate-700">
            You need to log in to view your profile.
          </p>
          <div className="flex justify-center gap-3">
            <button
              onClick={() => router.push("/login")}
              className="rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
            >
              Log in
            </button>
            <button
              onClick={() => router.push("/register")}
              className="rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50"
            >
              Sign up
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8">
      <div className="mx-auto flex max-w-5xl flex-col gap-6 md:flex-row">
        {/* LEFT: User info */}
        <div className="w-full md:w-1/3 rounded-2xl bg-white p-6 shadow-sm space-y-4">
          <div>
            <h1 className="text-lg font-semibold text-slate-900">
              Profile
            </h1>
            <p className="mt-1 text-xs text-slate-500">
              Signed in as
            </p>
          </div>

          <div className="space-y-1 text-sm">
            <div className="font-medium text-slate-900">{user.name}</div>
            <div className="text-slate-600 text-xs">{user.email}</div>
          </div>

          <button
            onClick={logout}
            className="mt-4 w-full rounded-full border border-slate-300 px-4 py-2 text-xs font-medium text-slate-800 hover:bg-slate-50"
          >
            Log out
          </button>
        </div>

        {/* RIGHT: Orders */}
        <div className="w-full md:w-2/3 rounded-2xl bg-white p-6 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900">
              My orders
            </h2>
          </div>

          {ordersLoading ? (
            <p className="text-xs text-slate-500">
              Loading your orders...
            </p>
          ) : ordersError ? (
            <p className="text-xs text-red-500">{ordersError}</p>
          ) : orders.length === 0 ? (
            <p className="text-xs text-slate-500">
              You don&apos;t have any orders yet.
            </p>
          ) : (
            <div className="space-y-3">
              {orders.map((order) => (
                <div
                  key={order._id}
                  className="rounded-xl border border-slate-100 p-4 text-xs text-slate-800"
                >
                  <div className="mb-2 flex items-center justify-between">
                    <div>
                      <div className="font-medium text-slate-900">
                        {order.orderCode}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {new Date(order.createdAt).toLocaleString()}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      {renderStatusBadge(order.status)}
                      <div className="text-sm font-semibold text-slate-900">
                        {order.total.toFixed(1)} ₺
                      </div>
                    </div>
                  </div>

                  <div className="mb-2 text-[11px] text-slate-500">
                    Items:
                  </div>
                  <ul className="mb-2 space-y-1 text-[11px]">
                    {order.items.map((it, idx) => (
                      <li key={idx} className="flex justify-between">
                        <span>{it.name}</span>
                        <span>
                          {it.quantity} × {it.price.toFixed(1)} ₺
                        </span>
                      </li>
                    ))}
                  </ul>

                  {["created", "processing"].includes(order.status) && (
                    <div className="pt-2 border-t border-slate-100 flex justify-end">
                      <button
                        onClick={() => handleCancelOrder(order._id)}
                        className="rounded-full border border-red-200 px-3 py-1 text-[11px] font-medium text-red-600 hover:bg-red-50"
                      >
                        Cancel order
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
