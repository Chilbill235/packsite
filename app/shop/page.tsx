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
  const [isWaitingForReward, setIsWaitingForReward] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);
  const [errorDialog, setErrorDialog] = useState<{ message: string } | null>(null);
  
  const adService = useRef<RewardedAdService | null>(null);

  const notify = (msg: string, duration = 4000) => {
    setNotification(msg);
    if (duration > 0) setTimeout(() => setNotification(null), duration);
  };

  async function loadShopData() {
    try {
      const [userRes, packRes] = await Promise.all([
        fetch("/api/user/profile"), fetch("/api/packs")
      ]);
      if (userRes.ok) setUser(await userRes.json());
      if (packRes.ok) setPacks(await packRes.json());
    } catch (err) { console.error(err); } finally { setLoading(false); }
  }

  const handleClaimReward = async () => {
    sessionStorage.removeItem("ad_clicked_at");
    setIsWaitingForReward(false);
    
    // API route triggers server-side Push Notification via web-push
    const res = await fetch("/api/user/add-coins", { method: "POST" });
    if (res.ok) {
      const data = await res.json();
      // Update state immediately to trigger re-render of the gold pill
      setUser(prev => prev ? {...prev, balance: data.newBalance} : null);
      notify("🎉 Success! 500 coins added.");
    }
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isWaitingForReward) {
      interval = setInterval(() => {
        const clickedAt = parseInt(sessionStorage.getItem("ad_clicked_at") || "0");
        const elapsed = Date.now() - clickedAt;
        const remaining = Math.max(0, 10 - Math.floor(elapsed / 1000));
        
        if (remaining > 0) {
          setNotification(`⏳ Keep this tab open: ${remaining}s remaining...`);
        } else {
          clearInterval(interval);
          handleClaimReward();
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isWaitingForReward]);

  useEffect(() => {
    if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw1.js').catch(console.error);
    adService.current = new RewardedAdService();
    loadShopData();
  }, []);

  const handleOpenPack = async (pack: PackWithItems) => {
    try {
      const res = await fetch("/api/packs/open", { 
        method: "POST", 
        body: JSON.stringify({ packId: pack.id }), 
        headers: {"Content-Type": "application/json"} 
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      // Update balance and refresh data
      await loadShopData(); 
      notify(`🎉 Won ${data.wonItem.name}!`);
    } catch (err: any) { setErrorDialog({ message: err.message }); }
  };

  if (loading) return <div className="min-h-screen bg-black text-white flex items-center justify-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-black text-white p-8">
      {notification && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-blue-900 border border-blue-700 px-6 py-3 rounded-full shadow-2xl text-center animate-pulse">
          {notification}
        </div>
      )}
      
      <header className="max-w-7xl mx-auto flex justify-between items-center mb-12 pb-8 border-b border-zinc-900">
        <h1 className="text-4xl font-black">Pick A Pack</h1>
        
        <div className="flex items-center gap-4">
          {/* Gold Coin Pill - Updates in real-time via 'user' state */}
          <div className="bg-zinc-900 border border-yellow-600 text-yellow-500 px-5 py-2.5 rounded-full font-bold text-sm">
            {user?.balance.toLocaleString()} COINS
          </div>
          
          <button 
            onClick={() => {
              sessionStorage.setItem("ad_clicked_at", Date.now().toString());
              setIsWaitingForReward(true);
              adService.current?.showAd(user?.email || "anonymous");
            }} 
            className="bg-blue-600 hover:bg-blue-500 px-5 py-2.5 rounded-full font-bold text-sm"
          >
            Watch Ad for Coins
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto grid grid-cols-4 gap-6">
        {packs.map((pack) => (
          <div key={pack.id} className="bg-zinc-900 p-5 rounded-3xl border border-zinc-800">
            <h2 className="font-bold mb-4">{pack.name}</h2>
            <button onClick={() => handleOpenPack(pack)} className="w-full bg-white text-black font-black py-3 rounded-2xl text-sm uppercase">
              {pack.price} Coins
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}