// components/PackCardFancy.tsx
"use client";

import { useState } from "react";
import type { Item } from "@prisma/client";
import type { PackWithItems } from "@/types";
import { rarityColor } from "@/utils/rarityColor";

interface PackCardFancyProps {
  pack: PackWithItems;
  userBalance: number;
  onOpenSuccess: (item: Item, newBalance: number) => void;
}

export default function PackCardFancy({ pack, userBalance, onOpenSuccess }: PackCardFancyProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Determine highest rarity in the pack for styling
  const rarityOrder: Record<string, number> = {
    COMMON: 1,
    RARE: 2,
    EPIC: 3,
    LEGENDARY: 4,
    MYTHIC: 5,
  };
  const packRarity = pack.items.reduce((acc, cur) => {
    return rarityOrder[cur.rarity] > rarityOrder[acc] ? cur.rarity : acc;
  }, "COMMON");
  // Badge background colour per rarity
  const badgeBg = {
    COMMON: "bg-gray-600",
    RARE: "bg-indigo-600",
    EPIC: "bg-purple-600",
    LEGENDARY: "bg-yellow-600",
    MYTHIC: "bg-red-600",
  }[packRarity];

  const handleOpen = async () => {
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
      if (!res.ok) throw new Error(data.error || "Failed to open pack");
      onOpenSuccess(data.wonItem, data.newBalance);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unexpected error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`group relative rounded-2xl overflow-hidden border-2 ${rarityColor(packRarity)} bg-black bg-opacity-70 backdrop-blur-sm transition-transform hover:scale-105 hover:shadow-2xl duration-300`}>
    {/* Rarity badge */}
    <span className={`absolute top-2 left-2 px-2 py-0.5 rounded text-xs font-semibold uppercase ${badgeBg} bg-opacity-80 text-white`}>
      {packRarity}
    </span>
      <div className="relative h-48 bg-gradient-to-b from-gray-900 to-gray-800 flex items-center justify-center p-4">
        <span className="text-7xl">{pack.image}</span>
      </div>
      <div className="p-4 flex flex-col gap-2">
        <h3 className="text-xl font-bold text-white">{pack.name}</h3>
        <div className="flex justify-between mb-2">
          <span className="text-lg font-semibold text-amber-400">{pack.price} coins</span>
          <button
            onClick={handleOpen}
            disabled={loading}
            className={`bg-gradient-to-r from-amber-400 to-amber-600 text-black font-bold py-2 px-4 rounded-xl transform transition-all duration-200 ${loading ? "opacity-50 cursor-not-allowed" : "hover:scale-105"}`}
          >
            {loading ? "Rolling…" : "Open"}
          </button>
        </div>
        {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
      </div>
    </div>
  );
}

