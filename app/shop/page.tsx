"use client";

import { useState, useEffect } from "react";
import ErrorDialog from "@/components/ErrorDialog";
import WatchAdModal from "@/components/WatchAdModal";
import type { PackWithItems } from "@/types";

export default function ShopPage() {
  const [packs, setPacks] = useState<PackWithItems[]>([]);
  const [user, setUser] = useState<{ balance: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFastOpen, setIsFastOpen] = useState(false);
  const [adCooldownEnd, setAdCooldownEnd] = useState(0);
  const [watchingAd, setWatchingAd] = useState(false);
  const [errorDialog, setErrorDialog] = useState<{ message: string } | null>(null);

  const FAST_MODE_MULTIPLIER = 1.2;

  useEffect(() => {
    async function loadShopData() {
      try {
        const [userRes, packRes] = await Promise.all([
          fetch("/api/user/profile"),
          fetch("/api/packs"),
        ]);
        if (userRes.ok) setUser(await userRes.json());
        if (packRes.ok) setPacks(await packRes.json());
      } catch (err) { console.error(err); } 
      finally { setLoading(false); }
    }
    loadShopData();
  }, []);

  if (loading) return <div className="min-h-screen bg-black flex items-center justify-center text-white">Loading...</div>;

  return (
    <div className="min-h-screen bg-black text-white p-4 md:p-8">
      {errorDialog && <ErrorDialog message={errorDialog.message} onClose={() => setErrorDialog(null)} />}
      <WatchAdModal open={watchingAd} onFinished={() => setWatchingAd(false)} onClose={() => setWatchingAd(false)} />

      {/* Responsive Header */}
      <header className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12 pb-8 border-b border-zinc-900">
        <div>
          <h1 className="text-4xl md:text-5xl font-black">Pick A Pack</h1>
          <p className="mt-2 text-zinc-400 font-medium">Balance: {user?.balance ?? 0} Coins</p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button onClick={() => setWatchingAd(true)} disabled={Date.now() < adCooldownEnd} className="bg-zinc-800 hover:bg-zinc-700 px-5 py-2.5 rounded-full font-bold transition text-sm">
            {Date.now() < adCooldownEnd ? "Cooldown..." : "Watch Ad (+500)"}
          </button>
          <button onClick={() => setIsFastOpen(!isFastOpen)} className={`px-5 py-2.5 rounded-full font-bold transition text-sm ${isFastOpen ? "bg-amber-500 text-black" : "bg-zinc-800 hover:bg-zinc-700"}`}>
            {isFastOpen ? "⚡ Fast Mode (1.2x)" : "⚡ Standard Mode"}
          </button>
        </div>
      </header>

      {/* Responsive Grid */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {packs.map((pack) => (
          <div key={pack.id} className="bg-zinc-900 p-5 rounded-3xl border border-zinc-800 hover:border-zinc-700 transition">
            <h2 className="text-lg font-bold mb-4">{pack.name}</h2>
            <button className="w-full bg-white hover:bg-zinc-200 text-black font-black py-3 rounded-2xl transition text-sm uppercase tracking-wide">
              {isFastOpen ? Math.ceil(pack.price * FAST_MODE_MULTIPLIER) : pack.price} Coins
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}