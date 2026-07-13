"use client";

import { useState, useEffect, useRef } from "react";
import ErrorDialog from "@/components/ErrorDialog";
import { RewardedAdService } from '@/lib/adService';
import type { PackWithItems } from "@/types";
import Link from "next/link";

export default function ShopPage() {
  const [packs, setPacks] = useState<PackWithItems[]>([]);
  const [user, setUser] = useState<{ balance: number; email?: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [isWaiting, setIsWaiting] = useState(false);
  const [countdown, setCountdown] = useState(10);
  const [notification, setNotification] = useState<string | null>(null);
  const [errorDialog, setErrorDialog] = useState<{ message: string } | null>(null);

  const adService = useRef<RewardedAdService | null>(null);

  // Helper for toast notifications
  const notify = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  // Initial load
  async function loadShopData() {
    try {
      const [userRes, packRes] = await Promise.all([
        fetch("/api/user/profile"),
        fetch("/api/packs")
      ]);
      if (userRes.ok) setUser(await userRes.json());
      if (packRes.ok) setPacks(await packRes.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  // Handle the reward claim after 10s
  const handleClaimReward = async () => {
    setIsWaiting(false);
    try {
      const res = await fetch("/api/user/add-coins", { method: "POST" });
      const data = await res.json();
      
      if (res.ok) {
        setUser(prev => prev ? { ...prev, balance: data.newBalance } : null);
        window.dispatchEvent(new CustomEvent("balanceChanged", { detail: data.newBalance }));
        notify("🎉 500 coins added successfully!");
      } else {
        throw new Error(data.error || "Failed to claim reward");
      }
    } catch (err) {
      setErrorDialog({ message: err instanceof Error ? err.message : "Error claiming reward." });
    }
  };

  // Countdown Logic
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isWaiting) {
      setCountdown(10);
      interval = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            handleClaimReward();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isWaiting]);

  // Setup initial requirements
  useEffect(() => {
    adService.current = new RewardedAdService();
    loadShopData();
    if ('Notification' in window) Notification.requestPermission();
  }, []);

  // Sync balance if other components change it
  useEffect(() => {
    const handleBalanceChange = (event: Event) => {
      const newBalance = (event as CustomEvent<number>).detail;
      setUser(prev => prev ? { ...prev, balance: newBalance } : null);
    };
    window.addEventListener("balanceChanged", handleBalanceChange);
    return () => window.removeEventListener("balanceChanged", handleBalanceChange);
  }, []);

  if (loading) return <div className="min-h-screen bg-black text-white flex items-center justify-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-black text-white p-6">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-amber-600 px-6 py-3 rounded-full shadow-lg animate-fade-in">
          {notification}
        </div>
      )}

      <div className="max-w-7xl mx-auto">
        {/* Ad Watcher Section */}
        <div className="mb-12 text-center border border-gray-800 p-8 rounded-3xl bg-gray-900/30">
          <button 
            onClick={() => { 
              setIsWaiting(true); 
              adService.current?.showAd(user?.email || "anon"); 
            }}
            disabled={isWaiting}
            className={`px-8 py-4 rounded-full font-bold transition-all ${isWaiting ? 'bg-gray-700 cursor-not-allowed' : 'bg-amber-500 hover:bg-amber-400 text-black'}`}
          >
            {isWaiting ? `Stay on page for ${countdown}s...` : "Watch Ad for 500 Coins"}
          </button>
        </div>

        {/* User Balance */}
        {user && (
          <div className="text-2xl font-bold mb-10 text-center">
            Balance: <span className="text-amber-400">{user.balance.toLocaleString()}</span>
          </div>
        )}

        {/* Pack Grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {packs.map((pack) => (
            <div key={pack.id} className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
              <h2 className="text-xl font-bold mb-2">{pack.name}</h2>
              <p className="text-gray-400 text-sm mb-4">{pack.description}</p>
              <button
                onClick={async () => {
                  const res = await fetch("/api/packs/open", { 
                    method: "POST", 
                    body: JSON.stringify({ packId: pack.id }),
                    headers: {"Content-Type": "application/json"}
                  });
                  const data = await res.json();
                  if (res.ok) {
                    setUser(prev => prev ? {...prev, balance: data.newBalance} : null);
                    window.dispatchEvent(new CustomEvent("balanceChanged", { detail: data.newBalance }));
                    notify(`🎉 You won: ${data.wonItem.name}`);
                  }
                }}
                className="w-full bg-amber-600 py-2 rounded-lg font-bold"
              >
                {pack.price.toLocaleString()} Coins
              </button>
            </div>
          ))}
        </div>
      </div>
      
      {errorDialog && <ErrorDialog message={errorDialog.message} onClose={() => setErrorDialog(null)} />}
    </div>
  );
}