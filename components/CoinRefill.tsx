"use client";

import { useState } from "react";
import Script from "next/script";
import { useUser } from "@/context/UserContext";

export default function CoinRefill() {
  const { user, setUser } = useUser();
  const [loading, setLoading] = useState(false);

  const handleWatchAd = async () => {
    if (loading) return;

    setLoading(true);
    try {
      const res = await fetch("/api/user/add-coins", { method: "POST" });
      const data = await res.json();
      if (res.ok && user) {
        setUser({ ...user, balance: data.newBalance });
        window.dispatchEvent(new CustomEvent("balanceUpdated", { detail: { balance: data.newBalance } }));
      }
    } finally {
      setLoading(false);
    }
  };

  if (!user || user.balance > 200) return null;

  return (
    <>
      <Script
        async
        src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-1167000799645777"
        crossOrigin="anonymous"
        strategy="afterInteractive"
      />
      <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-2xl mb-10 flex flex-col items-center text-center">
        <h3 className="font-black text-2xl text-white mb-2">Low on Coins?</h3>
        <p className="text-sm text-zinc-400 mb-6">Watch a quick ad to get 500 free coins.</p>

        <div className="w-full max-w-md h-32 bg-black border border-dashed border-zinc-700 rounded-xl mb-6 flex items-center justify-center text-zinc-600">
          Ad placement
        </div>

        <button
          onClick={handleWatchAd}
          disabled={loading}
          className="bg-amber-500 hover:bg-amber-400 text-black font-bold px-8 py-3 rounded-xl transition-all disabled:opacity-50"
        >
          {loading ? "Watching..." : "Watch Video (+500 Coins)"}
        </button>
      </div>
    </>
  );
}
