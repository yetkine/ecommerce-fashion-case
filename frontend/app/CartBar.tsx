"use client";

import { useState } from "react";
import Link from "next/link";
import { useCart } from "./CartContext";
import { useAuth } from "./AuthContext";
import { CartDrawer } from "./CartDrawer";

export function CartBar() {
  const { totalItems, totalPrice } = useCart();
  const { user, loading } = useAuth();
  const [cartOpen, setCartOpen] = useState(false);

  return (
    <>
      <div className="border-b border-slate-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 text-sm">
          {/* Sol tarafı boş bırakıyoruz */}
          <div />

          {/* Sağ taraf: önce profil, sonra Cart butonu */}
          <div className="flex items-center gap-3">
            {/* PROFIL */}
            {!loading &&
              (user ? (
                <Link
                  href="/profile"
                  className="flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50"
                >
                  <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-slate-900 text-[11px] font-semibold text-white">
                    {user.name?.[0]?.toUpperCase() ?? "U"}
                  </span>
                  <span className="hidden sm:inline">{user.name}</span>
                </Link>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="text-xs text-slate-700 hover:underline"
                  >
                    Login
                  </Link>
                  <Link
                    href="/register"
                    className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                  >
                    Sign up
                  </Link>
                </>
              ))}

            {/* CART BUTONU (artık Link değil) */}
            <button
              type="button"
              onClick={() => setCartOpen(true)}
              className="rounded-full border border-slate-200 px-4 py-1.5 text-xs text-slate-700 hover:bg-slate-50"
            >
              <span className="mr-2 font-semibold">Cart</span>
              <span className="font-semibold">{totalItems}</span> items •{" "}
              <span className="font-semibold">{totalPrice.toFixed(1)} ₺</span>
            </button>
          </div>
        </div>
      </div>

      {/* Overlay */}
      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
    </>
  );
}
