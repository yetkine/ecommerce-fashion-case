"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function OrderSuccessPage() {
  const router = useRouter();

  const [orderCode, setOrderCode] = useState<string | null>(null);
  // 1: preparing, 2: handing over, 3: shipped
  const [step, setStep] = useState(1);

  // URL'den ?code=... parametresini oku
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      setOrderCode(params.get("code"));
    }
  }, []);

  useEffect(() => {
    const t1 = setTimeout(() => setStep(2), 1000);
    const t2 = setTimeout(() => setStep(3), 2000);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  const statusText =
    step === 1
      ? "Preparing your order..."
      : step === 2
      ? "Handing over to the carrier..."
      : "Shipped";

  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="w-full max-w-lg rounded-2xl bg-white p-8 shadow-sm space-y-6">
        <h1 className="text-xl font-semibold text-slate-900 text-center">
          Order status
        </h1>

        {/* Shipping simulation */}
        <div className="space-y-3">
          <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
            <div
              className="h-2 bg-slate-900 transition-all"
              style={{
                width: step === 1 ? "33%" : step === 2 ? "66%" : "100%",
              }}
            />
          </div>
          <p className="text-sm text-slate-700 text-center">{statusText}</p>
        </div>

        {/* Final message + order code */}
        {step === 3 && (
          <div className="space-y-3 text-center">
            <p className="text-sm font-medium text-emerald-600">
              Your order has been received.
            </p>
            <p className="text-xs text-slate-500">
              Keep your order code for future reference:
            </p>
            <div className="inline-block rounded-lg bg-slate-50 px-3 py-2 text-sm font-mono text-slate-900">
              {orderCode || "N/A"}
            </div>
          </div>
        )}

        <div className="pt-2 text-center">
          <button
            onClick={() => router.push("/")}
            className="inline-flex items-center justify-center rounded-full bg-slate-900 px-6 py-2 text-sm font-medium text-white hover:bg-slate-800"
          >
            Back to homepage
          </button>
        </div>
      </div>
    </main>
  );
}
