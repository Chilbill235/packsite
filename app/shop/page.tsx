"use client";

import { useState, useEffect, useRef } from "react";
import ErrorDialog from "@/components/ErrorDialog";
import { RewardedAdService } from '@/lib/adService';
import type { Item } from "@prisma/client";
import type { PackWithItems } from "@/types";

export default function ShopPage() {
  const [packs, setPacks] = useState<PackWithItems[]>([]);
  const [user, setUser] = useState<{ balance: number; email?: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRevealing, setIsRevealing] = useState(false);
  const [rolledItem, setRolledItem] = useState<Item | null>(null);
  const [isFastOpen, setIsFastOpen] = useState(false);
  const [errorDialog, setErrorDialog] = useState<{ message: string } | null>(null);
  const [isWaitingForReward, setIsWaitingForReward] = useState(false);
  
  const adService = useRef<RewardedAdService | null>(null);
  const FAST_MODE_MULTIPLIER = 1.2;

  useEffect(() => {
    adService.current = new RewardedAdService();

    // --- Reward Logic: Listen for user returning to tab ---
    const handleFocus = async () => {
      const clickedAt = sessionStorage.getItem("ad_clicked_at");
      
      if (clickedAt && isWaitingForReward) {
        const timePassed = Date.now() - parseInt(clickedAt);
        
        // If they return after 10 seconds, award them
        if (timePassed > 10000) {
          sessionStorage.removeItem("ad_clicked_at");
          setIsWaitingForReward(false);
          
          try {
            const res = await fetch("/api/user/award-coins", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ amount: 10 }) // Adjust amount as needed
            });
            const data = await res.json();
            if (res.ok) {
              updateBalance(data.newBalance);
              alert("Coins awarded!");
            }
          } catch (err) {
            console.error("Failed to award coins", err);
          }
        }
      }
    };

    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [isWaitingForReward]);

  async function loadShopData() {
    try {
      const [userRes, packRes] = await Promise.all([
        fetch("/api/user/profile", { credentials: "include" }),
        fetch("/api/packs", { credentials: "include" }),
      ]);
      if (userRes.ok) setUser(await userRes.json());
      if (packRes.ok) setPacks(await packRes.json());
    } catch (err) { console.error(err); } finally { setLoading(false); }
  }

  useEffect(() => { loadShopData(); }, []);

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
            onClick={() => {
              sessionStorage.setItem("ad_clicked_at", Date.now().toString());
              setIsWaitingForReward(true);
              adService.current?.showAd(user?.email || "anonymous");
            }} 
            className="bg-blue-600 hover:bg-blue-500 px-5 py-2.5 rounded-full font-bold transition text-sm"
          >
            {isWaitingForReward ? "Return to claim..." : "Watch Ad for Coins"}
          </button>
          <button onClick={() => setIsFastOpen(!isFastOpen)} className={`px-5 py-2.5 rounded-full font-bold transition text-sm ${isFastOpen ? "bg-amber-500 text-black" : "bg-zinc-800 hover:bg-zinc-700"}`}>
            {isFastOpen ? "⚡ Fast Mode (1.2x)" : "⚡ Standard Mode"}
          </button>
        </div>
      </header>
      
      {/* ... rest of your pack rendering code ... */}
    </div>
  );
}