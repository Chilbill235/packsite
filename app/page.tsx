"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { RewardedAdService } from '@/lib/adService';

export default function Home() {
  const { data: session, status } = useSession();
  const user = session?.user;
  const adService = useRef<RewardedAdService | null>(null);
  const [balance, setBalance] = useState(0);
  const [totalOpened, setTotalOpened] = useState(0);
  const [rarestItem, setRarestItem] = useState({ name: "None yet", value: 0 });

  useEffect(() => {
    adService.current = new RewardedAdService();
  }, []);

  const isAuthenticated = status === "authenticated" && !!user;

  useEffect(() => {
    if (user && typeof (user as any).balance === 'number') {
      setBalance((user as any).balance);
    } else {
      setBalance(0);
    }
  }, [user]);

  useEffect(() => {
    const handleBalanceChange = (event: Event) => {
      setBalance((event as CustomEvent<number>).detail);
    };
    document.addEventListener("balanceChanged", handleBalanceChange);
    return () => document.removeEventListener("balanceChanged", handleBalanceChange);
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      const fetchStats = async () => {
        try {
          const [invRes, openRes] = await Promise.all([
            fetch("/api/inventory"),
            fetch("/api/openings")
          ]);
          const invData = await invRes.json();
          const openData = await openRes.json();

          setTotalOpened(openData.openings?.length || 0);

          const items = invData.inventory || [];
          let maxRarityValue = 0;
          let rarestName = "None yet";
          const rarityValues: Record<string, number> = { common: 1, rare: 2, legendary: 3 };
          for (const inv of items) {
            const rarity = inv.item?.rarity?.toLowerCase() || "common";
            const value = rarityValues[rarity] || 0;
            if (value > maxRarityValue) {
              maxRarityValue = value;
              rarestName = inv.item?.name || "Unknown";
            }
          }
          setRarestItem({ name: rarestName, value: maxRarityValue });
        } catch (err) {
          console.error("Failed to load stats:", err);
        }
      };
      fetchStats();
    }
  }, [isAuthenticated]);

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-b from-gray-950 to-black text-white">
      <header className="max-w-7xl mx-auto px-6 py-12 text-center">
        <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-amber-300 to-amber-500 bg-clip-text text-transparent">
          {isAuthenticated ? `Welcome back, ${user!.name}!` : "Welcome to PackSite"}
        </h1>
        <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
          Open mystery packs, collect rare items, and build your ultimate collection!
        </p>
        {!isAuthenticated ? (
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/login" className="flex-1 px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-600 text-white font-semibold rounded-lg transition-transform hover:scale-[1.02]">
              Sign In
            </Link>
            <Link href="/register" className="flex-1 px-6 py-3 border border-gray-600 hover:border-amber-300 hover:bg-gray-800 text-gray-200 font-medium rounded-lg transition-transform hover:scale-[1.02]">
              Create Account
            </Link>
          </div>
        ) : (
          <Link href="/shop" className="inline-block px-8 py-4 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-600 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-transform hover:scale-[1.02]">
            Browse Packs →
          </Link>
        )}
      </header>

      {isAuthenticated && (
        <section className="py-16">
          <div className="max-w-7xl mx-auto px-6 grid gap-8 md:grid-cols-3 text-center">
            {/* Stats Cards */}
            <div className="bg-gray-900/50 rounded-xl p-6 border border-gray-800">
              <div className="flex items-center justify-center mb-4"><span className="text-2xl text-amber-400">💰</span></div>
              <h3 className="font-semibold text-amber-300 mb-2">Your Balance</h3>
              <p className="text-3xl font-bold text-white">{typeof balance === 'number' ? balance.toLocaleString() : '0'}</p>
            </div>
            <div className="bg-gray-900/50 rounded-xl p-6 border border-gray-800">
              <div className="flex items-center justify-center mb-4"><span className="text-2xl text-green-400">📦</span></div>
              <h3 className="font-semibold text-green-300 mb-2">Total Packs Opened</h3>
              <p className="text-3xl font-bold text-white">{totalOpened}</p>
            </div>
            <div className="bg-gray-900/50 rounded-xl p-6 border border-gray-800">
              <div className="flex items-center justify-center mb-4"><span className="text-2xl text-blue-400">🏆</span></div>
              <h3 className="font-semibold text-blue-300 mb-2">Rarest Item</h3>
              <p className="text-2xl font-bold text-white">{rarestItem.name} {rarestItem.value > 0 ? `(${rarestItem.value.toLocaleString()} coins)` : ""}</p>
            </div>
          </div>

          {/* Trademark Section (Added back directly under stats) */}
          <div className="mt-8 text-center opacity-60">
            <p className="text-xs text-gray-500 font-bold tracking-widest uppercase">PackSite™ Official Collector Platform</p>
          </div>
        </section>
      )}

      {/* Featured Packs Section */}
      <section className="py-16 bg-gray-900/50">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-12">Featured Packs</h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
             {/* ... (Keep your existing featured pack cards here) ... */}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900/50 text-gray-400 py-8">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <p>&copy; {new Date().getFullYear()} PackSite. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}