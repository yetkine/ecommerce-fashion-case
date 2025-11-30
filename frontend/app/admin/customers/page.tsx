"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "../../AuthContext";

const API_BASE = "https://ecommerce-fashion-case.onrender.com";


type Customer = {
  _id: string;
  name: string;
  email: string;
  isAdmin?: boolean;
  createdAt?: string;
  orderCount: number;
  totalSpent: number;
};

export default function AdminCustomersPage() {
  const { user, token, loading } = useAuth();
  const router = useRouter();

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState("");
  const [loadingList, setLoadingList] = useState(false);
  const [error, setError] = useState("");

  // Admin guard
  useEffect(() => {
    if (!loading && (!user || !user.isAdmin)) {
      router.replace("/admin/login");
    }
  }, [user, loading, router]);

  const fetchCustomers = async () => {
    if (!token) return;
    setLoadingList(true);
    setError("");

    try {
      const params = new URLSearchParams();
      if (search.trim()) params.append("search", search.trim());

      const res = await fetch(
        `${API_BASE}/api/admin/customers?${params.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.message || "Could not load customers.");
        setLoadingList(false);
        return;
      }

      const data = await res.json();
      setCustomers(data.customers || []);
    } catch (err) {
      console.error("admin customers error", err);
      setError("Something went wrong.");
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    if (!token || !user?.isAdmin) return;
    fetchCustomers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, user?.isAdmin]);

  if (loading || (!user && !token)) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-sm text-slate-500">Loading...</p>
      </main>
    );
  }

  if (!user || !user.isAdmin) {
    return null; // yukarıda zaten redirect ettik
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-6xl px-4 py-8">
        <header className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Customers
            </h1>
            <p className="text-sm text-slate-500">
              Basic customer listing with search and order summary.
            </p>
          </div>

          <Link
            href="/admin"
            className="text-xs text-slate-600 hover:underline"
          >
            ← Back to Admin Dashboard
          </Link>
        </header>

        <section className="mb-4 flex flex-wrap items-center gap-3 rounded-xl bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-1">
            <span className="text-xs font-medium text-slate-500">
              Search by name or email
            </span>
            <div className="flex gap-2">
              <input
                type="text"
                className="w-64 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-400"
                placeholder="example@domain.com / John Doe..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <button
                type="button"
                onClick={fetchCustomers}
                className="rounded-full bg-slate-900 px-4 py-2 text-xs font-medium text-white hover:bg-slate-800"
              >
                Search
              </button>
            </div>
          </div>
        </section>

        <section className="rounded-2xl bg-white p-4 shadow-sm">
          {error && (
            <p className="mb-2 text-xs text-red-500">{error}</p>
          )}

          {loadingList ? (
            <p className="text-xs text-slate-500">
              Loading customers...
            </p>
          ) : customers.length === 0 ? (
            <p className="text-xs text-slate-500">
              No customers found.
            </p>
          ) : (
            <div className="max-h-[480px] overflow-auto text-xs">
              <table className="min-w-full border-separate border-spacing-y-1">
                <thead className="text-[11px] uppercase text-slate-400">
                  <tr>
                    <th className="text-left">Customer</th>
                    <th className="text-left">Email</th>
                    <th className="text-left">Orders</th>
                    <th className="text-right">Total spent</th>
                    <th className="text-right">Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {customers.map((c) => (
                    <tr key={c._id} className="align-top">
                      <td className="rounded-l-xl bg-slate-50 px-3 py-2 text-slate-900">
                        <Link
                          href={`/admin/customers/${c._id}`}
                          className="font-medium hover:underline"
                        >
                          {c.name || "(no name)"}
                        </Link>
                        {c.isAdmin && (
                          <span className="ml-2 rounded-full bg-slate-200 px-2 py-0.5 text-[10px] uppercase text-slate-700">
                            Admin
                          </span>
                        )}
                      </td>
                      <td className="bg-slate-50 px-3 py-2 text-slate-600">
                        {c.email}
                      </td>
                      <td className="bg-slate-50 px-3 py-2 text-slate-700">
                        {c.orderCount}
                      </td>
                      <td className="bg-slate-50 px-3 py-2 text-right text-slate-900">
                        {c.totalSpent.toFixed(1)} ₺
                      </td>
                      <td className="rounded-r-xl bg-slate-50 px-3 py-2 text-right text-slate-500">
                        {c.createdAt
                          ? new Date(c.createdAt).toLocaleDateString()
                          : "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
