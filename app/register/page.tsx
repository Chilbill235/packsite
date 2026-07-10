"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegisterPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
        // This captures the error message (e.g., "User already exists") sent from your API
        throw new Error(data.error || "Registration failed.");
      }

      // On success, redirect to login with the registered query parameter
      router.push("/login?registered=true");
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex flex-col justify-center bg-black text-white px-6 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md mx-auto sm:p-8 sm:bg-zinc-950 sm:border sm:border-zinc-800/80 sm:rounded-2xl sm:shadow-2xl sm:backdrop-blur-md transition-all duration-300">
        
        <div className="mb-8">
          <h2 className="text-4xl font-black">Create Account</h2>
          <p className="text-zinc-400 mt-2">Join PackSite and claim rare items</p>
        </div>

        {error && (
          <div className="p-4 mb-6 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-sm font-light">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-widest">Username</label>
            <input 
              type="text" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3.5 bg-zinc-900/60 border border-zinc-800 rounded-xl text-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 focus:outline-none transition-all duration-200" 
              placeholder="LuckyCollector"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-widest">Email Address</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3.5 bg-zinc-900/60 border border-zinc-800 rounded-xl text-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 focus:outline-none transition-all duration-200" 
              placeholder="collector@example.com"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-widest">Password</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3.5 bg-zinc-900/60 border border-zinc-800 rounded-xl text-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 focus:outline-none transition-all duration-200" 
              placeholder="••••••••"
              required
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-4 bg-white hover:bg-zinc-100 disabled:bg-zinc-800 text-black font-bold rounded-xl transition-all duration-200 active:scale-[0.98]"
          >
            {loading ? "Registering..." : "Register"}
          </button>
        </form>

        <p className="mt-10 text-center text-sm text-zinc-500">
          Already have an account?{" "}
          <Link href="/login" className="text-white hover:text-zinc-300 transition underline underline-offset-4">Sign In</Link>
        </p>
      </div>
    </div>
  );
}