"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "../../../AuthContext";

const API_BASE = "https://ecommerce-fashion-case.onrender.com";


type OrderItem = {
  productId?: string;
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
  items: OrderItem[];
};

type Customer = {
  _id: string;
  name: string;
  email: string;
  isAdmin?: boolean;
  createdAt?: string;
};

type CustomerDetailResponse = {
  customer: Customer;
  orders: Order[];
};

export default function AdminCustomerDetailPage() {
  const { user, token, loading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!loading && (!user || !user.isAdmin)) {
      router.replace("/admin/login");
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (!token || !user?.isAdmin || !id) return;

    const fetchDetail = async () => {
      setLoadingDetail(true);
      setError("");

      try {
        const res = await fetch(
          `${API_BASE}/api/admin/customers/${id}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          setError(data.message || "Could not load customer.");
          setLoadingDetail(false);
          return;
        }

        const data: CustomerDetailResponse = await res.json();
        setCustomer(data.customer);
        setOrders(data.orders || []);
      } catch (err) {
        console.error("admin customer detail error", err);
        setError("Something went wrong.");
      } finally {
        setLoadingDetail(false);
      }
    };

    fetchDetail();
  }, [token, user?.isAdmin, id]);

  if (loading || (!user && !token)) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-sm text-slate-500">Loading...</p>
      </main>
    );
  }

  if (!user || !user.isAdmin) {
    return null;
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-5xl px-4 py-8 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <Link
              href="/admin/customers"
              className="text-xs text-slate-600 hover:underline"
            >
              ← Back to customers
            </Link>
            <h1 className="text-xl font-semibold text-slate-900">
              Customer detail
            </h1>
          </div>
        </div>

        {error && (
          <p className="text-xs text-red-500">{error}</p>
        )}

        {loadingDetail ? (
          <p className="text-sm text-slate-500">
            Loading customer detail...
          </p>
        ) : !customer ? (
          <p className="text-sm text-slate-500">
            Customer not found.
          </p>
        ) : (
          <>
            {/* Customer info */}
            <section className="rounded-2xl bg-white p-6 shadow-sm">
              <h2 className="mb-2 text-sm font-semibold text-slate-900">
                Customer info
              </h2>
              <div className="space-y-1 text-sm text-slate-800">
                <div>
                  <span className="font-medium">Name: </span>
                  {customer.name || "(no name)"}
                </div>
                <div>
                  <span className="font-medium">Email: </span>
                  {customer.email}
                </div>
                <div>
                  <span className="font-medium">Role: </span>
                  {customer.isAdmin ? "Admin" : "Customer"}
                </div>
                <div>
                  <span className="font-medium">Joined: </span>
                  {customer.createdAt
                    ? new Date(
                        customer.createdAt
                      ).toLocaleDateString()
                    : "-"}
                </div>
              </div>
            </section>

            {/* Order history */}
            <section className="rounded-2xl bg-white p-6 shadow-sm">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-slate-900">
                  Order history
                </h2>
                <span className="text-xs text-slate-500">
                  {orders.length} order(s)
                </span>
              </div>

              {orders.length === 0 ? (
                <p className="text-xs text-slate-500">
                  This customer has no orders yet.
                </p>
              ) : (
                <div className="space-y-3 text-xs text-slate-800">
                  {orders.map((o) => (
                    <div
                      key={o._id}
                      className="rounded-xl border border-slate-100 p-4"
                    >
                      <div className="mb-2 flex items-center justify-between">
                        <div>
                          <div className="font-medium text-slate-900">
                            {o.orderCode || o._id}
                          </div>
                          <div className="text-[11px] text-slate-400">
                            {o.createdAt
                              ? new Date(
                                  o.createdAt
                                ).toLocaleString()
                              : "-"}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-semibold text-slate-900">
                            {(o.total ?? 0).toFixed(1)} ₺
                          </div>
                          <div className="text-[11px] text-slate-500">
                            {o.items.length} item
                          </div>
                          <div className="mt-1 text-[11px] text-slate-500">
                            Status: {o.status || "unknown"}
                          </div>
                        </div>
                      </div>

                      <ul className="space-y-1 text-[11px] text-slate-700">
                        {o.items.map((it, idx) => (
                          <li
                            key={idx}
                            className="flex justify-between"
                          >
                            <span>{it.name}</span>
                            <span>
                              {it.quantity} ×{" "}
                              {it.price.toFixed(1)} ₺
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </main>
  );
}
