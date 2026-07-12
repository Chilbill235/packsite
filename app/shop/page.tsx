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
  const [notification, setNotification] = useState<string | null>(null);
  
  const adService = useRef<RewardedAdService | null>(null);
  const FAST_MODE_MULTIPLIER = 1.2;

  const notify = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 4000);
  };

  useEffect(() => {
    if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw1.js').catch(console.error);
    adService.current = new RewardedAdService();
    loadShopData();
  }, []);

  const subscribeToPush = async () => {
    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') return notify("❌ Permission denied.");
      
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
      });

      // Added credentials: "include" to send session cookies
      await fetch("/api/user/subscribe", {
        method: "POST",
        body: JSON.stringify(sub),
        headers: { "Content-Type": "application/json" },
        credentials: "include" 
      });
      
      notify("✅ Notifications enabled!");
    } catch (err) { console.error(err); }
  };

  useEffect(() => {
    const handleFocus = async () => {
      const clickedAt = sessionStorage.getItem("ad_clicked_at");
      if (clickedAt && isWaitingForReward) {
        if (Date.now() - parseInt(clickedAt) < 10000) {
          notify("⚠️ Stay on the ad page for 10 seconds!");
          return;
        }
        sessionStorage.removeItem("ad_clicked_at");
        setIsWaitingForReward(false);
        const res = await fetch("/api/user/add-coins", { method: "POST" });
        if (res.ok) {
          const data = await res.json();
          setUser(prev => prev ? {...prev, balance: data.newBalance} : null);
          notify("✅ Success! 500 coins added.");
        }
      }
    };
    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [isWaitingForReward]);

  async function loadShopData() {
    try {
      const [userRes, packRes] = await Promise.all([
        fetch("/api/user/profile"), fetch("/api/packs")
      ]);
      if (userRes.ok) setUser(await userRes.json());
      if (packRes.ok) setPacks(await packRes.json());
    } catch (err) { console.error(err); } finally { setLoading(false); }
  }

  const handleOpenPack = async (pack: PackWithItems) => {
    try {
      const res = await fetch("/api/packs/open", { 
        method: "POST", 
        body: JSON.stringify({ packId: pack.id }), 
        headers: {"Content-Type": "application/json"} 
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setUser(prev => prev ? {...prev, balance: data.newBalance} : null);
      if (!isFastOpen) { setRolledItem(data.wonItem); setIsRevealing(true); }
      else notify(`🎉 Won ${data.wonItem.name}!`);
    } catch (err: any) { setErrorDialog({ message: err.message }); }
  };

  if (loading) return <div className="min-h-screen bg-black text-white flex items-center justify-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-black text-white p-8">
      {notification && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-zinc-900 border border-zinc-700 px-6 py-3 rounded-full shadow-2xl">
          {notification}
        </div>
      )}
      {errorDialog && <ErrorDialog message={errorDialog.message} onClose={() => setErrorDialog(null)} />}
      
      <header className="max-w-7xl mx-auto flex justify-between items-center mb-12 pb-8 border-b border-zinc-900">
        <div>
          <h1 className="text-4xl font-black">Pick A Pack</h1>
          <p className="text-zinc-400">Balance: {user?.balance ?? 0} Coins</p>
        </div>
        <div className="flex gap-3">
          <button onClick={subscribeToPush} className="bg-zinc-800 hover:bg-zinc-700 px-5 py-2.5 rounded-full text-sm font-bold">Enable Notifications</button>
          <button 
            onClick={() => {
              sessionStorage.setItem("ad_clicked_at", Date.now().toString());
              setIsWaitingForReward(true);
              adService.current?.showAd(user?.email || "anonymous");
            }} 
            className="bg-blue-600 hover:bg-blue-500 px-5 py-2.5 rounded-full font-bold text-sm"
          >
            {isWaitingForReward ? "Return to claim..." : "Watch Ad for Coins"}
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto grid grid-cols-4 gap-6">
        {packs.map((pack) => (
          <div key={pack.id} className="bg-zinc-900 p-5 rounded-3xl border border-zinc-800">
            <h2 className="font-bold mb-4">{pack.name}</h2>
            <button onClick={() => handleOpenPack(pack)} className="w-full bg-white text-black font-black py-3 rounded-2xl text-sm uppercase">
              {isFastOpen ? Math.ceil(pack.price * FAST_MODE_MULTIPLIER) : pack.price} Coins
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}