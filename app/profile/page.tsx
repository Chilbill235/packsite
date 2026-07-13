"use client";

import { useEffect, useState } from "react";
import Notification from "@/components/Notification";
import ErrorDialog from "@/components/ErrorDialog";
import Balance from "@/components/Balance";

type ProfileUser = {
  name: string;
  email: string;
  balance: number;
  username?: string;
  id: string;
  createdAt?: string;
  lastAdWatched?: string | null;
};

export default function ProfilePage() {
  const [user, setUser] = useState<ProfileUser | null>(null);
  const [inventory, setInventory] = useState<any[]>([]);
  const [openings, setOpenings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ message: string; type?: "success" | "error" } | null>(null);
  const [errorDialog, setErrorDialog] = useState<{ message: string; onRetry?: () => void } | null>(null);
  const [tabs, setTabs] = useState<"overview" | "inventory" | "activity">("overview");

  useEffect(() => {
    async function loadProfile() {
      try {
        setLoading(true);
        const res = await fetch("/api/user/profile");
        if (!res.ok) throw new Error("Failed to load profile");
        const data = await res.json();
        setUser(data);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Unexpected error");
      } finally {
        setLoading(false);
      }
    }

    async function loadInventory() {
      try {
        const res = await fetch("/api/inventory");
        if (!res.ok) throw new Error("Failed to load inventory");
        const data = await res.json();
        setInventory(data.inventory || []);
      } catch (err) {
        console.error("Failed to load inventory:", err);
      }
    }

    async function loadOpenings() {
      try {
        const res = await fetch("/api/openings");
        if (!res.ok) throw new Error("Failed to load opening history");
        const data = await res.json();
        setOpenings(data.openings || []);
      } catch (err) {
        console.error("Failed to load opening history:", err);
      }
    }

    loadProfile();
    loadInventory();
    loadOpenings();
  }, []);

  useEffect(() => {
    const handleBalanceChange = (event: Event) => {
      const newBalance = (event as CustomEvent<number>).detail;
      setUser(prev => prev ? {...prev, balance: newBalance} : null);
    };
    document.addEventListener("balanceChanged", handleBalanceChange);
    return () => document.removeEventListener("balanceChanged", handleBalanceChange);
  }, []);

  const getStatusColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'common': return 'border-gray-400 bg-gray-900/20 text-gray-400';
      case 'rare': return 'border-amber-400 bg-amber-900/20 text-amber-400';
      case 'legendary': return 'border-emerald-400 bg-emerald-900/20 text-emerald-400';
      default: return 'border-gray-400 bg-gray-900/20 text-gray-400';
    }
  };

  const getStatusText = (type: string) => {
    switch (type.toLowerCase()) {
      case 'common': return 'Common';
      case 'rare': return 'Rare';
      case 'legendary': return 'Legendary';
      default: return type;
    }
  };

  if (error) return <div className="min-h-screen flex items-center justify-center bg-black text-white p-6"><div className="text-center bg-gray-800/50 p-8 max-w-md w-full"><h2 className="text-xl font-bold mb-4">Error</h2><p>{error}</p><button onClick={() => window.location.reload()} className="mt-6 w-full bg-amber-600 py-2 rounded">Try Again</button></div></div>;
  if (loading) return <div className="min-h-screen flex items-center justify-center bg-black"><div className="animate-spin h-8 w-8 border-4 border-amber-300 border-t-transparent rounded-full"></div></div>;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 to-black">
      <header className="bg-black/50 backdrop-blur-sm border-b border-gray-800/50 px-6 py-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between">
          <div className="space-y-2"><h1 className="text-3xl font-bold text-white">Welcome back, {user?.name || 'Explorer'}!</h1><p className="text-gray-300">Your collector's hub</p></div>
          <div className="flex items-center space-x-4"><span className="text-2xl text-amber-400">💰</span><div><p className="text-sm font-medium text-gray-400">Balance</p><p className="text-2xl font-bold text-amber-300">{user?.balance?.toLocaleString() || '0'}</p></div></div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Tab Selection */}
        <div className="flex space-x-2 mb-8">
          {(["overview", "inventory", "activity"] as const).map((t) => (
            <button key={t} onClick={() => setTabs(t)} className={`px-4 py-2 rounded-lg capitalize ${tabs === t ? "bg-amber-600/30 text-amber-300 border-b-2 border-amber-400" : "text-gray-400"}`}>{t}</button>
          ))}
        </div>

        {/* Overview Tab */}
        {tabs === "overview" && (
          <div className="space-y-8">
            <div className="grid gap-6 md:grid-cols-3">
              <div className="bg-gray-900/50 rounded-xl p-6 border border-gray-800">
                <h3 className="text-amber-300">Total Packs Opened</h3>
                <p className="text-3xl font-bold">{openings.length}</p>
              </div>
              <div className="bg-gray-900/50 rounded-xl p-6 border border-gray-800">
                <h3 className="text-emerald-300">Rarest Item Value</h3>
                <p className="text-3xl font-bold">{inventory.reduce((max, item) => Math.max(max, item.item?.value || 0), 0).toLocaleString()} coins</p>
              </div>
            </div>
          </div>
        )}

        {/* Inventory Tab */}
        {tabs === "inventory" && (
          <div className="grid gap-6 md:grid-cols-3">
            {inventory.map((item, index) => (
              <div key={index} className="group relative bg-gray-900/50 border border-gray-800 rounded-xl p-6">
                <div className="absolute top-2 right-2">
                  <span className={`text-xs font-bold text-white px-2 py-0.5 rounded ${getStatusColor(item.item?.rarity || '')}`}>
                    {getStatusText(item.item?.rarity || '')}
                  </span>
                </div>
                <div className="h-16 w-16 bg-gray-800/50 rounded-xl mb-4 flex items-center justify-center text-3xl">
                  {item.item?.rarity === 'legendary' ? '👑' : item.item?.rarity === 'rare' ? '💎' : '📦'}
                </div>
                <h3 className="font-semibold text-white">{item.item?.name || 'Unknown'}</h3>
                <button className="w-full mt-4 bg-gray-800 hover:bg-amber-900 py-2 rounded">Sell</button>
              </div>
            ))}
          </div>
        )}

        {/* Activity Tab */}
        {tabs === "activity" && (
          <div className="space-y-4">
            {openings.map((opening, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-gray-900/50 rounded-xl border border-gray-800">
                <div className="flex items-center gap-4">
                  <div className={`p-2 rounded border font-bold text-sm ${getStatusColor(opening.item?.rarity || '')}`}>
                    {opening.item?.rarity?.charAt(0) || '?'}
                  </div>
                  <div>
                    <p className="font-medium">{opening.item?.name}</p>
                    <p className="text-sm text-gray-400">{new Date(opening.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
                <span className="text-amber-400 font-medium">+{opening.item?.value?.toLocaleString()} coins</span>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}