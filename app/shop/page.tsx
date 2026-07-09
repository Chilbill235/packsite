"use client";

import { useState, useEffect } from "react";
import type { Item } from "@prisma/client";
import Notification from "@/components/Notification";
import ErrorDialog from "@/components/ErrorDialog";
import type { PackWithItems } from "@/types";

export default function ShopPage() {
  const [packs, setPacks] = useState<PackWithItems[]>([]);
  const [user, setUser] = useState<{ balance: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRevealing, setIsRevealing] = useState(false);
  const [rolledItem, setRolledItem] = useState<Item | null>(null);
  const [isFastOpen, setIsFastOpen] = useState(false);
  const [adCooldownEnd, setAdCooldownEnd] = useState<number>(0);
  const [errorDialog, setErrorDialog] = useState<{message:string, onRetry?: () => void} | null>(null);

  const FAST_MODE_MULTIPLIER = 1.2;

  useEffect(() => {
    async function loadShopData() {
      try {
        const [userRes, packRes] = await Promise.all([fetch("/api/user/profile"), fetch("/api/packs")]);
        if (userRes.ok) setUser(await userRes.json());
        if (packRes.ok) setPacks(await packRes.json());
      } catch (err) { console.error(err); } 
      finally { setLoading(false); }
    }
    loadShopData();
  }, []);

  const updateBalance = (newBalance: number) => {
    setUser({ balance: newBalance });
    document.dispatchEvent(new CustomEvent("balanceChanged", { detail: newBalance }));
  };

  const handleWatchAd = async () => {
    try {
      const res = await fetch("/api/user/add-coins", { method: "POST" });
      if (!res.ok) throw new Error("Failed to add coins");
      const data = await res.json();
      updateBalance(data.newBalance);
      setAdCooldownEnd(Date.now() + 30000); // 30s cooldown
    } catch (err) { setErrorDialog({ message: "Error watching ad" }); }
  };

  const handleOpenPack = async (pack: PackWithItems) => {
    try {
      const res = await fetch("/api/packs/open", { 
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packId: pack.id })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      updateBalance(data.newBalance);

      if (isFastOpen) {
        // Fast mode: trigger notification only
      } else {
        setRolledItem(data.wonItem);
        setIsRevealing(true);
      }
    } catch (err: any) {
      setErrorDialog({ message: err.message || "Error opening pack" });
    }
  };

  if (loading) return <div className="min-h-screen bg-black flex items-center justify-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-black text-white p-8">
      {errorDialog && <ErrorDialog message={errorDialog.message} onClose={() => setErrorDialog(null)} />}
      <header className="max-w-7xl mx-auto flex justify-between items-center mb-12 pb-8 border-b border-zinc-900">
        <div>
          <h1 className="text-5xl font-black">Pick A Pack</h1>
        </div>
        <div className="flex gap-4">
          <button onClick={handleWatchAd} disabled={Date.now() < adCooldownEnd} className="bg-zinc-800 px-5 py-2.5 rounded-full font-bold">
            {Date.now() < adCooldownEnd ? "Cooldown..." : "Watch Ad (+500)"}
          </button>
          <button onClick={() => setIsFastOpen(!isFastOpen)} className={`px-5 py-2.5 rounded-full font-bold ${isFastOpen ? "bg-amber-500 text-black" : "bg-zinc-800"}`}>
            {isFastOpen ? "⚡ Fast Mode (1.2x)" : "⚡ Standard Mode"}
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto grid grid-cols-4 gap-6">
        {packs.map((pack) => (
          <div key={pack.id} className="bg-zinc-900 p-6 rounded-3xl text-center border border-zinc-800 hover:border-zinc-700">
            <h2 className="font-bold text-lg mb-2">{pack.name}</h2>
            <button onClick={() => handleOpenPack(pack)} className="w-full bg-white text-black font-black py-3 rounded-2xl">
              {isFastOpen ? Math.ceil(pack.price * FAST_MODE_MULTIPLIER) : pack.price} COINS
            </button>
          </div>
        ))}
      </div>

      {isRevealing && rolledItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-sm" onClick={() => setIsRevealing(false)}>
          <div className="bg-zinc-900 p-10 rounded-3xl text-center" onClick={(e) => e.stopPropagation()}>
            <p className="text-zinc-500 uppercase tracking-widest text-sm mb-4">You Won!</p>
            <p className="text-3xl font-black mb-8">{rolledItem.name}</p>
            <button onClick={() => setIsRevealing(false)} className="bg-amber-500 text-black px-8 py-3 rounded-xl font-bold">Collect</button>
          </div>
        </div>
      )}
    </div>
  );
}