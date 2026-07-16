"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter, usePathname } from "next/navigation";

type Rarity = "common" | "rare" | "epic" | "legendary";

type Item = {
  id: string;
  name: string;
  value: number;
  rarity: Rarity;
};

type InventoryItem = {
  id: string;
  item: Item;
};

export default function ProfilePage() {
  const router = useRouter();
  const pathname = usePathname();

  // --- State ---
  const [user, setUser] = useState<any>(null);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [openings, setOpenings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tabs, setTabs] = useState<"overview" | "inventory" | "activity">("overview");
  
  // --- Inventory Controls ---
  const [sortBy, setSortBy] = useState<"value-desc" | "value-asc" | "name">("value-desc");
  const [filterRarity, setFilterRarity] = useState<"all" | Rarity>("all");
  const [isSellingAll, setIsSellingAll] = useState(false);

  // --- Data Fetching ---
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [userRes, invRes, openRes] = await Promise.all([
          fetch("/api/user/profile"),
          fetch("/api/inventory"),
          fetch("/api/openings")
        ]);

        if (userRes.status === 401) {
          router.push(`/login?callbackUrl=${encodeURIComponent(pathname)}`);
          return;
        }

        const invData = await invRes.json();
        const userData = await userRes.json();
        const openData = await openRes.json();

        setUser(userData);
        setInventory(invData.inventory || []); // Ensure array
        setOpenings(openData.openings || []);
      } catch (e) {
        setError("Failed to load profile data.");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [router, pathname]);

  // --- Logic ---
  const processedInventory = useMemo(() => {
    let result = [...inventory];
    if (filterRarity !== "all") {
      result = result.filter((i) => i.item.rarity === filterRarity);
    }
    return result.sort((a, b) => {
      if (sortBy === "value-desc") return b.item.value - a.item.value;
      if (sortBy === "value-asc") return a.item.value - b.item.value;
      return a.item.name.localeCompare(b.item.name);
    });
  }, [inventory, sortBy, filterRarity]);

  const handleSellAll = async () => {
    if (!confirm("Are you sure you want to sell ALL visible items?")) return;
    setIsSellingAll(true);
    try {
      const res = await fetch("/api/inventory/sell-all", { method: "POST" });
      if (res.ok) {
        setInventory([]); // Clear display
        alert("Inventory cleared!");
      }
    } catch (err) {
      alert("Failed to sell all.");
    } finally {
      setIsSellingAll(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-black">Loading...</div>;

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <header className="mb-8">
        <h1 className="text-3xl font-bold">Welcome back, {user?.name || 'Explorer'}!</h1>
      </header>

      {/* --- Tabs --- */}
      <div className="flex gap-4 mb-8 border-b border-gray-800 pb-2">
        {(["overview", "inventory", "activity"] as const).map((t) => (
          <button 
            key={t} 
            onClick={() => setTabs(t)} 
            className={`capitalize pb-2 px-2 ${tabs === t ? "text-amber-400 border-b-2 border-amber-400" : "text-gray-500"}`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* --- Overview Tab --- */}
      {tabs === "overview" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gray-900 p-6 rounded-xl border border-gray-800">
            <h3 className="text-gray-400">Total Packs Opened</h3>
            <p className="text-4xl font-bold">{openings.length}</p>
          </div>
          <div className="bg-gray-900 p-6 rounded-xl border border-gray-800">
            <h3 className="text-gray-400">Total Inventory Items</h3>
            <p className="text-4xl font-bold">{inventory.length}</p>
          </div>
        </div>
      )}

      {/* --- Inventory Tab --- */}
      {tabs === "inventory" && (
        <div className="space-y-6">
          <div className="flex flex-wrap gap-4 bg-gray-900 p-4 rounded-xl border border-gray-800">
            <select onChange={(e) => setFilterRarity(e.target.value as any)} className="bg-black p-2 rounded border border-gray-700">
              <option value="all">All Rarity</option>
              <option value="legendary">Legendary</option>
              <option value="epic">Epic</option>
              <option value="rare">Rare</option>
            </select>
            <select onChange={(e) => setSortBy(e.target.value as any)} className="bg-black p-2 rounded border border-gray-700">
              <option value="value-desc">Highest Value</option>
              <option value="value-asc">Lowest Value</option>
              <option value="name">Name</option>
            </select>
            <button onClick={handleSellAll} className="ml-auto bg-red-900/50 hover:bg-red-800 px-4 py-2 rounded font-bold">
              {isSellingAll ? "Selling..." : "Sell All Visible"}
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {processedInventory.map((item) => (
              <div key={item.id} className="bg-gray-900 p-4 rounded-xl border border-gray-800 hover:border-amber-500/50">
                <div className="text-3xl mb-2 text-center">📦</div>
                <h3 className="font-semibold text-sm truncate">{item.item.name}</h3>
                <p className="text-amber-400 text-xs font-mono">{item.item.value.toLocaleString()} COINS</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* --- Activity Tab --- */}
      {tabs === "activity" && (
        <div className="space-y-2">
          {openings.map((op, i) => (
            <div key={i} className="bg-gray-900 p-4 rounded-lg flex justify-between">
              <span>{op.item?.name}</span>
              <span className="text-emerald-400">+{op.item?.value}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}