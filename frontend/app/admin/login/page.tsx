"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../AuthContext";

export default function AdminLoginPage() {
  const { loginAdmin, loading } = useAuth() as any;
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");

    const ok = await loginAdmin(email, password);
    if (!ok) {
      setError("Invalid admin email or password.");
      return;
    }
    router.push("/admin");
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto flex max-w-md flex-col justify-center px-4 py-12">
        <h1 className="mb-2 text-2xl font-bold text-slate-900">
          Admin Login
        </h1>
        <p className="mb-6 text-sm text-slate-500">
          Sign in with your admin account.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">
              Admin email
            </label>
            <input
              type="email"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">
              Password
            </label>
            <input
              type="password"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && (
            <p className="text-xs text-red-500">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
          >
            {loading ? "Signing in..." : "Login as admin"}
          </button>
        </form>
      </div>
    </main>
  );
}
