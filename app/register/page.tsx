"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Forward the callbackUrl if they register, so they get back to where they wanted to go post-login
  const callbackUrl = searchParams.get("callbackUrl") || "/";

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Registration failed.");
      }

      // On success, redirect to login with registered=true and pass along the callback URL
      router.push(`/login?registered=true&callbackUrl=${encodeURIComponent(callbackUrl)}`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An unexpected error occurred.";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto relative group">
      {/* Decorative Glow Ring */}
      <div className="absolute -inset-1 bg-gradient-to-r from-amber-500/20 to-yellow-500/20 rounded-3xl blur-xl opacity-75 group-hover:opacity-100 transition duration-1000 group-hover:duration-200" />
      
      <div className="relative w-full p-8 sm:p-10 bg-zinc-950/80 border border-zinc-800/80 rounded-3xl shadow-2xl backdrop-blur-xl transition-all duration-300">
        
        {/* Header Badge & Title */}
        <div className="mb-8 text-center sm:text-left">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 mb-4 shadow-[0_0_15px_rgba(245,158,11,0.1)]">
            <span className="text-xl">✨</span>
          </div>
          <h2 className="text-3xl font-black tracking-tight bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent">
            Create Account
          </h2>
          <p className="text-zinc-400 text-sm mt-2 font-light">
            Join PackSite to unbox and collect legendary items.
          </p>
        </div>

        {/* Error Notification */}
        {error && (
          <div className="p-4 mb-6 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-xs font-light flex items-center gap-2 animate-in fade-in slide-in-from-top-1 duration-200">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
              Username
            </label>
            <input 
              type="text" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 bg-zinc-900/60 border border-zinc-800/80 rounded-xl text-white placeholder-zinc-600 focus:border-amber-500/50 focus:ring-4 focus:ring-amber-500/10 focus:outline-none transition-all duration-200 text-sm" 
              placeholder="LuckyCollector"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
              Email Address
            </label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-zinc-900/60 border border-zinc-800/80 rounded-xl text-white placeholder-zinc-600 focus:border-amber-500/50 focus:ring-4 focus:ring-amber-500/10 focus:outline-none transition-all duration-200 text-sm" 
              placeholder="collector@example.com"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
              Password
            </label>
            <div className="relative">
              <input 
                type={showPassword ? "text" : "password"} 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-4 pr-12 py-3 bg-zinc-900/60 border border-zinc-800/80 rounded-xl text-white placeholder-zinc-600 focus:border-amber-500/50 focus:ring-4 focus:ring-amber-500/10 focus:outline-none transition-all duration-200 text-sm" 
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 text-xs font-medium focus:outline-none select-none transition-colors"
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          {/* Premium Amber Sign-up Button */}
          <button 
            type="submit" 
            disabled={loading}
            className="group/btn relative w-full py-3.5 bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-400 hover:to-yellow-500 disabled:from-zinc-800 disabled:to-zinc-800 text-black font-extrabold rounded-xl transition-all duration-200 active:scale-[0.98] disabled:pointer-events-none mt-6 shadow-lg shadow-amber-950/20 overflow-hidden"
          >
            <span className={`flex items-center justify-center gap-2 transition-all duration-200 ${loading ? "opacity-0" : "opacity-100"}`}>
              Register Now ⚔️
            </span>
            {loading && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
              </div>
            )}
          </button>
        </form>

        {/* Footer Navigation link */}
        <p className="mt-8 text-center text-xs text-zinc-500 font-light">
          Already have an account?{" "}
          <Link href={`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`} className="text-white hover:text-amber-400 font-medium transition duration-200 underline underline-offset-4 decoration-zinc-800 hover:decoration-amber-500/50">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex flex-col justify-center bg-gradient-to-b from-zinc-950 to-black text-white px-6 py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Amber Ambience overlay */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
      
      {/* Suspense Wrapper to handle search parameter checking on static builds safely */}
      <Suspense fallback={
        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="animate-spin h-8 w-8 border-4 border-amber-500 border-t-transparent rounded-full" />
          <div className="text-zinc-400 text-sm font-light">Assembling registrar portal...</div>
        </div>
      }>
        <RegisterForm />
      </Suspense>
    </div>
  );
}