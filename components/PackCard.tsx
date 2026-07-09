"use client";

import { useState } from "react";
import type { Item } from "@prisma/client";
import type { PackWithItems } from "@/types";
import Balance from "./Balance";
import ErrorDialog from "./ErrorDialog";
import Notification from "./Notification";

interface PackCardProps {
  pack: PackWithItems;
  userBalance: number;
  onOpenSuccess: (item: Item, newBalance: number) => void;
}

export default function PackCard({ pack, userBalance, onOpenSuccess }: PackCardProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleOpenPack = async () => {
    if (userBalance < pack.price) {
      setError("Insufficient balance");
      return;
    }
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/packs/open", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packId: pack.id }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to open");
      }

      onOpenSuccess(data.wonItem, data.newBalance);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to open pack");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col bg-zinc-900 border border-zinc-800 rounded-2xl p-5 hover:border-zinc-700 transition-all">
      <div className="flex items-center justify-center w-full aspect-square bg-zinc-950 rounded-xl mb-4 border border-zinc-800 overflow-hidden">
        <span className="text-[100px]">{pack.image}</span>
      </div>
      <h3 className="text-xl font-bold">{pack.name}</h3>
      <div className="flex items-center justify-between mt-auto pt-4">
        <Balance amount={pack.price} className="bg-zinc-800/50" />
        <button
          onClick={handleOpenPack}
          disabled={loading}
          className="bg-amber-500 hover:bg-amber-400 px-4 py-2 rounded-xl text-black font-bold uppercase text-xs transition-all disabled:opacity-50 w-full md:w-auto"
        >
          {loading ? "Rolling..." : "Open"}
        </button>
      </div>
      {error && <ErrorDialog message={error} onClose={() => setError(null)} onRetry={handleOpenPack} />}
    </div>
  );
}
