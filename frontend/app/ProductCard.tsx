// frontend/app/ProductCard.tsx
"use client";

import { useState, MouseEvent } from "react";
import Link from "next/link";

type Product = {
  _id: string;
  name: string;
  description: string;
  price: number;
  gender: "men" | "women" | "unisex";
  ratingAvg: number;
  ratingCount: number;
  images?: string[];
  colors?: string[];
  categoryId?: {
    _id: string;
    name: string;
    slug: string;
  };
};

const FALLBACK_COLORS = ["#111827", "#9CA3AF", "#F97316", "#22C55E"];

export function ProductCard({ product }: { product: Product }) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  const colors = product.colors ?? [];
  const images = product.images ?? [];

  const currentImage =
    images[selectedIndex] ?? images[0] ?? "/placeholder-product.jpg";

  const currentColorName =
    colors[selectedIndex] || (colors[0] ?? undefined);

  const handleColorClick = (e: MouseEvent, idx: number) => {
    // Link'e tıklamış gibi sayfa değiştirmesin
    e.preventDefault();
    e.stopPropagation();
    setSelectedIndex(idx);
  };

  const resolveDotColor = (c: string, idx: number) => {
    const trimmed = c.trim();
    // "#ffffff" gibi hex ise direkt kullan
    if (/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(trimmed)) return trimmed;
    // değilse fallback palette
    return FALLBACK_COLORS[idx % FALLBACK_COLORS.length];
  };

  return (
    <Link
      href={`/products/${product._id}`}
      className="flex flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-md"
    >
      {/* Görsel */}
      <div className="relative w-full overflow-hidden bg-slate-100 pb-[130%]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={currentImage}
          alt={product.name}
          className="absolute inset-0 h-full w-full object-cover"
        />
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

        {/* Renk seçenekleri */}
        {colors.length > 0 && (
          <div className="mt-1 flex flex-wrap items-center gap-2">
            {colors.map((c, idx) => (
              <button
                key={`${c}-${idx}`}
                type="button"
                onClick={(e) => handleColorClick(e, idx)}
                className={`h-5 w-5 rounded-full border border-slate-300 outline-none ring-offset-1 ${
                  idx === selectedIndex
                    ? "ring-2 ring-slate-900"
                    : "ring-0"
                }`}
                style={{ backgroundColor: resolveDotColor(c, idx) }}
                aria-label={c}
              />
            ))}
            {currentColorName && (
              <span className="text-[11px] text-slate-500">
                {currentColorName}
              </span>
            )}
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
