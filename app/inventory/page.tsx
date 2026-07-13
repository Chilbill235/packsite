"use client";

import { useState, useEffect, useMemo } from "react";
import Notification from "@/components/Notification";
import ErrorDialog from "@/components/ErrorDialog";
import type { InventoryWithItem } from "@/types";

export default function InventoryPage() {
  const [inventory, setInventory] = useState<InventoryWithItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState<{ message: string; type?: "success" | "error" } | null>(null);
  const [errorDialog, setErrorDialog] = useState<{ message: string; onRetry?: () => void } | null>(null);
  const [sellingId, setSellingId] = useState<string | null>(null);
  const [isSellingAll, setIsSellingAll] = useState(false);
  const [filter, setFilter] = useState<"all" | "common" | "rare" | "legendary">("all");
  const [sortBy, setSortBy] = useState<"value" | "name" | "date">("value");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  async function loadInventory() {
    try {
      setLoading(true);
      const res = await fetch("/api/inventory");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load inventory");
      setInventory(data.inventory || []);
    } catch (err) {
      console.error("Failed to load inventory:", err);
      setErrorDialog({ message: "Failed to load inventory. Please try again later." });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadInventory();
  }, []);

  useEffect(() => {
    const handleBalanceChange = (event: Event) => {
      const newBalance = (event as CustomEvent<number>).detail;
      localStorage.setItem('userBalance', newBalance.toString());
    };
    document.addEventListener("balanceChanged", handleBalanceChange);
    return () => document.removeEventListener("balanceChanged", handleBalanceChange);
  }, []);

  const filteredInventory = useMemo(() => {
    if (filter === "all") return inventory;
    return inventory.filter(item => item.item?.rarity.toLowerCase() === filter);
  }, [inventory, filter]);

  const sortedInventory = useMemo(() => {
    return [...filteredInventory].sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case "value":
          comparison = (b.item?.value || 0) - (a.item?.value || 0);
          break;
        case "name":
          comparison = (a.item?.name || "").localeCompare(b.item?.name || "");
          break;
        case "date":
          comparison = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          break;
      }
      return sortOrder === "asc" ? comparison : -comparison;
    });
  }, [filteredInventory, sortBy, sortOrder]);

  const handleSell = async (inventoryId: string) => {
    setSellingId(inventoryId);
    try {
      const res = await fetch(`/api/inventory/${inventoryId}/sell`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to sell item");
      setInventory(prev => prev.filter(i => i.id !== inventoryId));
      document.dispatchEvent(new CustomEvent("balanceChanged", { detail: data.newBalance }));
      localStorage.setItem('userBalance', data.newBalance.toString());
      setNotification({ message: "Item sold successfully!", type: "success" });
    } catch (err) {
      setErrorDialog({
        message: err instanceof Error ? err.message : "Failed to sell item",
        onRetry: () => { setErrorDialog(null); handleSell(inventoryId); }
      });
    } finally {
      setSellingId(null);
    }
  };

  const handleSellAll = async () => {
    setIsSellingAll(true);
    try {
      const res = await fetch("/api/inventory/sell-all", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to sell all items");
      setInventory([]);
      document.dispatchEvent(new CustomEvent("balanceChanged", { detail: data.newBalance }));
      localStorage.setItem('userBalance', data.newBalance.toString());
      setNotification({ message: "All items sold successfully!", type: "success" });
    } catch (err) {
      setErrorDialog({
        message: err instanceof Error ? err.message : "Failed to sell all items",
        onRetry: () => { setErrorDialog(null); handleSellAll(); }
      });
    } finally {
      setIsSellingAll(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="h-12 w-12 border-4 border-amber-300 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-lg text-gray-300">Loading your inventory...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 to-black">
      <header className="bg-black/50 backdrop-blur-sm border-b border-gray-800/50 px-6 py-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between">
          <h1 className="text-3xl font-bold text-white">Your Inventory</h1>
          <div className="flex items-center space-x-3">
             <span className="text-2xl text-amber-400">💰</span>
             <div>
               <p className="text-sm font-medium text-gray-400">Balance</p>
               <p className="text-2xl font-bold text-amber-300">{typeof window !== 'undefined' ? localStorage.getItem('userBalance') || '0' : '0'}</p>
             </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-6">
        {inventory.length === 0 ? (
          <div className="text-center py-20 text-white">Your inventory is empty.</div>
        ) : (
          <div className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {sortedInventory.map((item) => (
                <div key={item.id} className="group relative bg-gray-900/50 border border-gray-800 rounded-xl p-6">
                  {/* Fixed: Consolidated into one className prop */}
                  <div className="absolute top-3 right-3">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded ${getRarityBadgeClass(item.item?.rarity || '')}`}>
                      {getRarityDisplayText(item.item?.rarity || '')}
                    </span>
                  </div>

                  <div className="aspect-square mb-4 bg-gray-800/50 rounded-xl flex items-center justify-center text-3xl">
                    {getItemIcon(item.item?.rarity || '')}
                  </div>

                  <div className="space-y-2 text-center">
                    <h3 className="font-semibold text-white">{item.item?.name || 'Unknown Item'}</h3>
                    <button 
                      onClick={() => handleSell(item.id)}
                      disabled={sellingId === item.id}
                      className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white py-2 px-4 rounded-md"
                    >
                      {sellingId === item.id ? "Selling..." : "Sell"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function getRarityBadgeClass(rarity: string): string {
  switch (rarity.toLowerCase()) {
    case 'common': return 'bg-gray-900/50 text-gray-400';
    case 'rare': return 'bg-amber-900/50 text-amber-400';
    case 'legendary': return 'bg-emerald-900/50 text-emerald-400';
    default: return 'bg-gray-900/50 text-gray-400';
  }
}

function getRarityDisplayText(rarity: string): string {
  return rarity.charAt(0).toUpperCase() + rarity.slice(1);
}

function getItemIcon(rarity: string): string {
  switch (rarity.toLowerCase()) {
    case 'legendary': return '👑';
    case 'rare': return '💎';
    default: return '📦';
  }
}

function AdUnit() {
  useEffect(() => {
    try {
      // @ts-ignore
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (e) {
      console.error("AdSense Error:", e);
    }
  }, []);

  return (
    <ins
      className="adsbygoogle"
      style={{ display: "block", textAlign: "center" }}
      data-ad-client="ca-pub-1167000799645777"
      data-ad-slot="9501413049"
      data-ad-format="auto"
      data-full-width-responsive="true"
    ></ins>
  );
}