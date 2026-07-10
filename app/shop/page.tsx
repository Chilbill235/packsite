"use client";

import { useState, useEffect } from "react";
import type { Item } from "@prisma/client";
import ErrorDialog from "@/components/ErrorDialog";
import WatchAdModal from "@/components/WatchAdModal";
import type { PackWithItems } from "@/types";

export default function ShopPage() {
  const [packs, setPacks] = useState<PackWithItems[]>([]);
  const [user, setUser] = useState<{ balance: number } | null>(null);
  const [loading, setLoading] = useState(true);

  const [isRevealing, setIsRevealing] = useState(false);
  const [rolledItem, setRolledItem] = useState<Item | null>(null);

  const [isFastOpen, setIsFastOpen] = useState(false);

  const [adCooldownEnd, setAdCooldownEnd] = useState(0);
  const [watchingAd, setWatchingAd] = useState(false);

  const [errorDialog, setErrorDialog] = useState<{
    message: string;
    onRetry?: () => void;
  } | null>(null);

  const FAST_MODE_MULTIPLIER = 1.2;

  useEffect(() => {
    async function loadShopData() {
      try {
        const [userRes, packRes] = await Promise.all([
          fetch("/api/user/profile", {
            credentials: "include",
          }),
          fetch("/api/packs", {
            credentials: "include",
          }),
        ]);

        if (userRes.ok) {
          setUser(await userRes.json());
        }

        if (packRes.ok) {
          setPacks(await packRes.json());
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    loadShopData();
  }, []);

  const updateBalance = (newBalance: number) => {
    setUser((prev) =>
      prev
        ? {
            ...prev,
            balance: newBalance,
          }
        : {
            balance: newBalance,
          }
    );

    document.dispatchEvent(
      new CustomEvent("balanceChanged", {
        detail: newBalance,
      })
    );
  };

  // Opens the fake rewarded ad
  const handleWatchAd = () => {
    if (Date.now() < adCooldownEnd) return;

    setWatchingAd(true);
  };

  // Called when the countdown finishes
  const rewardUser = async () => {
    try {
      const res = await fetch("/api/user/add-coins", {
        method: "POST",
        credentials: "include",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Unable to claim reward");
      }

      updateBalance(data.newBalance);

      setAdCooldownEnd(Date.now() + 30000);
    } catch (err: any) {
      setErrorDialog({
        message: err.message,
      });
    } finally {
      setWatchingAd(false);
    }
  };

  const handleOpenPack = async (pack: PackWithItems) => {
    try {
      const res = await fetch("/api/packs/open", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          packId: pack.id,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to open pack");
      }

      updateBalance(data.newBalance);

      if (!isFastOpen) {
        setRolledItem(data.wonItem);
        setIsRevealing(true);
      }

    } catch (err: any) {
      setErrorDialog({
        message: err.message,
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-white">
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-8">

      {errorDialog && (
        <ErrorDialog
          message={errorDialog.message}
          onClose={() => setErrorDialog(null)}
        />
      )}

      <WatchAdModal
        open={watchingAd}
        onFinished={rewardUser}
        onClose={() => setWatchingAd(false)}
      />

      <header className="max-w-7xl mx-auto flex justify-between items-center mb-12 pb-8 border-b border-zinc-900">

        <div>
          <h1 className="text-5xl font-black">
            Pick A Pack
          </h1>

          <p className="mt-2 text-zinc-400">
            Balance: {user?.balance ?? 0} Coins
          </p>
        </div>

        <div className="flex gap-4">

          <button
            onClick={handleWatchAd}
            disabled={Date.now() < adCooldownEnd}
            className="bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 px-5 py-2.5 rounded-full font-bold transition"
          >
            {Date.now() < adCooldownEnd
              ? "Cooldown..."
              : "Watch Ad (+500)"}
          </button>

          <button
            onClick={() => setIsFastOpen(!isFastOpen)}
            className={`px-5 py-2.5 rounded-full font-bold transition ${
              isFastOpen
                ? "bg-amber-500 text-black"
                : "bg-zinc-800 hover:bg-zinc-700"
            }`}
          >
            {isFastOpen
              ? "⚡ Fast Mode (1.2x)"
              : "⚡ Standard Mode"}
          </button>

        </div>

      </header>

      <div className="max-w-7xl mx-auto grid grid-cols-4 gap-6">

        {packs.map((pack) => (
          <div
            key={pack.id}
            className="bg-zinc-900 p-6 rounded-3xl border border-zinc-800 hover:border-zinc-700 transition"
          >

            <h2 className="text-lg font-bold mb-2">
              {pack.name}
            </h2>

            <button
              onClick={() => handleOpenPack(pack)}
              className="w-full bg-white hover:bg-zinc-200 text-black font-black py-3 rounded-2xl transition"
            >
              {isFastOpen
                ? Math.ceil(pack.price * FAST_MODE_MULTIPLIER)
                : pack.price}{" "}
              COINS
            </button>

          </div>
        ))}

      </div>

      {isRevealing && rolledItem && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-sm"
          onClick={() => setIsRevealing(false)}
        >
          <div
            className="bg-zinc-900 rounded-3xl p-10 text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-zinc-500 uppercase tracking-widest text-sm mb-4">
              You Won!
            </p>

            <p className="text-3xl font-black mb-8">
              {rolledItem.name}
            </p>

            <button
              onClick={() => setIsRevealing(false)}
              className="bg-amber-500 hover:bg-amber-400 text-black px-8 py-3 rounded-xl font-bold"
            >
              Collect
            </button>
          </div>
        </div>
      )}
    </div>
  );
}