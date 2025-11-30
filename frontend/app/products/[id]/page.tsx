"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useCart } from "@/app/CartContext";

const API_BASE = "https://ecommerce-fashion-case.onrender.com";


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
  images?: string[];
  colors?: string[];
};

type Review = {
  _id: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt: string;
};

type ProductDetailResponse = {
  data: Product;
  reviews: Review[];
};

// Renk ismine göre dot rengi
const COLOR_HEX: Record<string, string> = {
  Yellow: "#facc15",
  DarkBlue: "#0f172a",
  Black: "#020617",
  White: "#e5e7eb",
  Lilac: "#c4b5fd",
  Beige: "#f5f5dc",
  Blue: "#1d4ed8",
  "Light Blue": "#38bdf8",
  Nude: "#f5e7da",
  Brown: "#92400e",
  Gold: "#facc15",
};

const FALLBACK_COLORS = ["#111827", "#9CA3AF", "#F97316", "#22C55E", "#ec4899"];

function resolveDotColor(c: string, idx: number) {
  const trimmed = c.trim();
  if (COLOR_HEX[trimmed]) return COLOR_HEX[trimmed];
  const noSpace = trimmed.replace(/\s+/g, "");
  if (COLOR_HEX[noSpace]) return COLOR_HEX[noSpace];
  return FALLBACK_COLORS[idx % FALLBACK_COLORS.length];
}

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const { addToCart } = useCart();

  const [product, setProduct] = useState<Product | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // cart & UI state
  const [justAdded, setJustAdded] = useState(false);
  const [quantity, setQuantity] = useState(1);

  // ürün görseli / renk index
  const [selectedIndex, setSelectedIndex] = useState(0);

  // review form state
  const [revName, setRevName] = useState("");
  const [revRating, setRevRating] = useState(5);
  const [revComment, setRevComment] = useState("");
  const [revError, setRevError] = useState("");
  const [revSubmitting, setRevSubmitting] = useState(false);

  useEffect(() => {
    if (!id) return;

    const fetchProduct = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE}/api/products/${id}`);
        if (res.status === 404) {
          setNotFound(true);
          setProduct(null);
          return;
        }
        const json: ProductDetailResponse = await res.json();
        setProduct(json.data);
        setReviews(json.reviews || []);
        setSelectedIndex(0);
      } catch (err) {
        console.error("product detail error", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  const handleAddToCart = () => {
    if (!product) return;

    const safeQty = quantity > 0 ? quantity : 1;

    addToCart({
      productId: product._id,
      name: product.name,
      price: product.price,
      quantity: safeQty,
      color: currentColorName,
      image: currentImage ?? undefined,
    });

    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1500);
  };

  const handleQtyChange = (value: number) => {
    if (value < 1) value = 1;
    if (value > 10) value = 10;
    setQuantity(value);
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product) return;

    setRevError("");
    setRevSubmitting(true);

    try {
      const res = await fetch(
        `${API_BASE}/api/products/${product._id}/reviews`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userName: revName,
            rating: revRating,
            comment: revComment,
          }),
        }
      );

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setRevError(data.message || "Could not submit review");
        return;
      }

      const data = await res.json();

      setReviews((prev) => [data.review, ...prev]);

      setProduct((prev) =>
        prev
          ? {
              ...prev,
              ratingAvg: data.product.ratingAvg,
              ratingCount: data.product.ratingCount,
            }
          : prev
      );

      setRevName("");
      setRevRating(5);
      setRevComment("");
    } catch (err) {
      setRevError("Something went wrong");
    } finally {
      setRevSubmitting(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50">
        <div className="mx-auto max-w-4xl px-4 py-10">
          <p className="text-slate-500">Loading product...</p>
        </div>
      </main>
    );
  }

  if (notFound || !product) {
    return (
      <main className="min-h-screen bg-slate-50">
        <div className="mx-auto max-w-4xl px-4 py-10 space-y-4">
          <button
            onClick={() => router.back()}
            className="text-sm text-slate-600 hover:underline"
          >
            ← Back
          </button>
          <div className="rounded-xl bg-white p-8 text-center text-slate-500 shadow-sm">
            Product not found.
          </div>
        </div>
      </main>
    );
  }

  const images = product.images ?? [];
  const colors = product.colors ?? [];
  const currentImage = images[selectedIndex] ?? images[0] ?? null;
  const currentColorName = colors[selectedIndex] || colors[0];

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-4xl px-4 py-10 space-y-8">
        {/* Back */}
        <button
          onClick={() => router.back()}
          className="text-sm text-slate-600 hover:underline"
        >
          ← Back to products
        </button>

        <div className="grid gap-8 rounded-2xl bg-white p-6 shadow-sm md:grid-cols-[1.2fr_1.8fr]">
          {/* IMAGE GALLERY */}
          <div className="flex flex-col gap-4">
            {/* Ana görsel */}
            <div className="relative w-full overflow-hidden rounded-2xl bg-slate-100 pb-[120%]">
              {currentImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={currentImage}
                  alt={product.name}
                  className="absolute inset-0 h-full w-full object-cover"
                />
              ) : (
                <div className="absolute inset-4 rounded-2xl border border-dashed border-slate-300" />
              )}
              {currentColorName && (
                <span className="absolute bottom-3 right-4 text-xs text-slate-500">
                  {currentColorName}
                </span>
              )}
            </div>

            {/* Thumbnail'ler */}
            {images.length > 0 ? (
              <div className="grid grid-cols-4 gap-2">
                {images.map((img, idx) => (
                  <button
                    key={img + idx}
                    type="button"
                    onClick={() => setSelectedIndex(idx)}
                    className={`relative h-16 overflow-hidden rounded-xl border transition ${
                      selectedIndex === idx
                        ? "border-slate-900 ring-1 ring-slate-900"
                        : "border-slate-200 hover:border-slate-400"
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={img}
                      alt={`${product.name} ${idx + 1}`}
                      className="h-full w-full object-cover"
                    />
                  </button>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-4 gap-2">
                {[0, 1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-16 rounded-xl border border-slate-200 bg-slate-100"
                  />
                ))}
              </div>
            )}

            <div className="text-xs uppercase tracking-wide text-slate-400">
              {product.categoryId?.name} · {product.gender}
            </div>
          </div>

          {/* INFO SIDE */}
          <div className="flex flex-col gap-5">
            <div className="space-y-2">
              <h1 className="text-xl font-semibold text-slate-900">
                {product.name}
              </h1>

              <div className="flex items-center gap-3 text-sm">
                <span className="text-amber-500">
                  ⭐ {product.ratingAvg.toFixed(1)}
                </span>
                <span className="text-xs text-slate-400">
                  ({product.ratingCount} reviews)
                </span>
              </div>

              <p className="text-sm text-slate-600">
                {product.description}
              </p>
            </div>

            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold text-slate-900">
                {product.price.toFixed(1)} ₺
              </div>
            </div>

            {/* Renk seçici */}
            {colors.length > 0 && (
              <div className="mt-1 flex flex-col gap-2">
                <span className="text-xs font-medium text-slate-600">
                  Color
                </span>
                <div className="flex items-center gap-2">
                  {colors.map((c, idx) => (
                    <button
                      key={`${c}-${idx}`}
                      type="button"
                      onClick={() => setSelectedIndex(idx)}
                      className={`h-6 w-6 rounded-full border border-slate-300 outline-none ring-offset-1 ${
                        idx === selectedIndex
                          ? "ring-2 ring-slate-900"
                          : "ring-0"
                      }`}
                      style={{
                        backgroundColor: resolveDotColor(c, idx),
                      }}
                      aria-label={c}
                    />
                  ))}
                  {currentColorName && (
                    <span className="text-[11px] text-slate-500">
                      {currentColorName}
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Quantity + Add to cart */}
            <div className="mt-3 flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <span className="text-xs font-medium text-slate-600">
                  Quantity
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleQtyChange(quantity - 1)}
                    className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-300 text-sm text-slate-700 hover:bg-slate-50"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={quantity}
                    onChange={(e) =>
                      handleQtyChange(
                        parseInt(e.target.value || "1", 10)
                      )
                    }
                    className="h-8 w-14 rounded-lg border border-slate-300 px-2 text-center text-sm text-slate-900 outline-none focus:border-slate-500"
                  />
                  <button
                    type="button"
                    onClick={() => handleQtyChange(quantity + 1)}
                    className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-300 text-sm text-slate-700 hover:bg-slate-50"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="mt-1 flex gap-3">
                <button
                  className={`flex-1 rounded-full px-4 py-2 text-sm font-medium text-white transition ${
                    justAdded
                      ? "bg-emerald-600"
                      : "bg-slate-900 hover:bg-slate-800"
                  }`}
                  onClick={handleAddToCart}
                >
                  {justAdded ? "Added ✔" : "Add to cart"}
                </button>
                <button className="flex-1 rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50">
                  Buy now
                </button>
              </div>

              {justAdded && (
                <p className="mt-1 text-xs text-emerald-600">
                  Item added to cart. You can see it in the cart summary.
                </p>
              )}
            </div>

            {/* SPECS */}
            <div className="mt-3 rounded-xl border border-slate-100 bg-slate-50 p-4">
              <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Product Specifications
              </h2>
              <div className="grid grid-cols-2 gap-y-2 text-xs text-slate-700">
                <div>
                  <span className="font-medium text-slate-500">
                    Category:
                  </span>{" "}
                  {product.categoryId?.name || "Apparel"}
                </div>
                <div>
                  <span className="font-medium text-slate-500">
                    Gender:
                  </span>{" "}
                  {product.gender}
                </div>
                <div>
                  <span className="font-medium text-slate-500">
                    Fit:
                  </span>{" "}
                  Regular
                </div>
                <div>
                  <span className="font-medium text-slate-500">
                    Material:
                  </span>{" "}
                  100% Cotton
                </div>
                <div>
                  <span className="font-medium text-slate-500">
                    Care:
                  </span>{" "}
                  Machine wash 30°C
                </div>
                <div>
                  <span className="font-medium text-slate-500">
                    Country:
                  </span>{" "}
                  Imported
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* REVIEWS */}
        <section className="rounded-2xl bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900">
              Customer reviews
            </h2>
            <span className="text-xs text-slate-500">
              Average {product.ratingAvg.toFixed(1)} •{" "}
              {product.ratingCount} reviews
            </span>
          </div>

          {/* Review form */}
          <form onSubmit={handleSubmitReview} className="mb-5 space-y-3">
            {revError && (
              <p className="text-xs text-red-500">{revError}</p>
            )}

            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">
                  Your name
                </label>
                <input
                  type="text"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-900 outline-none focus:border-slate-400"
                  value={revName}
                  onChange={(e) => setRevName(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">
                  Rating
                </label>
                <select
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-900 outline-none focus:border-slate-400"
                  value={revRating}
                  onChange={(e) =>
                    setRevRating(parseInt(e.target.value, 10))
                  }
                >
                  <option value={5}>5 - Excellent</option>
                  <option value={4}>4 - Good</option>
                  <option value={3}>3 - Average</option>
                  <option value={2}>2 - Poor</option>
                  <option value={1}>1 - Terrible</option>
                </select>
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">
                Your review
              </label>
              <textarea
                className="min-h-[80px] w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-900 outline-none focus:border-slate-400"
                value={revComment}
                onChange={(e) => setRevComment(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              disabled={revSubmitting}
              className="rounded-full bg-slate-900 px-4 py-2 text-xs font-medium text-white hover:bg-slate-800 disabled:opacity-60"
            >
              {revSubmitting ? "Submitting..." : "Submit review"}
            </button>
          </form>

          {/* Review list */}
          {reviews.length === 0 ? (
            <p className="text-sm text-slate-500">
              No reviews yet. Be the first to review this product.
            </p>
          ) : (
            <div className="space-y-4">
              {reviews.map((rev) => (
                <div
                  key={rev._id}
                  className="border-b border-slate-100 pb-3 last:border-b-0 last:pb-0"
                >
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-800">
                      {rev.userName}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {new Date(rev.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="mb-1 text-xs text-amber-500">
                    {"⭐".repeat(rev.rating)}{" "}
                    <span className="text-[11px] text-slate-500">
                      ({rev.rating.toFixed(1)})
                    </span>
                  </div>
                  <p className="text-xs text-slate-700">
                    {rev.comment}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
