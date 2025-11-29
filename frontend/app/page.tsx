"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useCart } from "./CartContext";
import { CartBar } from "./CartBar";

const API_BASE = "http://localhost:5000";

type Category = {
  _id: string;
  name: string;
  slug: string;
  parentId?: string | null;
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
  colors?: string[];
  images?: string[];
};

type CategoryResponse = {
  data: Category[];
};

type ProductResponse = {
  data: Product[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

// renk isimlerini küçük dot'lar için hexe mapliyoruz
const COLOR_HEX: Record<string, string> = {
  Yellow: "#facc15",
  DarkBlue: "#0f172a",
};

export default function HomePage() {
  const [categories, setCategories] = useState<Category[]>([]);

  // ana ürün listesi (filtreli)
  const [products, setProducts] = useState<Product[]>([]);

  // featured listeler
  const [featuredPopular, setFeaturedPopular] = useState<Product[]>([]);
  const [featuredTopRated, setFeaturedTopRated] = useState<Product[]>([]);

  // filtre state'leri
  const [gender, setGender] = useState<string>("");
  const [categorySlug, setCategorySlug] = useState<string>("");
  const [sort, setSort] = useState<string>("popularity");
  const [loading, setLoading] = useState<boolean>(false);
  const [search, setSearch] = useState<string>("");
  const [minPrice, setMinPrice] = useState<string>("");
  const [maxPrice, setMaxPrice] = useState<string>("");
  const [minRating, setMinRating] = useState<string>("");
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);

  const PAGE_SIZE = 8;
  const { totalItems, totalPrice } = useCart(); // şimdilik sadece CartBar için, gerekirse kullanırız

  // kategoriler
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/categories`);
        const json: CategoryResponse = await res.json();
        setCategories(json.data || []);
      } catch (err) {
        console.error("categories error", err);
      }
    };

    fetchCategories();
  }, []);

  // FEATURED: Most popular & Top rated (sayfa açıldığında 1 kere)
  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        const [popularRes, topRatedRes] = await Promise.all([
          fetch(
            `${API_BASE}/api/products?sort=popularity&page=1&limit=8`
          ),
          fetch(
            `${API_BASE}/api/products?sort=rating_desc&page=1&limit=8`
          ),
        ]);

        if (popularRes.ok) {
          const json: ProductResponse = await popularRes.json();
          setFeaturedPopular(json.data || []);
        }

        if (topRatedRes.ok) {
          const json: ProductResponse = await topRatedRes.json();
          setFeaturedTopRated(json.data || []);
        }
      } catch (err) {
        console.error("featured products error", err);
      }
    };

    fetchFeatured();
  }, []);

  // ana ürün listesi (filtrelenmiş)
  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();

        if (gender) params.append("gender", gender);
        if (categorySlug) params.append("categorySlug", categorySlug);
        if (sort) params.append("sort", sort);
        if (search) params.append("q", search);
        if (minPrice) params.append("minPrice", minPrice);
        if (maxPrice) params.append("maxPrice", maxPrice);
        if (minRating) params.append("minRating", minRating);
        params.append("page", String(page));
        params.append("limit", String(PAGE_SIZE));

        const res = await fetch(
          `${API_BASE}/api/products?${params.toString()}`
        );
        const json: ProductResponse = await res.json();
        setProducts(json.data || []);
        setTotalPages(json.totalPages || 1);
      } catch (err) {
        console.error("products error", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [gender, categorySlug, sort, search, minPrice, maxPrice, minRating, page]);

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-6xl px-4 py-8">
        {/* HEADER */}
        <header className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Fashion Case – Product Listing
            </h1>
            <p className="text-sm text-slate-500">
              Men / Women • T-Shirt, Pants, Jacket, Shoes, Accessories
            </p>
          </div>

          <CartBar />
        </header>

        {/* FEATURED SECTIONS */}
        {(featuredPopular.length > 0 || featuredTopRated.length > 0) && (
          <section className="mb-8 space-y-6">
            {featuredPopular.length > 0 && (
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-slate-900">
                    Most popular
                  </h2>
                  <span className="text-xs text-slate-500">
                    Based on popularity / rating
                  </span>
                </div>
                <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4">
                  {featuredPopular.slice(0, 4).map((p) => (
                    <ProductCard key={p._id} product={p} />
                  ))}
                </div>
              </div>
            )}

            {featuredTopRated.length > 0 && (
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-slate-900">
                    Top rated
                  </h2>
                  <span className="text-xs text-slate-500">
                    4.5★ and above
                  </span>
                </div>
                <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4">
                  {featuredTopRated.slice(0, 4).map((p) => (
                    <ProductCard key={p._id} product={p} />
                  ))}
                </div>
              </div>
            )}
          </section>
        )}

        {/* FİLTRELER */}
        <section className="mb-6 flex flex-wrap gap-3 rounded-xl bg-white p-4 shadow-sm">
          {/* Gender */}
          <div className="flex flex-col gap-1">
            <span className="text-xs font-medium text-slate-500">
              Gender
            </span>
            <select
              className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-black outline-none transition hover:bg-slate-100 focus:border-slate-400"
              value={gender}
              onChange={(e) => {
                setGender(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All</option>
              <option value="men">Men</option>
              <option value="women">Women</option>
            </select>
          </div>

          {/* Category */}
          <div className="flex flex-col gap-1">
            <span className="text-xs font-medium text-slate-500">
              Category
            </span>
            <select
              className="min-w-[180px] rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-black outline-none transition hover:bg-slate-100 focus:border-slate-400"
              value={categorySlug}
              onChange={(e) => {
                setCategorySlug(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All</option>
              {categories.map((c) => (
                <option key={c._id} value={c.slug}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Sort */}
          <div className="flex flex-col gap-1">
            <span className="text-xs font-medium text-slate-500">
              Sort by
            </span>
            <select
              className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-black outline-none transition hover:bg-slate-100 focus:border-slate-400"
              value={sort}
              onChange={(e) => {
                setSort(e.target.value);
                setPage(1);
              }}
            >
              <option value="popularity">Most popular</option>
              <option value="price_asc">Price: Low → High</option>
              <option value="price_desc">Price: High → Low</option>
              <option value="newest">Newest</option>
            </select>
          </div>

          {/* Search */}
          <div className="flex flex-col gap-1">
            <span className="text-xs font-medium text-slate-500">
              Search
            </span>
            <input
              type="text"
              placeholder="Search products..."
              className="w-52 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-black outline-none transition focus:border-slate-400"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>

          {/* Price range */}
          <div className="flex flex-col gap-1">
            <span className="text-xs font-medium text-slate-500">
              Price range (₺)
            </span>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={0}
                placeholder="Min"
                className="w-24 rounded-lg border border-slate-200 bg-white px-2 py-2 text-sm text-black outline-none focus:border-slate-400"
                value={minPrice}
                onChange={(e) => {
                  setMinPrice(e.target.value);
                  setPage(1);
                }}
              />
              <span className="text-xs text-slate-400">-</span>
              <input
                type="number"
                min={0}
                placeholder="Max"
                className="w-24 rounded-lg border border-slate-200 bg-white px-2 py-2 text-sm text-black outline-none focus:border-slate-400"
                value={maxPrice}
                onChange={(e) => {
                  setMaxPrice(e.target.value);
                  setPage(1);
                }}
              />
            </div>
          </div>

          {/* Min rating */}
          <div className="flex flex-col gap-1">
            <span className="text-xs font-medium text-slate-500">
              Min rating
            </span>
            <select
              className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-black outline-none transition hover:bg-slate-100 focus:border-slate-400"
              value={minRating}
              onChange={(e) => {
                setMinRating(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All</option>
              <option value="4">4.0+</option>
              <option value="4.5">4.5+</option>
            </select>
          </div>
        </section>

        {/* ÜRÜNLER (ANA LİSTE) */}
        <section>
          {loading ? (
            <div className="flex items-center justify-center py-12 text-slate-500">
              Loading products...
            </div>
          ) : products.length === 0 ? (
            <div className="flex items-center justify-center rounded-xl bg-white py-12 text-slate-400 shadow-sm">
              No products found with current filters.
            </div>
          ) : (
            <div className="grid gap-5 md:grid-cols-3 lg:grid-cols-4">
              {products.map((p) => (
                <ProductCard key={p._id} product={p} />
              ))}
            </div>
          )}
        </section>

        {/* PAGINATION */}
        {products.length > 0 && (
          <div className="mt-6 flex items-center justify-center gap-4">
            <button
              className="rounded-full border border-slate-300 px-4 py-1 text-sm text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              ← Prev
            </button>

            <span className="text-sm text-slate-600">
              Page <span className="font-semibold">{page}</span> /{" "}
              {totalPages}
            </span>

            <button
              className="rounded-full border border-slate-800 bg-slate-900 px-4 py-1 text-sm text-white disabled:cursor-not-allowed disabled:bg-slate-400"
              disabled={page >= totalPages}
              onClick={() =>
                setPage((p) => Math.min(totalPages, p + 1))
              }
            >
              Next →
            </button>
          </div>
        )}
      </div>
    </main>
  );
}

/* ÜRÜN KARTI + RENK SEÇİCİ (listede kullanılan) */
function ProductCard({ product }: { product: Product }) {
  const [colorIndex, setColorIndex] = useState(0);

  const activeImage =
    product.images && product.images.length > 0
      ? product.images[Math.min(colorIndex, product.images.length - 1)]
      : undefined;

  return (
    <Link
      href={`/products/${product._id}`}
      className="flex flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-md"
    >
      {/* Görsel */}
      <div className="relative w-full bg-slate-100 pb-[130%]">
        {activeImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={activeImage}
            alt={product.name}
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 bg-slate-100" />
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2 p-3">
        <div className="flex items-center justify-between text-[11px] uppercase tracking-wide text-slate-400">
          <span>{product.categoryId?.name}</span>
          <span>{product.gender}</span>
        </div>

        <h2 className="line-clamp-2 text-sm font-semibold text-slate-900">
          {product.name}
        </h2>

        <p className="line-clamp-2 text-xs text-slate-500">
          {product.description}
        </p>

        {/* Renk dot'ları */}
        {product.colors && product.colors.length > 0 && (
          <div className="mt-1 flex flex-wrap items-center gap-2">
            {product.colors.map((c, i) => {
              const hex = COLOR_HEX[c] ?? "#e5e7eb";
              const selected = i === colorIndex;
              return (
                <button
                  key={c + i}
                  type="button"
                  onClick={(e) => {
                    e.preventDefault(); // Link'e gitmesin
                    e.stopPropagation();
                    setColorIndex(i);
                  }}
                  className={`h-4 w-4 rounded-full border border-slate-300 ring-offset-1 ${
                    selected ? "ring-2 ring-slate-900" : ""
                  }`}
                  style={{ backgroundColor: hex }}
                  aria-label={c}
                />
              );
            })}
          </div>
        )}

        <div className="mt-2 flex items-center justify-between text-sm">
          <span className="font-semibold text-slate-900">
            {product.price.toFixed(1)} ₺
          </span>
          <span className="text-xs text-amber-500">
            ⭐ {product.ratingAvg.toFixed(1)}{" "}
            <span className="text-[11px] text-slate-400">
              ({product.ratingCount})
            </span>
          </span>
        </div>
      </div>
    </Link>
  );
}
