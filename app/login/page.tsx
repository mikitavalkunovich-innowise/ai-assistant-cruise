"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { DEMO_USERS } from "@/lib/auth/demo";
import { Anchor } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("newhire@ncl.demo");
  const [password, setPassword] = useState("demo123");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      const role = data.session.role;
      if (role === "officer" || role === "manager") {
        router.push("/compliance");
      } else {
        router.push("/hr");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Anchor className="mx-auto mb-3 h-10 w-10 text-ncl-blue" />
          <h1 className="text-2xl font-bold text-ncl-navy">Demo Login</h1>
          <p className="text-sm text-gray-500">NCL AI Assistant Prototype</p>
        </div>

        <form onSubmit={handleLogin} className="card space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Password</label>
            <input
              type="password"
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button type="submit" className="btn-primary w-full" disabled={loading}>
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <div className="mt-4 card bg-gray-50">
          <p className="mb-2 text-xs font-medium text-gray-500">Demo accounts (password: demo123)</p>
          <div className="space-y-1">
            {DEMO_USERS.map((u) => (
              <button
                key={u.email}
                type="button"
                onClick={() => {
                  setEmail(u.email);
                  setPassword(u.password);
                }}
                className="block w-full rounded px-2 py-1 text-left text-xs text-gray-600 hover:bg-white"
              >
                <span className="font-medium">{u.displayName}</span> — {u.email} ({u.role})
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
