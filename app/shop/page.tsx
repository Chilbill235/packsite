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
      setLoading(true);
      const [userRes, packRes] = await Promise.all([
        fetch("/api/user/profile"),
        fetch("/api/packs")
      ]);
      if (userRes.ok) setUser(await userRes.json());
      if (packRes.ok) setPacks(await packRes.json());
    } catch (err) {
      console.error(err);
      notify("Failed to load shop data. Please try again.");
    } finally { setLoading(false); }
  }

  const handleClaimReward = async () => {
    sessionStorage.removeItem("ad_clicked_at");
    setIsWaitingForReward(false);

    const res = await fetch("/api/user/add-coins", { method: "POST" });
    if (res.ok) {
      const data = await res.json();
      setUser(prev => prev ? {...prev, balance: data.newBalance} : null);

      // DISPATCH EVENT: Updates Navbar globally
      window.dispatchEvent(new CustomEvent("balanceChanged", { detail: data.newBalance }));

      notify("🎉 Success! 500 coins added.");
    }
  };

  const handleOpenPack = async (pack: PackWithItems) => {
    try {
      const res = await fetch("/api/packs/open", {
        method: "POST",
        body: JSON.stringify({ packId: pack.id }),
        headers: {"Content-Type": "application/json"}
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      // Update state and broadcast new balance to Navbar
      setUser(prev => prev ? {...prev, balance: data.newBalance} : null);
      window.dispatchEvent(new CustomEvent("balanceChanged", { detail: data.newBalance }));

      notify(`🎉 Won ${data.wonItem.name}!`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An unexpected error occurred.";
      setErrorDialog({ message: errorMessage });
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

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin h-8 w-8 border-4 border-amber-300 border-t-transparent rounded-full mx-auto"></div>
          <p>Loading shop...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white min-h-[calc(100vh-4rem)]">
      {/* Notification Toast */}
      {notification && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-amber-900/90 border border-amber-700 px-6 py-3 rounded-xl shadow-2xl text-center backdrop-blur-sm">
          {notification}
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Page Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-amber-400 to-amber-600 bg-clip-text text-transparent mb-4">
            Pack Shop
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Discover exciting mystery packs filled with rare and valuable items!
          </p>
        </div>

        {/* Ad Reward Section - Enhanced */}
        <div className="mb-12 text-center">
          <div
            onClick={() => {
              sessionStorage.setItem("ad_clicked_at", Date.now().toString());
              setIsWaitingForReward(true);
              adService.current?.showAd(user?.email || "anonymous");
            }}
            className="inline-block bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-600 text-white font-bold py-4 px-8 rounded-2xl shadow-lg hover:shadow-xl transform transition-transform hover:scale-[1.02] flex items-center space-x-3"
          >
            <span className="text-2xl">🎬</span>
            <span>
              Watch Ad for 500 Coins
              {!isWaitingForReward && (
                <span className="ml-2 animate-pulse text-amber-300">→</span>
              )}
            </span>
          </div>
          {isWaitingForReward && (
            <div className="mt-4 text-sm text-amber-400">
              Waiting for ad completion... <span id="ad-countdown">10</span>s remaining
            </div>
          )}
        </div>

        {/* User Balance Display */}
        {user && (
          <div className="mb-10 text-center bg-gray-900/50 rounded-xl p-4 border border-gray-800">
            <span className="text-2xl text-amber-400">💰</span>
            <span className="ml-3 text-2xl font-bold">{user.balance.toLocaleString()}</span> coins
          </div>
        )}

        {/* Packs Grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {packs.map((pack) => (
            <div
              key={pack.id}
              className="group relative bg-gray-900/50 border border-gray-800 rounded-2xl p-6 hover:border-amber-300/50 transition-all hover:shadow-xl transform hover:-translate-y-1"
            >
              {/* Pack Image */}
              <div className="aspect-w-16 aspect-h-9 mb-4 rounded-xl overflow-hidden border border-gray-700">
                {pack.image ? (
                  <img
                    src={pack.image}
                    alt={pack.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full bg-gray-800">
                    <span className="text-5xl text-gray-600">📦</span>
                  </div>
                )}
              </div>

              {/* Pack Info */}
              <div className="text-center">
                <h2 className="text-xl font-bold text-white mb-2 truncate">{pack.name}</h2>
                <p className="text-gray-400 mb-4 line-clamp-2">{pack.description}</p>

                {/* Item Preview */}
                <div className="flex justify-center mb-4 space-x-2">
                  {pack.items.slice(0, 3).map((item, index) => (
                    <div key={index} className={`flex items-center justify-center w-10 h-10 rounded-full bg-gray-800 border-2 border-gray-700`}>
                      {item.rarity === 'legendary' ? '👑' : item.rarity === 'rare' ? '💎' : '📦'}
                    </div>
                  ))}
                  {pack.items.length > 3 && (
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-800 border-2 border-gray-700">
                      +{pack.items.length - 3}
                    </div>
                  )}
                </div>

                {/* Price Button */}
                <button
                  onClick={() => handleOpenPack(pack)}
                  className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-600 text-white font-bold py-3 px-4 rounded-lg hover:shadow-lg transition-transform hover:scale-[1.02] flex items-center justify-center space-x-2"
                  disabled={isWaitingForReward}
                >
                  <span className="text-amber-300">💰</span>
                  <span>{pack.price.toLocaleString()}</span>
                  <span className="text-amber-300">coins</span>
                </button>
              </div>

              {/* Rarity Badge - Top Right */}
              <div className="absolute top-3 right-3">
                <span className="text-xs font-bold text-white px-2 py-0.5 rounded"
                  className={pack.items.some(item => item.rarity === 'legendary') ? 'bg-emerald-900/50 text-emerald-400' :
                           pack.items.some(item => item.rarity === 'rare') ? 'bg-amber-900/50 text-amber-400' :
                           'bg-gray-900/50 text-gray-400'}
                >
                  {pack.items.some(item => item.rarity === 'legendary') ? 'Legendary' :
                   pack.items.some(item => item.rarity === 'rare') ? 'Rare' : 'Common'}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Call to Action for Empty State */}
        {packs.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-400">No packs available at the moment.</p>
            <Link
              href="/"
              className="mt-6 inline-block px-6 py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-md hover:shadow-md"
            >
              Return to Home
            </Link>
          </div>
        )}
      </div>

      {/* Error Dialog */}
      {errorDialog && <ErrorDialog message={errorDialog.message} onClose={() => setErrorDialog(null)} />}
    </div>
  );
}