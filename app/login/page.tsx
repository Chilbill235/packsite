"use client";

import { useState, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  // Get the callbackUrl from the URL, default to "/shop" if it doesn't exist
  const callbackUrl = searchParams.get("callbackUrl") || "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await signIn("credentials", {
        redirect: false,
        email,
        password,
      });

      if (res?.error) {
        setError("Invalid email or password combination");
      } else {
        // Redirect to the captured callbackUrl
        router.push(callbackUrl);
        router.refresh();
      }
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto sm:p-8 sm:bg-zinc-950 sm:border sm:border-zinc-800/80 sm:rounded-2xl sm:shadow-2xl sm:backdrop-blur-md transition-all duration-300">
      <div className="mb-8">
        <h2 className="text-4xl sm:text-3xl font-black tracking-tight bg-gradient-to-b from-white to-zinc-400 bg-clip-text text-transparent">
          Welcome Back
        </h2>
        <p className="text-zinc-400 text-base sm:text-sm mt-2 font-light">
          Sign in to open your inventory
        </p>
      </div>

      {error && (
        <div className="p-4 mb-6 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-sm font-light animate-in fade-in slide-in-from-top-1 duration-200">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-widest">
            Email Address
          </label>
          <input 
            type="email" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3.5 bg-zinc-900/60 border border-zinc-800 rounded-xl text-white placeholder-zinc-600 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 focus:outline-none transition-all duration-200 text-base" 
            placeholder="you@example.com"
            required
          />
        </div>

        <div className="space-y-2">
          <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-widest">
            Password
          </label>
          <input 
            type="password" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3.5 bg-zinc-900/60 border border-zinc-800 rounded-xl text-white placeholder-zinc-600 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 focus:outline-none transition-all duration-200 text-base" 
            placeholder="Password"
            required
          />
        </div>

        <button 
          type="submit" 
          disabled={loading}
          className="group relative w-full py-4 bg-white hover:bg-zinc-100 disabled:bg-zinc-800 text-black font-bold rounded-xl transition-all duration-200 active:scale-[0.98] disabled:pointer-events-none mt-4 shadow-xl shadow-white/5 overflow-hidden"
        >
          <span className={`flex items-center justify-center gap-2 transition-all duration-200 ${loading ? "opacity-0" : "opacity-100"}`}>
            Sign In
          </span>
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
            </div>
          )}
        </button>
      </form>

      <p className="mt-10 text-center text-sm text-zinc-500 font-light">
        Don&apos;t have an account?{" "}
        <Link href="/register" className="text-white hover:text-zinc-300 font-medium transition duration-200 underline underline-offset-4 decoration-zinc-700 hover:decoration-white">
          Register
        </Link>
      </p>
    </div>
  );
}

// Wrap in Suspense because useSearchParams() requires it in Next.js 15+
export default function LoginPage() {
  return (
    <div className="min-h-[80vh] flex flex-col justify-center bg-black text-white px-6 py-12 sm:px-6 lg:px-8">
      <Suspense fallback={<div className="text-white text-center">Loading...</div>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}