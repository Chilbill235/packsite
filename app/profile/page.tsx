"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

// --- Types ---
type Rarity = "common" | "rare" | "epic" | "legendary";
type Item = { id: string; name: string; value: number; rarity: Rarity; };
type InventoryItem = { id: string; item: Item; };
type Opening = { id: string; item: Item; createdAt: string; };

export default function ProfilePage() {
  const [loading, setLoading] = useState(true);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [openings, setOpenings] = useState<Opening[]>([]);
  const [tabs, setTabs] = useState<"overview" | "inventory" | "activity">("overview");

  // Functional States
  const [sortBy, setSortBy] = useState<"value-desc" | "value-asc" | "name">("value-desc");
  const [filterRarity, setFilterRarity] = useState<"all" | Rarity>("all");
  const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean; action: () => void; title: string; desc: string } | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [invRes, openRes] = await Promise.all([
        fetch("/api/inventory"),
        fetch("/api/openings")
      ]);
      const invData = await invRes.json();
      const openData = await openRes.json();
      
      setInventory(invData.inventory || []);
      setOpenings(openData.openings || []);
    } catch (e) { 
      console.error(e); 
    } finally { 
      setLoading(false); 
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const processedInventory = useMemo(() => {
    let result = [...inventory];
    if (filterRarity !== "all") result = result.filter((i) => i.item.rarity === filterRarity);
    return result.sort((a, b) => {
      if (sortBy === "value-desc") return b.item.value - a.item.value;
      if (sortBy === "value-asc") return a.item.value - b.item.value;
      return a.item.name.localeCompare(b.item.name);
    });
  }, [inventory, sortBy, filterRarity]);

  const handleSellAllConfirmed = async () => {
    setConfirmModal(null);
    try {
      const res = await fetch("/api/inventory/sell-all", { method: "POST" });
      if (res.ok) {
        // 1. Refresh local data immediately
        await loadData();
        
        // 2. Fetch latest profile to get current balance
        const userRes = await fetch("/api/user/profile");
        const userData = await userRes.json();
        
        // 3. Emit exact event name required by Navbar[cite: 1]
        window.dispatchEvent(new CustomEvent("balanceUpdated", { 
          detail: { balance: userData.balance } 
        }));
      }
    } catch (e) { console.error(e); }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white p-6 md:p-12">
      {/* Modal */}
      <AnimatePresence>
        {confirmModal?.isOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-[#111] border border-white/10 p-8 rounded-xl w-full max-w-sm">
              <h3 className="text-xl font-bold mb-2">{confirmModal.title}</h3>
              <p className="text-gray-400 mb-8">{confirmModal.desc}</p>
              <div className="flex gap-4">
                <button onClick={() => setConfirmModal(null)} className="flex-1 py-3 rounded-lg bg-white/5 hover:bg-white/10 transition">Cancel</button>
                <button onClick={confirmModal.action} className="flex-1 py-3 rounded-lg bg-red-600 hover:bg-red-500 transition font-bold">Confirm</button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-7xl mx-auto">
        <header className="mb-10">
          <h1 className="text-5xl font-black mb-2">VAULT</h1>
          <p className="text-gray-500">Your collection. Your legacy.</p>
        </header>

        <div className="flex gap-8 mb-10 border-b border-white/10 pb-4">
          {["overview", "inventory", "activity"].map((t) => (
            <button key={t} onClick={() => setTabs(t as any)} className={`capitalize font-bold text-sm tracking-widest transition ${tabs === t ? "text-white" : "text-gray-600 hover:text-white"}`}>
              {t.toUpperCase()}
            </button>
          ))}
        </div>

        {/* --- Overview --- */}
        {tabs === "overview" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-[#0c0c0c] border border-white/5 p-8 rounded-xl"><p className="text-xs text-gray-500 uppercase tracking-widest mb-2">Total Opened</p><h2 className="text-5xl font-black">{openings.length}</h2></div>
            <div className="bg-[#0c0c0c] border border-white/5 p-8 rounded-xl"><p className="text-xs text-gray-500 uppercase tracking-widest mb-2">Inventory Items</p><h2 className="text-5xl font-black">{inventory.length}</h2></div>
            <div className="bg-[#0c0c0c] border border-white/5 p-8 rounded-xl"><p className="text-xs text-gray-500 uppercase tracking-widest mb-2">Net Value</p><h2 className="text-5xl font-black">{inventory.reduce((acc, curr) => acc + curr.item.value, 0).toLocaleString()}</h2></div>
          </div>
        )}

        {/* --- Inventory --- */}
        {tabs === "inventory" && (
          <div className="space-y-6">
            <div className="flex items-center gap-4 bg-[#0c0c0c] p-4 rounded-xl border border-white/5">
              <select onChange={(e) => setFilterRarity(e.target.value as any)} className="bg-black p-3 rounded-lg text-sm border border-white/10 outline-none">
                <option value="all">All Rarities</option>
                <option value="legendary">Legendary</option>
                <option value="epic">Epic</option>
              </select>
              <select onChange={(e) => setSortBy(e.target.value as any)} className="bg-black p-3 rounded-lg text-sm border border-white/10 outline-none">
                <option value="value-desc">Highest Value</option>
              </select>
              <button onClick={() => setConfirmModal({ isOpen: true, title: "Sell All", desc: "Sell all visible items?", action: handleSellAllConfirmed })} className="ml-auto px-6 py-3 rounded-lg bg-red-900/20 text-red-500 text-sm font-bold hover:bg-red-900/40 transition">Sell All Visible</button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
              {processedInventory.map((item) => (
                <div key={item.id} className="bg-[#0c0c0c] border border-white/5 p-6 rounded-xl">
                  <div className="text-2xl mb-4">📦</div>
                  <h3 className="font-bold text-sm truncate">{item.item.name}</h3>
                  <p className="text-amber-500 text-xs font-bold">{item.item.value.toLocaleString()} COINS</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* --- Activity --- */}
        {tabs === "activity" && (
          <div className="space-y-4">
            {openings.length === 0 ? (
              <div className="text-center py-20 text-gray-500">No activity yet.</div>
            ) : (
              openings.map((op) => (
                <div key={op.id} className="bg-[#0c0c0c] border border-white/5 p-6 rounded-xl flex justify-between items-center">
                  <div>
                    <h3 className="font-bold">{op.item?.name || "Unknown Item"}</h3>
                    <p className="text-xs text-gray-500">{new Date(op.createdAt).toLocaleDateString()}</p>
                  </div>
                  <p className="text-green-500 font-bold">+{op.item?.value?.toLocaleString() || 0}</p>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}