"use client";

import { useState, useEffect, useMemo } from "react";
import Notification from "@/components/Notification";
import ErrorDialog from "@/components/ErrorDialog";
import type { InventoryWithItem } from "@/types";

export default function InventoryPage() {
  const [inventory, setInventory] = useState<InventoryWithItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState<{message:string, type?:"success"|"error"}|null>(null);
  const [errorDialog, setErrorDialog] = useState<{message:string, onRetry?: () => void}|null>(null);
  const [sellingId, setSellingId] = useState<string | null>(null);
  const [isSellingAll, setIsSellingAll] = useState(false);

  useEffect(() => {
    async function loadInventory() {
      try {
        const res = await fetch("/api/inventory");
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to load inventory");
        setInventory(data.inventory || []);
      } catch (err) {
        setErrorDialog({ message: "Failed to load inventory" });
      } finally {
        setLoading(false);
      }
    }
    loadInventory();
  }, []);

  const sortedInventory = useMemo(() => {
    return [...inventory].sort((a, b) => b.item.value - a.item.value);
  }, [inventory]);

  const handleSell = async (inventoryId: string) => {
    setSellingId(inventoryId);
    try {
      const res = await fetch(`/api/inventory/${inventoryId}/sell`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      setInventory(prev => prev.filter(i => i.id !== inventoryId));
      document.dispatchEvent(new CustomEvent("balanceChanged", { detail: data.newBalance }));
      setNotification({ message: "Item sold!", type: "success" });
    } catch (err) {
      setErrorDialog({ message: "Error selling item" });
    } finally {
      setSellingId(null);
    }
  };

  const handleSellAll = async () => {
    setIsSellingAll(true);
    try {
      const res = await fetch("/api/inventory/sell-all", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      setInventory([]);
      document.dispatchEvent(new CustomEvent("balanceChanged", { detail: data.newBalance }));
      setNotification({ message: "All items sold successfully!", type: "success" });
    } catch (err) {
      setErrorDialog({ message: "Failed to sell all items" });
    } finally {
      setIsSellingAll(false);
    }
  };

  return (
    <>
      {notification && <Notification message={notification.message} type={notification.type} onClose={() => setNotification(null)} />}
      {errorDialog && <ErrorDialog message={errorDialog.message} onClose={() => setErrorDialog(null)} onRetry={errorDialog.onRetry} />}
      
      <main className="max-w-7xl mx-auto px-6 py-12">
        {/* Ad Unit remains functional using AdSense loader from layout */}
        <div className="mb-10 w-full overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-900/30 p-2">
          <AdUnit />
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-4">
          <div>
            <h1 className="text-5xl font-black tracking-tight text-white">Your Inventory</h1>
            <p className="text-zinc-400 mt-2">{sortedInventory.length} items collected</p>
          </div>
          {sortedInventory.length > 0 && (
            <button 
              onClick={handleSellAll}
              disabled={isSellingAll}
              className="bg-zinc-800 hover:bg-red-900/30 border border-zinc-700 hover:border-red-500/50 text-white font-bold py-3 px-8 rounded-xl transition-all"
            >
              {isSellingAll ? "Processing..." : "Sell All Items"}
            </button>
          )}
        </div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 opacity-50 animate-pulse">
            {[...Array(5)].map((_, i) => <div key={i} className="h-64 bg-zinc-900 rounded-3xl" />)}
          </div>
        ) : sortedInventory.length === 0 ? (
          <div className="py-24 text-center bg-zinc-900/30 border border-dashed border-zinc-800 rounded-3xl">
            <p className="text-zinc-500 text-lg">Your inventory is empty. Go open some packs!</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {sortedInventory.map((record) => (
              <div key={record.id} className="group relative bg-zinc-900 border border-zinc-800 p-6 rounded-3xl flex flex-col items-center hover:border-amber-500/50 transition-all shadow-xl hover:shadow-amber-500/10">
                <div className="w-20 h-20 bg-zinc-800 rounded-2xl mb-6 flex items-center justify-center text-4xl group-hover:scale-110 transition-transform">
                  🎁
                </div>
                <p className="font-bold text-white text-lg text-center mb-1">{record.item.name}</p>
                <p className="text-amber-400 font-black text-xl mb-6">{record.item.value.toLocaleString()} <span className="text-sm font-medium text-amber-600">COINS</span></p>
                <button
                  onClick={() => handleSell(record.id)}
                  disabled={sellingId === record.id}
                  className="w-full bg-zinc-800 hover:bg-amber-500 text-white hover:text-black font-bold py-3 rounded-xl transition-all disabled:opacity-50"
                >
                  {sellingId === record.id ? "Selling..." : "Quick Sell"}
                </button>
              </div>
            ))}
          </div>
        )}
      </main>
    </>
  );
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