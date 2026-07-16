"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation"; // <-- Imported for navigation
import Notification from "@/components/Notification";
import ErrorDialog from "@/components/ErrorDialog";

type ProfileUser = {
  name: string;
  email: string;
  balance: number;
  id: string;
};

export default function ProfilePage() {
  const router = useRouter();
  const pathname = usePathname(); // Captures '/profile'

  const [user, setUser] = useState<ProfileUser | null>(null);
  const [inventory, setInventory] = useState<any[]>([]);
  const [openings, setOpenings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ message: string; type?: "success" | "error" } | null>(null);
  const [errorDialog, setErrorDialog] = useState<{ message: string; onRetry?: () => void } | null>(null);
  const [sellingId, setSellingId] = useState<string | null>(null);
  const [tabs, setTabs] = useState<"overview" | "inventory" | "activity">("overview");

  const handleSell = useCallback(async (inventoryId: string) => {
    setSellingId(inventoryId);
    try {
      const res = await fetch(`/api/inventory/${inventoryId}/sell`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to sell item");

      setInventory((prev) => prev.filter((i) => i.id !== inventoryId));
      setUser((prev) => (prev ? { ...prev, balance: data.newBalance } : null));

      document.dispatchEvent(new CustomEvent("balanceChanged", { detail: data.newBalance, bubbles: true }));
      setNotification({ message: "Item sold successfully!", type: "success" });
    } catch (err) {
      setErrorDialog({
        message: err instanceof Error ? err.message : "Failed to sell item",
        onRetry: () => {
          setErrorDialog(null);
          handleSell(inventoryId);
        },
      });
    } finally {
      setSellingId(null);
    }
  }, []);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [userRes, invRes, openRes] = await Promise.all([
          fetch("/api/user/profile"),
          fetch("/api/inventory"),
          fetch("/api/openings")
        ]);
        
        // --- AUTHENTICATION SHIELD ---
        // If the server returns 401 Unauthorized, send the user to the login page.
        // We append the current pathname ('/profile') as a callbackUrl query.
        if (userRes.status === 401) {
          router.push(`/login?callbackUrl=${encodeURIComponent(pathname)}`);
          return;
        }

        if (!userRes.ok || !invRes.ok || !openRes.ok) {
          throw new Error("Failed to retrieve user profile data.");
        }

        const userData = await userRes.json();
        const invData = await invRes.json();
        const openData = await openRes.json();

        setUser(userData);
        setInventory(invData.inventory || []);
        setOpenings(openData.openings || []);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Unexpected error");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [router, pathname]);

  if (error) return <div className="min-h-screen flex items-center justify-center bg-black text-white p-6"><div className="text-center bg-gray-800/50 p-8 max-w-md w-full"><h2 className="text-xl font-bold mb-4">Error</h2><p>{error}</p><button onClick={() => window.location.reload()} className="mt-6 w-full bg-amber-600 py-2 rounded">Try Again</button></div></div>;
  if (loading) return <div className="min-h-screen flex items-center justify-center bg-black"><div className="animate-spin h-8 w-8 border-4 border-amber-300 border-t-transparent rounded-full"></div></div>;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 to-black text-white">
      <header className="bg-black/50 backdrop-blur-sm border-b border-gray-800/50 px-6 py-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between">
          <div className="space-y-2"><h1 className="text-3xl font-bold">Welcome back, {user?.name || 'Explorer'}!</h1></div>
          <div className="flex items-center space-x-4"></div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex space-x-2 mb-8">
          {(["overview", "inventory", "activity"] as const).map((t) => (
            <button key={t} onClick={() => setTabs(t)} className={`px-4 py-2 rounded-lg capitalize ${tabs === t ? "bg-amber-600/30 text-amber-300 border-b-2 border-amber-400" : "text-gray-400"}`}>{t}</button>
          ))}
        </div>

        {/* Overview Tab */}
        {tabs === "overview" && (
          <div className="grid gap-6 md:grid-cols-3">
            <div className="bg-gray-900/50 rounded-xl p-6 border border-gray-800">
              <h3 className="text-amber-300">Total Packs Opened</h3>
              <p className="text-3xl font-bold">{openings.length}</p>
            </div>
            <div className="bg-gray-900/50 rounded-xl p-6 border border-gray-800">
              <h3 className="text-emerald-300">Total Inventory Items</h3>
              <p className="text-3xl font-bold">{inventory.length}</p>
            </div>
          </div>
        )}

        {/* Inventory Tab */}
        {tabs === "inventory" && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {inventory.length > 0 ? (
              inventory.map((item) => (
                <div key={item.id} className="bg-gray-900/50 p-4 rounded-xl border border-gray-800">
                  <div className="h-16 w-16 bg-gray-800/50 rounded-xl mb-4 flex items-center justify-center text-3xl">
                    {item.item?.rarity === 'legendary' ? '👑' : item.item?.rarity === 'rare' ? '💎' : '📦'}
                  </div>
                  <h3 className="font-semibold truncate">{item.item?.name || 'Unknown'}</h3>
                  <button disabled={sellingId === item.id} onClick={() => handleSell(item.id)} className="w-full mt-4 bg-gray-800 hover:bg-amber-900 py-2 rounded">
                    {sellingId === item.id ? "Selling..." : "Sell"}
                  </button>
                </div>
              ))
            ) : (
              <p className="text-gray-500">No items in inventory.</p>
            )}
          </div>
        )}

        {/* Activity Tab */}
        {tabs === "activity" && (
          <div className="space-y-4">
            {openings.map((opening, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-gray-900/50 rounded-xl border border-gray-800">
                <p>{opening.item?.name}</p>
                <span className="text-amber-400">+{opening.item?.value?.toLocaleString()} coins</span>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}