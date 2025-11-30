"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useAuth } from "../../AuthContext";
import { CartBar } from "../../CartBar";

const API_BASE = "https://ecommerce-fashion-case.onrender.com";


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
  categoryId?: {
    _id: string;
    name: string;
    slug: string;
  };
  stock?: number;
  isActive?: boolean;
  ratingAvg?: number;
  ratingCount?: number;
};

export default function AdminProductsPage() {
  const { user, token, loading } = useAuth();

  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  // form state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState<string>("");
  const [gender, setGender] = useState<"men" | "women" | "unisex">("unisex");
  const [categorySlug, setCategorySlug] = useState("");
  const [stock, setStock] = useState<string>("0");
  const [isActive, setIsActive] = useState(true);
  const [imageUrl, setImageUrl] = useState("");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // bulk selection
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkProcessing, setBulkProcessing] = useState(false);

  // yetkisiz erişim
  if (!loading && (!user || !user.isAdmin)) {
    return (
      <main className="min-h-screen bg-slate-50">
        <div className="mx-auto max-w-6xl px-4 py-8">
          <header className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                Product Management
              </h1>
              <p className="text-sm text-slate-500">
                Only admin users can access this page.
              </p>
            </div>
            <CartBar />
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

  // data yükleme
  useEffect(() => {
    if (!token || !user?.isAdmin) return;

    async function fetchData() {
      try {
        setLoadingData(true);

        const [catRes, prodRes] = await Promise.all([
          fetch(`${API_BASE}/api/categories`),
          fetch(`${API_BASE}/api/products/admin/all`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }),
        ]);

        if (catRes.ok) {
          const catJson = await catRes.json();
          setCategories(catJson.data ?? []);
        }

        if (prodRes.ok) {
          const prodJson = await prodRes.json();
          setProducts(prodJson.data ?? []);
        }
      } catch (err) {
        console.error("Admin products fetch error:", err);
      } finally {
        setLoadingData(false);
      }
    }

    fetchData();
  }, [token, user?.isAdmin]);

  const resetForm = () => {
    setEditingId(null);
    setName("");
    setDescription("");
    setPrice("");
    setGender("unisex");
    setCategorySlug("");
    setStock("0");
    setIsActive(true);
    setImageUrl("");  
    setError(null);
  };

  const startEdit = (p: Product) => {
    setEditingId(p._id);
    setName(p.name);
    setDescription(p.description || "");
    setPrice(p.price?.toString() ?? "");
    setGender(p.gender);
    setCategorySlug(p.categoryId?.slug || "");
    setStock((p.stock ?? 0).toString());
    setIsActive(p.isActive !== false);
    setImageUrl((p as any).images?.[0] || "");
    setError(null);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setSaving(true);
    setError(null);

    const numericPrice = Number(price);
    const numericStock = Number(stock);

    if (Number.isNaN(numericPrice) || numericPrice <= 0) {
      setError("Price must be a positive number.");
      setSaving(false);
      return;
    }

    if (Number.isNaN(numericStock) || numericStock < 0) {
      setError("Stock must be zero or a positive number.");
      setSaving(false);
      return;
    }

    try {
      const payload = {
        name,
        description,
        price: numericPrice,
        gender,
        categorySlug,
        stock: numericStock,
        isActive,
        images: imageUrl ? [imageUrl] : [], 
      };

      const url = editingId
        ? `${API_BASE}/api/products/admin/${editingId}`
        : `${API_BASE}/api/products/admin`;

      const method = editingId ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.message || "Failed to save product.");
      }

      const data = await res.json();
      const saved: Product = data.product;

      setProducts((prev) => {
        if (editingId) {
          return prev.map((p) => (p._id === saved._id ? saved : p));
        } else {
          return [saved, ...prev];
        }
      });

      resetForm();
    } catch (err: any) {
      console.error("save product error:", err);
      setError(err?.message || "Failed to save product.");
    } finally {
      setSaving(false);
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id)
        ? prev.filter((x) => x !== id)
        : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === products.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(products.map((p) => p._id));
    }
  };

  const handleBulkStatus = async (active: boolean) => {
    if (!token || selectedIds.length === 0) return;
    setBulkProcessing(true);
    setError(null);
    try {
      const res = await fetch(
        `${API_BASE}/api/products/admin/bulk-status`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ ids: selectedIds, isActive: active }),
        }
      );

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.message || "Bulk update failed.");
      }

      // local state güncelle
      setProducts((prev) =>
        prev.map((p) =>
          selectedIds.includes(p._id)
            ? { ...p, isActive: active }
            : p
        )
      );
    } catch (err: any) {
      console.error("bulk status error:", err);
      setError(err?.message || "Bulk update failed.");
    } finally {
      setBulkProcessing(false);
    }
  };

  const handleToggleSingle = async (product: Product) => {
    if (!token) return;
    try {
      const res = await fetch(
        `${API_BASE}/api/products/admin/${product._id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ isActive: product.isActive === false }),
        }
      );

      if (!res.ok) return;

      const data = await res.json();
      const updated: Product = data.product;
      setProducts((prev) =>
        prev.map((p) => (p._id === updated._id ? updated : p))
      );
    } catch (err) {
      console.error("toggle single error:", err);
    }
  };

  const handleSoftDelete = async (product: Product) => {
    if (!token) return;
    try {
      const res = await fetch(
        `${API_BASE}/api/products/admin/${product._id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!res.ok) return;

      // biz soft-delete yapıyoruz (isActive=false), o yüzden listede kalsın ama isActive değişsin
      const data = await res.json();
      const updated: Product = data.product;
      setProducts((prev) =>
        prev.map((p) => (p._id === updated._id ? updated : p))
      );
    } catch (err) {
      console.error("soft delete error:", err);
    }
  };

  const activeCount = useMemo(
    () => products.filter((p) => p.isActive !== false).length,
    [products]
  );

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-6xl px-4 py-8">
        {/* HEADER */}
        <header className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Product Management
            </h1>
            <p className="text-sm text-slate-500">
              Add, edit and manage product visibility and stock.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/admin"
              className="hidden rounded-full border border-slate-200 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 md:inline-block"
            >
              ← Back to dashboard
            </Link>
            <CartBar />
          </div>
        </header>

        {loadingData ? (
          <div className="rounded-2xl bg-white p-6 text-sm text-slate-500 shadow-sm">
            Loading products...
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1.5fr)]">
            {/* FORM */}
            <section className="rounded-2xl bg-white p-5 shadow-sm">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-semibold text-slate-900">
                    {editingId ? "Edit product" : "Add new product"}
                  </h2>
                  <p className="text-xs text-slate-500">
                    Fill the fields and save to {editingId ? "update" : "create"} a product.
                  </p>
                </div>
                {editingId && (
                  <button
                    type="button"
                    onClick={resetForm}
                    className="rounded-full border border-slate-200 px-3 py-1 text-[11px] font-medium text-slate-600 hover:bg-slate-50"
                  >
                    Cancel edit
                  </button>
                )}
              </div>

              {error && (
                <p className="mb-2 text-xs text-red-500">{error}</p>
              )}

              <form onSubmit={handleSubmit} className="space-y-3 text-sm">
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600">
                    Name
                  </label>
                  <input
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text black outline-none focus:border-slate-400"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600">
                    Description
                  </label>
                  <textarea
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text black outline-none focus:border-slate-400"
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>

                {imageUrl && (
                <div className="mt-2">
                    <p className="mb-1 text-[11px] text-slate-500">Preview</p>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                    src={imageUrl}
                    alt="Preview"
                    className="h-32 w-full rounded-lg object-cover"
                    />
                </div>
                )}


                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-600">
                      Price (₺)
                    </label>
                    <input
                      type="number"
                      min={0}
                      step="0.1"
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text black outline-none focus:border-slate-400"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text black font-medium text-slate-600">
                      Stock
                    </label>
                    <input
                      type="number"
                      min={0}
                      step="1"
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text black outline-none focus:border-slate-400"
                      value={stock}
                      onChange={(e) => setStock(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-600">
                      Gender
                    </label>
                    <select
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text black outline-none focus:border-slate-400"
                      value={gender}
                      onChange={(e) =>
                        setGender(e.target.value as "men" | "women" | "unisex")
                      }
                    >
                      <option value="unisex">Unisex</option>
                      <option value="men">Men</option>
                      <option value="women">Women</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-600">
                      Category
                    </label>
                    <select
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400"
                      value={categorySlug}
                      onChange={(e) => setCategorySlug(e.target.value)}
                      required
                    >
                      <option value="">Select category</option>
                      {categories.map((c) => (
                        <option key={c._id} value={c.slug}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 text-xs text-slate-600">
                    <input
                      type="checkbox"
                      className="h-3 w-3 rounded border-slate-300"
                      checked={isActive}
                      onChange={(e) => setIsActive(e.target.checked)}
                    />
                    <span>Active (visible to customers when in stock)</span>
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={saving}
                  className="mt-2 w-full rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
                >
                  {saving
                    ? editingId
                      ? "Saving changes..."
                      : "Creating product..."
                    : editingId
                    ? "Save changes"
                    : "Create product"}
                </button>
              </form>
            </section>

            {/* PRODUCT LIST */}
            <section className="rounded-2xl bg-white p-5 shadow-sm">
              <div className="mb-3 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-sm font-semibold text-slate-900">
                    All products
                  </h2>
                  <p className="text-xs text-slate-500">
                    {products.length} total, {activeCount} active.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={toggleSelectAll}
                    className="rounded-full border border-slate-200 px-3 py-1 text-[11px] font-medium text-slate-700 hover:bg-slate-50"
                  >
                    {selectedIds.length === products.length
                      ? "Unselect all"
                      : "Select all"}
                  </button>
                  <button
                    type="button"
                    disabled={
                      selectedIds.length === 0 || bulkProcessing
                    }
                    onClick={() => handleBulkStatus(true)}
                    className="rounded-full border border-emerald-500 px-3 py-1 text-[11px] font-medium text-emerald-700 hover:bg-emerald-50 disabled:opacity-60"
                  >
                    Activate selected
                  </button>
                  <button
                    type="button"
                    disabled={
                      selectedIds.length === 0 || bulkProcessing
                    }
                    onClick={() => handleBulkStatus(false)}
                    className="rounded-full border border-red-500 px-3 py-1 text-[11px] font-medium text-red-700 hover:bg-red-50 disabled:opacity-60"
                  >
                    Deactivate selected
                  </button>
                </div>
              </div>

              {products.length === 0 ? (
                <p className="text-xs text-slate-500">
                  No products found.
                </p>
              ) : (
                <div className="max-h-[420px] overflow-auto text-xs">
                  <table className="min-w-full border-separate border-spacing-y-1">
                    <thead className="text-[11px] uppercase text-slate-400">
                      <tr>
                        <th className="w-8 text-left">
                          <input
                            type="checkbox"
                            className="h-3 w-3 rounded border-slate-300"
                            checked={
                              products.length > 0 &&
                              selectedIds.length === products.length
                            }
                            onChange={toggleSelectAll}
                          />
                        </th>
                        <th className="text-left">Product</th>
                        <th className="text-left">Category</th>
                        <th className="text-right">Price</th>
                        <th className="text-right">Stock</th>
                        <th className="text-center">Status</th>
                        <th className="text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {products.map((p) => {
                        const selected = selectedIds.includes(p._id);
                        const active = p.isActive !== false;
                        return (
                          <tr key={p._id} className="align-top">
                            <td className="rounded-l-xl bg-slate-50 px-3 py-2">
                              <input
                                type="checkbox"
                                className="h-3 w-3 rounded border-slate-300"
                                checked={selected}
                                onChange={() => toggleSelect(p._id)}
                              />
                            </td>
                            <td className="bg-slate-50 px-3 py-2 text-slate-900">
                              <div className="flex flex-col">
                                <span className="font-medium">
                                  {p.name}
                                </span>
                                <span className="text-[11px] text-slate-500">
                                  {p.gender.toUpperCase()}
                                  {p.ratingAvg != null &&
                                    ` • ⭐ ${p.ratingAvg.toFixed(1)} (${p.ratingCount ?? 0})`}
                                </span>
                              </div>
                            </td>
                            <td className="bg-slate-50 px-3 py-2 text-slate-600">
                              {p.categoryId?.name ?? "-"}
                            </td>
                            <td className="bg-slate-50 px-3 py-2 text-right text-slate-900">
                              {p.price.toFixed(1)} ₺
                            </td>
                            <td className="bg-slate-50 px-3 py-2 text-right text-slate-900">
                              {p.stock ?? 0}
                            </td>
                            <td className="bg-slate-50 px-3 py-2 text-center">
                              <span
                                className={`inline-flex rounded-full px-2 py-0.5 text-[11px] ${
                                  active
                                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                    : "bg-slate-100 text-slate-500 border border-slate-200"
                                }`}
                              >
                                {active ? "Active" : "Inactive"}
                              </span>
                            </td>
                            <td className="rounded-r-xl bg-slate-50 px-3 py-2 text-right">
                              <div className="flex justify-end gap-2">
                                <button
                                  type="button"
                                  onClick={() => startEdit(p)}
                                  className="rounded-full border border-slate-200 px-3 py-1 text-[11px] font-medium text-slate-700 hover:bg-slate-100"
                                >
                                  Edit
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleToggleSingle(p)}
                                  className="rounded-full border border-slate-200 px-3 py-1 text-[11px] font-medium text-slate-700 hover:bg-slate-100"
                                >
                                  {active ? "Deactivate" : "Activate"}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleSoftDelete(p)}
                                  className="rounded-full border border-red-200 text black px-3 py-1 text-[11px] font-medium text-red-700 hover:bg-red-50"
                                >
                                  Soft delete
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
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
