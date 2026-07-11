"use client";

import { useState, useEffect, useRef } from "react";
import ErrorDialog from "@/components/ErrorDialog";
// Ensure this path matches the file location shown in your screenshot
import { RewardedAdService } from "../../lib/adService"; 
import type { Item } from "@prisma/client";
import type { PackWithItems } from "@/types";

export default function ShopPage() {
  const [packs, setPacks] = useState<PackWithItems[]>([]);
  const [user, setUser] = useState<{ balance: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRevealing, setIsRevealing] = useState(false);
  const [rolledItem, setRolledItem] = useState<Item | null>(null);
  const [isFastOpen, setIsFastOpen] = useState(false);
  const [errorDialog, setErrorDialog] = useState<{ message: string } | null>(null);
  
  const adService = useRef<RewardedAdService | null>(null);
  const FAST_MODE_MULTIPLIER = 1.2;

  useEffect(() => {
    // Check if window is defined to ensure this is client-side
    if (typeof window !== "undefined") {
      try {
        adService.current = new RewardedAdService();
        adService.current.init();
      } catch (e) {
        console.warn("RewardedAdService could not be initialized.");
      }
    }

    async function loadShopData() {
      try {
        const [userRes, packRes] = await Promise.all([
          fetch("/api/user/profile", { credentials: "include" }),
          fetch("/api/packs", { credentials: "include" }),
        ]);
        if (userRes.ok) setUser(await userRes.json());
        if (packRes.ok) setPacks(await packRes.json());
      } catch (err) { console.error(err); } 
      finally { setLoading(false); }
    }
    loadShopData();
  }, []);

  const updateBalance = (newBalance: number) => {
    setUser((prev) => (prev ? { ...prev, balance: newBalance } : { balance: newBalance }));
    document.dispatchEvent(new CustomEvent("balanceChanged", { detail: newBalance }));
  };

  const handleOpenPack = async (pack: PackWithItems) => {
    try {
      const res = await fetch("/api/packs/open", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packId: pack.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to open pack");
      updateBalance(data.newBalance);
      if (!isFastOpen) {
        setRolledItem(data.wonItem);
        setIsRevealing(true);
      }
    } catch (err: any) { setErrorDialog({ message: err.message }); }
  };

  if (loading) return <div className="min-h-screen bg-black flex items-center justify-center text-white">Loading...</div>;

  return (
    <div className="min-h-screen bg-black text-white p-4 md:p-8">
      {errorDialog && <ErrorDialog message={errorDialog.message} onClose={() => setErrorDialog(null)} />}

      <header className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12 pb-8 border-b border-zinc-900">
        <div>
          <h1 className="text-4xl md:text-5xl font-black">Pick A Pack</h1>
          <p className="mt-2 text-zinc-400 font-medium">Balance: {user?.balance ?? 0} Coins</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button 
            onClick={() => adService.current?.showAd()} 
            className="bg-blue-600 hover:bg-blue-500 px-5 py-2.5 rounded-full font-bold transition text-sm"
          >
            Watch Ad for Coins
          </button>
          <button onClick={() => setIsFastOpen(!isFastOpen)} className={`px-5 py-2.5 rounded-full font-bold transition text-sm ${isFastOpen ? "bg-amber-500 text-black" : "bg-zinc-800 hover:bg-zinc-700"}`}>
            {isFastOpen ? "⚡ Fast Mode (1.2x)" : "⚡ Standard Mode"}
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {packs.map((pack) => (
          <div key={pack.id} className="bg-zinc-900 p-5 rounded-3xl border border-zinc-800 hover:border-zinc-700 transition">
            <h2 className="text-lg font-bold mb-4">{pack.name}</h2>
            <button onClick={() => handleOpenPack(pack)} className="w-full bg-white hover:bg-zinc-200 text-black font-black py-3 rounded-2xl transition text-sm uppercase tracking-wide">
              {isFastOpen ? Math.ceil(pack.price * FAST_MODE_MULTIPLIER) : pack.price} Coins
            </button>
          </div>
        ))}
      </div>

      {isRevealing && rolledItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-sm p-4" onClick={() => setIsRevealing(false)}>
          <div className="bg-zinc-900 rounded-3xl p-10 text-center max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
            <p className="text-zinc-500 uppercase tracking-widest text-sm mb-4">You Won!</p>
            <p className="text-3xl font-black mb-8">{rolledItem.name}</p>
            <button onClick={() => setIsRevealing(false)} className="bg-amber-500 hover:bg-amber-400 text-black px-8 py-3 rounded-xl font-bold w-full">
              Collect
            </button>
          </div>
        </div>
      )}
    </div>
  );
}