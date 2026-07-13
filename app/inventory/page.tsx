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

  useEffect(() => {
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
    loadInventory();
  }, []);

  // Handle balance updates from other components
  useEffect(() => {
    const handleBalanceChange = (event: Event) => {
      const newBalance = (event as CustomEvent<number>).detail;
      // Update balance in localStorage for persistence
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
      setLoading(true);
      const res = await fetch(`/api/inventory/${inventoryId}/sell`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to sell item");

      setInventory(prev => prev.filter(i => i.id !== inventoryId));
      document.dispatchEvent(new CustomEvent("balanceChanged", { detail: data.newBalance }));

      // Update localStorage
      localStorage.setItem('userBalance', data.newBalance.toString());

      setNotification({ message: "Item sold successfully!", type: "success" });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to sell item";
      setErrorDialog({
        message: errorMessage,
        onRetry: () => {
          setErrorDialog(null);
          // Retry the operation
          setTimeout(() => handleSell(inventoryId), 1000);
        }
      });
    } finally {
      setSellingId(null);
      setLoading(false);
    }
  };

  const handleSellAll = async () => {
    setIsSellingAll(true);
    try {
      setLoading(true);
      const res = await fetch("/api/inventory/sell-all", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to sell all items");

      setInventory([]);
      document.dispatchEvent(new CustomEvent("balanceChanged", { detail: data.newBalance }));

      // Update localStorage
      localStorage.setItem('userBalance', data.newBalance.toString());

      setNotification({ message: "All items sold successfully!", type: "success" });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to sell all items";
      setErrorDialog({
        message: errorMessage,
        onRetry: () => {
          setErrorDialog(null);
          // Retry the operation
          setTimeout(() => handleSellAll(), 1000);
        }
      });
    } finally {
      setIsSellingAll(false);
      setLoading(false);
    }
  };

  const handleRefund = async (inventoryId: string) => {
    // Placeholder for refund/buyback functionality
    alert("Refund feature coming soon!");
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
      {/* Mobile Header */}
      <div className="lg:hidden bg-black/50 backdrop-blur-sm border-b border-gray-800/50 px-4 py-4">
        <div className="flex justify-between items-center">
          <h1 className="text-xl font-bold text-white">Inventory</h1>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => {
                // Toggle filters/mobile menu
                alert("Filter options coming soon!");
              }}
              className="p-2 rounded-lg hover:bg-gray-700/50"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 hover:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3 3-3" />
              </svg>
            </button>
            <button
              onClick={() => {
                // Refresh
                setLoading(true);
                setTimeout(() => {
                  loadInventory();
                  setLoading(false);
                }, 1000);
              }}
              className="p-2 rounded-lg hover:bg-gray-700/50"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 hover:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 014.582 9h.582M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <div className="min-h-screen flex flex-col">
        {/* Desktop Header */}
        <div className="hidden lg:block">
          <header className="bg-black/50 backdrop-blur-sm border-b border-gray-800/50 px-6 py-4">
            <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold text-white">Your Inventory</h1>
                <p className="text-gray-300">Manage your collected items</p>
              </div>

              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl text-amber-400">💰</span>
                  <div>
                    <p className="text-sm font-medium text-gray-400">Balance</p>
                    <p className="text-2xl font-bold text-amber-300" id="inventory-balance">
                      {localStorage.getItem('userBalance') || '0'}
                    </p>
                    <span className="text-xs text-amber-500">coins</span>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => {
                      // View stats
                      alert("Inventory stats coming soon!");
                    }}
                    className="p-2 rounded-lg hover:bg-gray-700/50"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 hover:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19l-6-6 6-6" />
                    </svg>
                  </button>
                  <button
                    onClick={() => {
                      // Refresh
                      setLoading(true);
                      setTimeout(() => {
                        loadInventory();
                        setLoading(false);
                      }, 1000);
                    }}
                    className="p-2 rounded-lg hover:bg-gray-700/50"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 hover:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 014.582 9h.582M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </header>

          {/* Controls */}
          <div className="px-6 py-6">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
              <div className="flex items-center space-x-3">
                <span className="text-sm font-medium text-gray-400">Showing</span>
                <span className="text-lg font-bold text-amber-400">{sortedInventory.length}</span>
                <span className="text-sm font-medium text-gray-400">of</span>
                <span className="text-lg font-bold text-amber-400">{inventory.length}</span>
                <span className="text-sm font-medium text-gray-400">items</span>
              </div>

              <div className="flex items-center space-x-4">
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -mt-1.5 block h-4 w-4 text-gray-400">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M10.5 10.5h3m-3 3v3" />
                    </svg>
                  </span>
                  <input
                    type="text"
                    placeholder="Search items..."
                    className="pl-10 pr-4 py-2 bg-gray-900/50 border border-gray-800 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-amber-400"
                  />
                </div>

                <div className="flex space-x-3">
                  <button
                    onClick={() => setFilter("all")}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ${filter === "all" ? "bg-amber-600/30 text-amber-300" : "text-gray-400 hover:text-gray-200"}`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => setFilter("common")}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ${filter === "common" ? "bg-amber-600/30 text-amber-300" : "text-gray-400 hover:text-gray-200"}`}
                  >
                    Common
                  </button>
                  <button
                    onClick={() => setFilter("rare")}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ${filter === "rare" ? "bg-amber-600/30 text-amber-300" : "text-gray-400 hover:text-gray-200"}`}
                  >
                    Rare
                  </button>
                  <button
                    onClick={() => setFilter("legendary")}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ${filter === "legendary" ? "bg-amber-600/30 text-amber-300" : "text-gray-400 hover:text-gray-200"}`}
                  >
                    Legendary
                  </button>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4 mb-4">
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-400">Sort by:</span>
                <select
                  onChange={(e) => setSortBy(e.target.value as "value" | "name" | "date")}
                  className="px-3 py-2 bg-gray-900/50 border border-gray-800 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-amber-400"
                >
                  <option value="value">Value</option>
                  <option value="name">Name</option>
                  <option value="date">Date</option>
                </select>
              </div>

              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-400">Order:</span>
                <button
                  onClick={() => setSortOrder(prev => (prev === "asc" ? "desc" : "asc"))}
                  className={`px-3 py-2 rounded-md text-sm font-medium ${sortOrder === "asc" ? "bg-amber-600/30 text-amber-300" : "bg-gray-800/30 text-gray-300"} hover:bg-gray-700/50`}
                >
                  {sortOrder === "asc" ? "↑" : "↓"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-6">
          {inventory.length === 0 ? (
            <div className="min-h-[calc(100vh-160px)] flex flex-col items-center justify-center px-4">
              <div className="text-center space-y-6">
                <div className="relative h-24 w-24 mx-auto">
                  <div className="absolute inset-0 rounded-3xl bg-gradient-to-b from-amber-500/20 to-transparent"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-5xl text-amber-400/50">📦</span>
                  </div>
                </div>
                <h2 className="text-2xl font-bold text-white">Your inventory is empty</h2>
                <p className="text-lg text-gray-400 max-w-2xl text-center">
                  Start your collection by opening some amazing packs! Each pack contains mysterious items ranging from common to legendary rarity.
                </p>
                <div className="mt-8">
                  <button
                    onClick={() => {
                      window.location.href = '/shop';
                    }}
                    className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-600 text-white font-semibold py-3 px-6 rounded-lg hover:shadow-lg transition-transform hover:scale-[1.02] flex items-center justify-center space-x-2"
                  >
                    <span>Browse Packs</span>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l6 6-6 6" />
                    </svg>
                  </button>
                </div>
              </div>
            )
          : (
            <div className="space-y-6">
              {/* Stats Summary */}
              <div className="grid gap-6 md:grid-cols-3">
                <div className="bg-gray-900/50 rounded-xl p-6 border border-gray-800">
                  <div className="flex items-center justify-center mb-3">
                    <div className="h-10 w-10 bg-amber-900/20 rounded-xl flex items-center justify-center">
                      <span className="text-2xl text-amber-400">📊</span>
                    </div>
                  </div>
                  <h3 className="font-semibold text-amber-300 mb-2">Total Value</h3>
                  <p className="text-2xl font-bold text-white" id="total-inventory-value">
                    {inventory.reduce((sum, item) => sum + (item.item?.value || 0), 0).toLocaleString()}
                  </p>
                  <p className="text-sm text-amber-500">coins</p>
                </div>

                <div className="bg-gray-900/50 rounded-xl p-6 border border-gray-800">
                  <div className="flex items-center justify-center mb-3">
                    <div className="h-10 w-10 bg-emerald-900/20 rounded-xl flex items-center justify-center">
                      <span className="text-2xl text-emerald-400">💎</span>
                    </div>
                  </div>
                  <h3 className="font-semibold text-emerald-300 mb-2">Rarest Item</h3>
                  <p className="text-xl font-bold text-white" id="rarest-item-name">
                    {inventory
                      .filter(item => item.item?.rarity === "legendary")
                      .map(item => item.item?.name)
                      .join(", ") || "None"}
                  </p>
                  <p className="text-sm text-emerald-500">Legendary</p>
                </div>

                <div className="bg-gray-900/50 rounded-xl p-6 border border-gray-800">
                  <div className="flex items-center justify-center mb-3">
                    <div className="h-10 w-10 bg-rose-900/20 rounded-xl flex items-center justify-center">
                      <span className="text-2xl text-rose-400">🔥</span>
                    </div>
                  </div>
                  <h3 className="font-semibold text-rose-300 mb-2">Most Valuable</h3>
                  <p className="text-xl font-bold text-white" id="most-valuable-item">
                    {inventory
                      .reduce((prev, current) =>
                        (prev.item?.value || 0) > (current.item?.value || 0) ? prev : current
                      )?.item?.name || "None"}
                  </p>
                  <p className="text-sm text-rose-500">{inventory
                    .reduce((max, item) => Math.max(max, item.item?.value || 0), 0)
                    .toLocaleString()} coins</p>
                </div>
              </div>

              {/* Inventory Grid */}
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {sortedInventory.map((item, index) => (
                  <div key={index} className="group relative bg-gray-900/50 border border-gray-800 rounded-xl p-6 hover:border-amber-300/50 transition-all hover:shadow-lg">
                    {/* Rarity Badge */}
                    <div className="absolute top-3 right-3">
                      <span className="text-xs font-bold text-white px-2 py-0.5 rounded"
                            className={getRarityBadgeClass(item.item?.rarity || '')}>
                        {getRarityDisplayText(item.item?.rarity || '')}
                      </span>
                    </div>

                    {/* Item Image Placeholder */}
                    <div className="aspect-square mb-4 bg-gray-800/50 rounded-xl flex items-center justify-center">
                      <div className="text-3xl text-gray-400">
                        {getItemIcon(item.item?.rarity || '')}
                      </div>
                    </div>

                    {/* Item Info */}
                    <div className="space-y-2 text-center">
                      <h3 className="font-semibold text-white truncate">
                        {item.item?.name || 'Unknown Item'}
                      </h3>
                      <div className="flex items-center justify-center space-x-2 text-sm">
                        <span className="text-amber-400 font-medium">
                          {item.item?.value?.toLocaleString() || '0'}
                        </span>
                        <span className="text-xs text-amber-500">coins</span>
                      </div>
                      <p className="text-xs text-gray-500">
                        {getRarityDisplayText(item.item?.rarity || '')} •
                        {new Date(item.createdAt).toLocaleDateString()}
                      </p>
                    </div>

                    {/* Action Buttons */}
                    <div className="mt-4 space-y-2">
                      <button
                        onClick={() => handleSell(item.id)}
                        disabled={sellingId === item.id}
                        className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-600 text-white font-semibold py-2 px-4 rounded-md hover:shadow-md transition-transform hover:scale-[1.02]"
                      >
                        {sellingId === item.id ? "Selling..." : "Sell"}
                      </button>

                      <button
                        onClick={() => handleRefund(item.id)}
                        className="w-full border border-gray-700 hover:border-amber-300 hover:bg-gray-800 text-gray-200 font-medium py-2 px-4 rounded-md hover:shadow-md transition-all"
                      >
                        Return
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Mobile Footer Actions */}
      <div className="lg:hidden bg-black/50 backdrop-blur-sm border-t border-gray-800/50 px-4 py-4">
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => {
                if (inventory.length > 0) {
                  if (window.confirm('Sell all items?')) {
                    handleSellAll();
                  }
                } else {
                  alert("Your inventory is empty!");
                }
              }}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-3 rounded-md hover:shadow-md transition-all"
            >
              Sell All
            </button>
            <button
              onClick={() => {
                window.location.href = '/shop';
              }}
              className="w-full bg-amber-600 hover:bg-amber-700 text-white font-semibold py-2 px-3 rounded-md hover:shadow-md transition-all"
            >
              Open Packs
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper functions
function getRarityBadgeClass(rarity: string): string {
  switch (rarity.toLowerCase()) {
    case 'common': return 'bg-gray-900/50 text-gray-400';
    case 'rare': return 'bg-amber-900/50 text-amber-400';
    case 'legendary': return 'bg-emerald-900/50 text-emerald-400';
    default: return 'bg-gray-900/50 text-gray-400';
  }
}

function getRarityDisplayText(rarity: string): string {
  switch (rarity.toLowerCase()) {
    case 'common': return 'Common';
    case 'rare': return 'Rare';
    case 'legendary': return 'Legendary';
    default: return rarity;
  }
}

function getItemIcon(rarity: string): string {
  switch (rarity.toLowerCase()) {
    case 'legendary': return '👑';
    case 'rare': return '💎';
    case 'common': return '📦';
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