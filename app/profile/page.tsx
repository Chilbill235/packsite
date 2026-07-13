"use client";

import { useEffect, useState } from "react";
import Notification from "@/components/Notification";
import ErrorDialog from "@/components/ErrorDialog";
import { Balance } from "@/components/Balance";

type ProfileUser = {
  name: string;
  email: string;
  balance: number;
  username?: string;
  id: string;
  createdAt?: string;
  lastAdWatched?: string | null;
};

export default function ProfilePage() {
  const [user, setUser] = useState<ProfileUser | null>(null);
  const [inventory, setInventory] = useState<any[]>([]);
  const [openings, setOpenings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notification, setNotification] = useState<{
    message: string;
    type?: "success" | "error";
  } | null>(null);
  const [errorDialog, setErrorDialog] = useState<{
    message: string;
    onRetry?: () => void;
  } | null>(null);
  const [tabs, setTabs] = useState<"overview" | "inventory" | "activity">("overview");

  // Load profile data on mount
  useEffect(() => {
    async function loadProfile() {
      try {
        setLoading(true);
        const res = await fetch("/api/user/profile");
        if (!res.ok) throw new Error("Failed to load profile");
        const data = await res.json();
        setUser(data);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Unexpected error");
      } finally {
        setLoading(false);
      }
    }

    async function loadInventory() {
      try {
        const res = await fetch("/api/inventory");
        if (!res.ok) throw new Error("Failed to load inventory");
        const data = await res.json();
        setInventory(data.inventory || []);
      } catch (err) {
        console.error("Failed to load inventory:", err);
      }
    }

    async function loadOpenings() {
      try {
        const res = await fetch("/api/openings"); // Assuming this endpoint exists
        if (!res.ok) throw new Error("Failed to load opening history");
        const data = await res.json();
        setOpenings(data.openings || []);
      } catch (err) {
        console.error("Failed to load opening history:", err);
      }
    }

    loadProfile();
    loadInventory();
    loadOpenings();
  }, []);

  // Handle balance updates from other components
  useEffect(() => {
    const handleBalanceChange = (event: Event) => {
      const newBalance = (event as CustomEvent<number>).detail;
      setUser(prev => prev ? {...prev, balance: newBalance} : null);
    };
    document.addEventListener("balanceChanged", handleBalanceChange);
    return () => document.removeEventListener("balanceChanged", handleBalanceChange);
  }, []);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white p-6">
        <div className="text-center bg-gray-800/50 backdrop-blur-sm rounded-xl p-8 max-w-md w-full">
          <div className="mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-red-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold mb-4">Something went wrong</h2>
          <p className="text-gray-300 mb-6">{error}</p>
          <button
            onClick={() => {
              setError(null);
              // Trigger reload
              window.location.reload();
            }}
            className="w-full bg-amber-600 hover:bg-amber-700 text-white font-semibold py-2 px-4 rounded-md transition-transform hover:scale-[1.02]"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-center space-y-4">
          <div className="h-8 w-8 border-4 border-amber-300 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-lg text-gray-300">Loading your profile...</p>
        </div>
      </div>
    );
  }

  const getStatusColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'common': return 'border-gray-400 bg-gray-900/20';
      case 'rare': return 'border-amber-400 bg-amber-900/20';
      case 'legendary': return 'border-emerald-400 bg-emerald-900/20';
      default: return 'border-gray-400 bg-gray-900/20';
    }
  };

  const getStatusText = (type: string) => {
    switch (type.toLowerCase()) {
      case 'common': return 'Common';
      case 'rare': return 'Rare';
      case 'legendary': return 'Legendary';
      default: return type;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 to-black">
      {/* Mobile Tab Navigation */}
      {!(() => {
        if (typeof window !== 'undefined') {
          return window.innerWidth < 768;
        }
        return false;
      })() && (
        <div className="bg-gray-900/50 backdrop-blur-sm px-4 pb-4">
          <div className="flex justify-center space-x-2">
            <button
              onClick={() => setTabs("overview")}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ${tabs === "overview" ? "bg-amber-600/30 text-amber-300" : "text-gray-400 hover:text-gray-200"}`}
            >
              Overview
            </button>
            <button
              onClick={() => setTabs("inventory")}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ${tabs === "inventory" ? "bg-amber-600/30 text-amber-300" : "text-gray-400 hover:text-gray-200"}`}
            >
              Inventory
            </button>
            <button
              onClick={() => setTabs("activity")}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ${tabs === "activity" ? "bg-amber-600/30 text-amber-300" : "text-gray-400 hover:text-gray-200"}`}
            >
              Activity
            </button>
          </div>
        </div>
      )}

      <div className="min-h-screen flex flex-col">
        {/* Header */}
        <header className="bg-black/50 backdrop-blur-sm border-b border-gray-800/50 px-6 py-4">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold text-white">Welcome back, {user?.name || 'Explorer'}!</h1>
              <p className="text-gray-300">Your collector's hub</p>
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <span className="text-2xl text-amber-400">💰</span>
                <div>
                  <p className="text-sm font-medium text-gray-400">Balance</p>
                  <p className="text-2xl font-bold text-amber-300" id="profile-balance">{user?.balance?.toLocaleString() || '0'}</p>
                  <span className="text-xs text-amber-500">coins</span>
                </div>
              </div>

              <button
                onClick={() => {
                  // Refresh data
                  setLoading(true);
                  // In a real app, we'd refetch here
                  setTimeout(() => setLoading(false), 1000);
                }}
                className="p-2 rounded-lg hover:bg-gray-700/50 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 hover:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 014.582 9h.582M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 flex-col">
          <div className="max-w-7xl mx-auto px-6 py-8">
            {/* Desktop Tab Navigation (hidden on mobile) */}
            {!(() => {
              if (typeof window !== 'undefined') {
                return window.innerWidth < 768;
              }
              return false;
            })() && (
              <div className="mb-8">
                <div className="flex space-x-2 px-4">
                  <button
                    onClick={() => setTabs("overview")}
                    className={`px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${tabs === "overview" ? "bg-amber-600/30 text-amber-300 border-b-2 border-amber-400" : "text-gray-400 hover:text-gray-200"}`}
                  >
                    Overview
                  </button>
                  <button
                    onClick={() => setTabs("inventory")}
                    className={`px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${tabs === "inventory" ? "bg-amber-600/30 text-amber-300 border-b-2 border-amber-400" : "text-gray-400 hover:text-gray-200"}`}
                  >
                    Inventory
                  </button>
                  <button
                    onClick={() => setTabs("activity")}
                    className={`px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${tabs === "activity" ? "bg-amber-600/30 text-amber-300 border-b-2 border-amber-400" : "text-gray-400 hover:text-gray-200"}`}
                  >
                    Activity
                  </button>
                </div>
              </div>
            )}

            {/* Tab Content */}
            {tabs === "overview" && (
              <div className="space-y-8">
                {/* Stats Cards */}
                <div className="grid gap-6 md:grid-cols-3">
                  <div className="bg-gray-900/50 rounded-xl p-6 border border-gray-800 hover:border-gray-700/50 transition-border">
                    <div className="flex items-center justify-center mb-4">
                      <div className="h-12 w-12 bg-amber-900/20 rounded-xl flex items-center justify-center">
                        <span className="text-2xl text-amber-400">📦</span>
                      </div>
                    </div>
                    <h3 className="font-semibold text-amber-300 mb-2">Total Packs Opened</h3>
                    <p className="text-3xl font-bold text-white" id="total-opened">
                      {openings.length}
                    </p>
                  </div>

                  <div className="bg-gray-900/50 rounded-xl p-6 border border-gray-800 hover:border-gray-700/50 transition-border">
                    <div className="flex items-center justify-center mb-4">
                      <div className="h-12 w-12 bg-emerald-900/20 rounded-xl flex items-center justify-center">
                        <span className="text-2xl text-emerald-400">💎</span>
                      </div>
                    </div>
                    <h3 className="font-semibold text-emerald-300 mb-2">Rarest Item Value</h3>
                    <p className="text-3xl font-bold text-white" id="rarest-value">
                      {inventory.reduce((max, item) => Math.max(max, item.item?.value || 0), 0).toLocaleString()} coins
                    </p>
                  </div>

                  <div className="bg-gray-900/50 rounded-xl p-6 border border-gray-800 hover:border-gray-700/50 transition-border">
                    <div className="flex items-center justify-center mb-4">
                      <div className="h-12 w-12 bg-rose-900/20 rounded-xl flex items-center justify-center">
                        <span className="text-2xl text-rose-400">🎯</span>
                      </div>
                    </div>
                    <h3 className="font-semibold text-rose-300 mb-2">Today's Earnings</h3>
                    <p className="text-3xl font-bold text-white" id="today-earnings">
                      0 coins
                    </p>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-white mb-4">Quick Actions</h2>
                  <div className="grid gap-4 md:grid-cols-2">
                    <button
                      onClick={() => {
                        window.location.href = '/shop';
                      }}
                      className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-600 text-white font-semibold py-4 px-6 rounded-xl hover:shadow-lg transition-transform hover:scale-[1.02]"
                    >
                      <div className="flex items-center justify-between">
                        <span>Open a Pack</span>
                        <span className="text-sm opacity-80">Discover new treasures</span>
                      </div>
                    </button>

                    <button
                      onClick={() => {
                        // In a real app, this would show ad and give coins
                        alert("Ad feature coming soon!");
                      }}
                      className="w-full border border-gray-700 hover:border-amber-300 hover:bg-gray-800 text-gray-200 font-semibold py-4 px-6 rounded-xl hover:shadow-md transition-all"
                    >
                      <div className="flex items-center justify-between">
                        <span>Watch Ad for Coins</span>
                        <span className="text-sm opacity-80">+500 coins</span>
                      </div>
                    </button>

                    <button
                      onClick={() => {
                        window.location.href = '/inventory';
                      }}
                      className="w-full bg-gradient-to-b from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold py-4 px-6 rounded-xl hover:shadow-lg transition-transform hover:scale-[1.02]"
                    >
                      <div className="flex items-center justify-between">
                        <span>Manage Inventory</span>
                        <span className="text-sm opacity-80">View & sell items</span>
                      </div>
                    </button>

                    <button
                      onClick={() => {
                        // Placeholder for settings
                        alert("Settings coming soon!");
                      }}
                      className="w-full border border-gray-700 hover:border-amber-300 hover:bg-gray-800 text-gray-200 font-semibold py-4 px-6 rounded-xl hover:shadow-md transition-all"
                    >
                      <div className="flex items-center justify-between">
                        <span>Settings</span>
                        <span className="text-sm opacity-80">Preferences & account</span>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Recent Activity Preview */}
                {openings.length > 0 && (
                  <div className="mt-8">
                    <h2 className="text-2xl font-bold text-white mb-4">Recent Activity</h2>
                    <div className="space-y-4">
                      {openings.slice(0, 3).map((opening, index) => (
                        <div key={index} className="flex items-center space-x-4 p-4 bg-gray-900/50 rounded-xl border border-gray-800">
                          <div className="h-10 w-10 bg-gray-800 rounded-lg flex items-center justify-center flex-shrink-0">
                            <span className="text-sm">{opening.item?.rarity?.charAt(0) || '?'}</span>
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-white">{opening.item?.name}</p>
                            <p className="text-sm text-gray-400">
                              {new Date(opening.createdAt).toLocaleDateString()} •
                              {opening.item?.value?.toLocaleString()} coins
                            </p>
                          </div>
                          <span className="text-amber-400 font-medium">
                            +{opening.item?.value?.toLocaleString()} coins
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {tabs === "inventory" && (
              <div>
                <h2 className="text-2xl font-bold text-white mb-6">Your Inventory ({inventory.length} items)</h2>

                {inventory.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="h-20 w-20 mx-auto mb-4">
                      <span className="text-4xl text-gray-500">📦</span>
                    </div>
                    <p className="text-xl text-gray-400 mb-4">Your inventory is empty</p>
                    <p className="text-lg text-gray-500">
                      Open some packs to start collecting items!
                    </p>
                    <div className="mt-8">
                      <button
                        onClick={() => {
                          window.location.href = '/shop';
                        }}
                        className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-600 text-white font-semibold py-3 px-6 rounded-lg hover:shadow-lg transition-transform hover:scale-[1.02]"
                      >
                        Browse Packs →
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Filter & Sort Controls */}
                    <div className="flex flex-wrap items-center gap-4 mb-6">
                      <div className="flex items-center space-x-3">
                        <span className="text-sm text-gray-400">Sort by:</span>
                        <select
                          className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-amber-400"
                        >
                          <option value="value-desc">Value: High to Low</option>
                          <option value="value-asc">Value: Low to High</option>
                          <option value="name">Name: A-Z</option>
                          <option value="rarity">Rarity</option>
                          <option value="date-newest">Newest First</option>
                          <option value="date-oldest">Oldest First</option>
                        </select>
                      </div>

                      <div className="flex items-center space-x-3">
                        <span className="text-sm text-gray-400">Filter by rarity:</span>
                        <div className="flex space-x-2">
                          <label className="flex items-center space-x-1">
                            <input
                              type="checkbox"
                              className="h-4 w-4 text-amber-600 focus:ring-amber-500 border-gray-600 rounded"
                            />
                            <span className="text-sm">Common</span>
                          </label>
                          <label className="flex items-center space-x-1">
                            <input
                              type="checkbox"
                              className="h-4 w-4 text-amber-600 focus:ring-amber-500 border-gray-600 rounded"
                            />
                            <span className="text-sm">Rare</span>
                          </label>
                          <label className="flex items-center space-x-1">
                            <input
                              type="checkbox"
                              className="h-4 w-4 text-amber-600 focus:ring-amber-500 border-gray-600 rounded"
                            />
                            <span className="text-sm">Legendary</span>
                          </label>
                        </div>
                      </div>
                    </div>

                    {/* Inventory Grid */}
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                      {inventory.map((item, index) => (
                        <div key={index} className="group relative bg-gray-900/50 border border-gray-800 rounded-xl p-6 hover:border-amber-300/50 transition-all hover:shadow-lg">
                          <div className="absolute top-2 right-2">
                            <span className="text-xs font-bold text-white px-2 py-0.5 rounded"
                                  className={getStatusText(item.item?.rarity || '')}>
                              {getStatusText(item.item?.rarity || '')}
                            </span>
                          </div>

                          <div className="flex items-center justify-center mb-4 h-16 w-16 bg-gray-800/50 rounded-xl flex-shrink-0">
                            {/* In a real app, this would be the item image */}
                            <div className="flex items-center justify-center text-3xl">
                              {item.item?.rarity === 'legendary' ? '👑' :
                               item.item?.rarity === 'rare' ? '💎' :
                               '📦'}
                            </div>
                          </div>

                          <div className="space-y-2 text-center">
                            <h3 className="font-semibold text-white truncate">
                              {item.item?.name || 'Unknown Item'}
                            </h3>
                            <p className="text-sm text-gray-400">
                              Value: {item.item?.value?.toLocaleString() || '0'} coins
                            </p>
                            <p className="text-xs text-gray-500">
                              Added: {new Date(item.createdAt).toLocaleDateString()}
                            </p>
                          </div>

                          <button
                            onClick={() => {
                              // In a real app, this would sell the item
                              alert(`Sold ${item.item?.name} for ${item.item?.value?.toLocaleString()} coins!`);
                            }}
                            className="w-full mt-4 bg-gray-800 hover:bg-amber-900 text-white py-2 px-4 rounded-md transition-all hover:scale-[1.02]"
                          >
                            Sell for {item.item?.value?.toLocaleString()} coins
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {tabs === "activity" && (
              <div>
                <h2 className="text-2xl font-bold text-white mb-6">Opening History</h2>

                {openings.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="h-20 w-20 mx-auto mb-4">
                      <span className="text-4xl text-gray-500">📜</span>
                    </div>
                    <p className="text-xl text-gray-400 mb-4">No opening history yet</p>
                    <p className="text-lg text-gray-500">
                      Open some packs to see your adventure unfold here!
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {openings.map((opening, index) => (
                      <div key={index} className="flex items-center space-x-4 p-4 bg-gray-900/50 rounded-xl border border-gray-800">
                        <div className="h-10 w-10 flex items-center justify-center flex-shrink-0">
                          <span className="text-sm font-bold"
                                  className={getStatusText(opening.item?.rarity || '')}>
                            {opening.item?.rarity?.charAt(0) || '?'}
                          </span>
                        </div>
                        <div className="flex-1 space-y-1">
                          <p className="font-medium text-white truncate">
                            {opening.item?.name || 'Unknown Item'}
                          </p>
                          <p className="text-sm text-gray-400">
                            {new Date(opening.createdAt).toLocaleString()}
                          </p>
                        </div>
                        <div className="text-right space-y-1">
                          <span className="text-amber-400 font-medium">
                            +{opening.item?.value?.toLocaleString()} coins
                          </span>
                          <span className="text-xs text-gray-500">
                            #{opening.id?.slice(-6) || '??????'}
                          </span>
                        </div>
                      }
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </main>

        {/* Footer */}
        <footer className="bg-black/50 backdrop-blur-sm border-t border-gray-800/50 px-6 py-4">
          <div className="max-w-7xl mx-auto text-center text-sm text-gray-500">
            <p>PackSite © {new Date().getFullYear()} - All rights reserved</p>
            <p className="mt-1">
              <a href="#" className="text-amber-400 hover:text-amber-300">Terms of Service</a> |
              <a href="#" className="text-amber-400 hover:text-amber-300">Privacy Policy</a>
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}
