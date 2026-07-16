"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ErrorDialog from "@/components/ErrorDialog";
import { RewardedAdService } from '@/lib/adService';
import type { PackWithItems } from "@/types";

export default function ShopPage() {
  const [packs, setPacks] = useState<PackWithItems[]>([]);
  const [user, setUser] = useState<{ id?: string; balance: number; email?: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [isWaiting, setIsWaiting] = useState(false);
  const [countdown, setCountdown] = useState(10);
  const [showAdModal, setShowAdModal] = useState(false);
  
  // High-fidelity Reward Modal states
  const [wonItem, setWonItem] = useState<{ name: string; rarity?: string; value?: number } | null>(null);
  
  const [errorDialog, setErrorDialog] = useState<{ message: string } | null>(null);
  const [hasDispatchedPush, setHasDispatchedPush] = useState(false);

  // --- Campaign States ---
  const [isFlashSaleActive, setIsFlashSaleActive] = useState(false);
  const [bonusClaimed, setBonusClaimed] = useState(false);

  // --- Developer Test Center States ---
  const [showDevPanel, setShowDevPanel] = useState(false);
  const [testLog, setTestLog] = useState<string[]>([]);
  const [isTestingPush, setIsTestingPush] = useState(false);

  // --- Notification State ---
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">("default");

  const targetTimeRef = useRef<number | null>(null);
  const adService = useRef<RewardedAdService | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      if (!("Notification" in window)) {
        setPermission("unsupported");
      } else {
        setPermission(Notification.permission);
      }
    }
  }, []);

  const addLog = (msg: string) => {
    setTestLog(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev.slice(0, 4)]);
  };

  const urlBase64ToUint8Array = (base64String: string) => {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  };

  const handleEnableNotifications = async () => {
    if (!("Notification" in window)) return;
    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      if (result === "granted") {
        if ("serviceWorker" in navigator) {
          const registration = await navigator.serviceWorker.ready;
          const publicKey = "BEtKdyDMRqNtEXn-VObKK2cdNlmnSSk3oz1_KXET_MDVUBPDGrofEvpAYaNBQpGp3-MS45qj_KV9nBbzxzftDtU";
          const convertedKey = urlBase64ToUint8Array(publicKey);

          const subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: convertedKey
          });

          const response = await fetch("/api/user/subscribe", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ subscription })
          });

          if (response.ok) {
            addLog("Notification subscription synchronized to DB.");
          } else {
            addLog("Sync failed: " + response.statusText);
          }
        }
      }
    } catch (err: any) {
      addLog("Permission Error: " + err.message);
    }
  };

  // --- Dev Tools: Test Route Triggers ---
  const triggerInstantNotification = async () => {
    if (permission !== "granted") {
      alert("Please request and allow notification permissions first!");
      return;
    }
    setIsTestingPush(true);
    addLog("Triggering immediate notification drop request...");
    try {
      const response = await fetch("/api/user/trigger-test-push", {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });
      const data = await response.json();
      if (response.ok) {
        addLog("Test Push Sent! Check your device notifications.");
      } else {
        addLog(`Push Failed: ${data.error || 'Server Error'}`);
      }
    } catch (error: any) {
      addLog(`Network Error: ${error.message}`);
    } finally {
      setIsTestingPush(false);
    }
  };

  const triggerPeriodicSyncSimulation = async () => {
    if ("serviceWorker" in navigator) {
      try {
        const registration = await navigator.serviceWorker.ready;
        if (registration.active) {
          registration.active.postMessage({
            type: "FORCE_DEV_LOOP_TRIGGER"
          });
          addLog("Loop triggered! Check your notifications.");
        } else {
          addLog("No active Service Worker available.");
        }
      } catch (err: any) {
        addLog("SW loop dispatch failed: " + err.message);
      }
    } else {
      addLog("Service workers are unsupported in this client environment.");
    }
  };

  async function loadShopData() {
    try {
      const [userRes, packRes] = await Promise.all([fetch("/api/user/profile"), fetch("/api/packs")]);
      if (userRes.ok) {
        const userData = await userRes.json();
        setUser(userData);
        document.dispatchEvent(new CustomEvent("balanceChanged", { detail: userData.balance, bubbles: true }));
      }
      if (packRes.ok) setPacks(await packRes.json());
    } catch (err) { console.error(err); } 
    finally { setLoading(false); }
  }

  const handleClaimReward = useCallback(async () => {
    setIsWaiting(false);
    targetTimeRef.current = null;
    try {
      const res = await fetch("/api/user/add-coins", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setUser(prev => prev ? { ...prev, balance: data.newBalance } : null);
        document.dispatchEvent(new CustomEvent("balanceChanged", { detail: data.newBalance, bubbles: true }));
        setShowAdModal(false);
        setHasDispatchedPush(false);
        if (typeof window !== "undefined") {
          window.history.replaceState({}, document.title, window.location.pathname);
        }
        addLog("Coins successfully credited! 🎉");
      }
    } catch (err) { setErrorDialog({ message: "Error claiming reward." }); }
  }, []);

  // Handler for granting the daily bonus coins directly
  const handleClaimDailyBonus = async () => {
    try {
      // Reusing the coin adding route or similar backend logic to grant free bonus coins
      const res = await fetch("/api/user/add-coins", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setUser(prev => prev ? { ...prev, balance: data.newBalance } : null);
        document.dispatchEvent(new CustomEvent("balanceChanged", { detail: data.newBalance, bubbles: true }));
        setBonusClaimed(true);
        addLog("Daily Bonus 150 Coins claimed directly! 💎");
        
        // Clean up URL parameter cleanly
        if (typeof window !== "undefined") {
          window.history.replaceState({}, document.title, window.location.pathname);
        }
      }
    } catch (err) {
      addLog("Failed to claim Daily Bonus automatically.");
    }
  };

  const handleWatchAdClick = async () => {
    targetTimeRef.current = Date.now() + 10000;
    setCountdown(10);
    setIsWaiting(true);
    setHasDispatchedPush(false);
    addLog("Ad play started. Initializing background timer registration...");

    adService.current?.showAd(user?.email || "anon");

    if ("serviceWorker" in navigator) {
      const registration = await navigator.serviceWorker.ready;
      if (registration.active) {
        registration.active.postMessage({
          type: "START_BACKGROUND_TIMER",
          delay: 10000,
          url: window.location.origin + "/shop?ref=reward-claim"
        });
        addLog("Background tracking registered.");
      }
    }
  };

  const handleTimerComplete = useCallback(() => {
    setIsWaiting(false);
    targetTimeRef.current = null;
    setHasDispatchedPush(true);
    addLog("Timer complete! Push dispatched. Check system notifications.");
  }, []);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    const handleServiceWorkerMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === "BACKGROUND_TIMER_COMPLETE") {
        handleTimerComplete();
      }
    };
    navigator.serviceWorker.addEventListener("message", handleServiceWorkerMessage);
    return () => {
      navigator.serviceWorker.removeEventListener("message", handleServiceWorkerMessage);
    };
  }, [handleTimerComplete]);

  // Handle Campaign Query Parameter routing
  useEffect(() => {
    if (typeof window !== "undefined" && !loading) {
      const params = new URLSearchParams(window.location.search);
      const ref = params.get("ref");

      if (ref === "reward-claim") {
        setShowAdModal(true);
        const claimTimeout = setTimeout(() => {
          handleClaimReward();
        }, 1200);
        return () => clearTimeout(claimTimeout);
      } 
      
      // Campaign A: 50% discount active
      else if (ref === "notif_flash") {
        setIsFlashSaleActive(true);
        addLog("Flash Deal URL parameters loaded! Enjoy 50% off all packs! ⏳");
      } 
      
      // Campaign B: Direct Daily Bonus drop claim
      else if (ref === "notif_bonus" && !bonusClaimed) {
        handleClaimDailyBonus();
      } 
      
      else if (params.get("open-ad") === "true") {
        setShowAdModal(true);
      }
    }
  }, [loading, handleClaimReward]);

  useEffect(() => {
    loadShopData();
    adService.current = new RewardedAdService();
    
    const openModal = () => {
      setHasDispatchedPush(false);
      setShowAdModal(true);
    };
    window.addEventListener("openBalanceModal", openModal);

    const intervalId = setInterval(() => {
      if (isWaiting && targetTimeRef.current) {
        const remaining = Math.max(0, Math.ceil((targetTimeRef.current - Date.now()) / 1000));
        setCountdown(remaining);
        if (remaining <= 0) {
          handleTimerComplete();
        }
      }
    }, 250);

    return () => {
      window.removeEventListener("openBalanceModal", openModal);
      clearInterval(intervalId);
    };
  }, [isWaiting, handleTimerComplete]);

  const getRarityStyles = (rarity?: string) => {
    const r = rarity?.toLowerCase() || "common";
    if (r.includes("legend")) return { border: "border-yellow-500/50", text: "text-yellow-400", glow: "from-yellow-500/20", shadow: "shadow-yellow-500/10" };
    if (r.includes("epic")) return { border: "border-purple-500/50", text: "text-purple-400", glow: "from-purple-500/20", shadow: "shadow-purple-500/10" };
    if (r.includes("rare")) return { border: "border-blue-500/50", text: "text-blue-400", glow: "from-blue-500/20", shadow: "shadow-blue-500/10" };
    return { border: "border-amber-600/50", text: "text-amber-500", glow: "from-amber-600/20", shadow: "shadow-amber-500/10" };
  };

  const currentTheme = getRarityStyles(wonItem?.rarity);

  if (loading) return <div className="min-h-screen bg-black" />;

  return (
    <div className="min-h-screen bg-[#070707] text-white p-6 md:p-12 font-sans relative pb-32">
      
      {/* --- Ad Reward Modal --- */}
      <AnimatePresence>
        {showAdModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
            <motion.div initial={{ scale: 0.9, y: 15 }} animate={{ scale: 1, y: 0 }} className="bg-[#111] border border-white/10 p-8 rounded-3xl w-full max-w-sm text-center relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-b from-amber-500/5 to-transparent pointer-events-none" />
              {!hasDispatchedPush ? (
                <>
                  <h3 className="text-xl font-bold mb-6">Boost Your Balance</h3>
                  <button onClick={handleWatchAdClick} disabled={isWaiting} className={`w-full py-4 rounded-xl font-black transition-all ${isWaiting ? 'bg-white/5 text-gray-500' : 'bg-amber-500 text-black hover:bg-amber-400'}`}>
                    {isWaiting ? `WATCHING (${countdown}s)` : "WATCH AD FOR 500 COINS"}
                  </button>
                  <button onClick={() => {
                    setShowAdModal(false);
                    if (typeof window !== "undefined") {
                      window.history.replaceState({}, document.title, window.location.pathname);
                    }
                  }} className="mt-4 text-sm text-gray-500 hover:text-white transition-colors">Cancel</button>
                </>
              ) : (
                <>
                  <div className="text-5xl mb-4 animate-bounce">🔔</div>
                  <h3 className="text-xl font-bold mb-2">Notification Sent!</h3>
                  <p className="text-sm text-gray-400 mb-6">Tap the system push notification that just appeared on your device to claim your 500 coins!</p>
                  <button onClick={() => {
                    setShowAdModal(false);
                    if (typeof window !== "undefined") {
                      window.history.replaceState({}, document.title, window.location.pathname);
                    }
                  }} className="w-full py-3 bg-white/10 hover:bg-white/20 rounded-xl text-sm font-bold transition-all">Close Window</button>
                </>
              )}
            </motion.div>
          </motion.div>
        )}

        {/* --- PREMIUM GAME REVEAL MODAL --- */}
        {wonItem && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-xl"
            onClick={() => setWonItem(null)}
          >
            <div className="absolute inset-0 flex items-center justify-center overflow-hidden pointer-events-none">
              <div className="absolute w-[800px] h-[800px] bg-[radial-gradient(circle,rgba(245,158,11,0.15)_0%,transparent_60%)] animate-pulse" />
              <motion.div 
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 25, ease: "linear" }}
                className="absolute w-[1000px] h-[1000px] opacity-15"
                style={{
                  backgroundImage: `repeating-conic-gradient(from 0deg, #fff 0deg, #fff 10deg, transparent 10deg, transparent 25deg)`
                }}
              />
            </div>

            <div className="absolute pointer-events-none w-full h-full flex items-center justify-center">
              {[...Array(12)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ scale: 0, x: 0, y: 0, opacity: 1 }}
                  animate={{ 
                    scale: [0.5, 1, 0], 
                    x: Math.cos((i * 30 * Math.PI) / 180) * 160, 
                    y: Math.sin((i * 30 * Math.PI) / 180) * 160,
                    opacity: [1, 1, 0]
                  }}
                  transition={{ duration: 1.2, ease: "easeOut", repeat: Infinity, repeatDelay: 1 }}
                  className="absolute w-2 h-2 rounded-full bg-amber-400"
                />
              ))}
            </div>

            <motion.div 
              initial={{ scale: 0.3, y: 100, rotate: -25 }} 
              animate={{ scale: 1, y: 0, rotate: 0 }} 
              exit={{ scale: 0.3, y: 100, rotate: 25 }}
              transition={{ type: "spring", damping: 14, stiffness: 100 }}
              className={`relative bg-gradient-to-b ${currentTheme.glow} to-black/95 border ${currentTheme.border} p-12 rounded-[2.5rem] text-center w-full max-w-sm cursor-pointer shadow-2xl ${currentTheme.shadow}`}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="absolute top-4 left-4 w-4 h-4 border-t border-l border-white/20" />
              <div className="absolute top-4 right-4 w-4 h-4 border-t border-r border-white/20" />
              <div className="absolute bottom-4 left-4 w-4 h-4 border-b border-l border-white/20" />
              <div className="absolute bottom-4 right-4 w-4 h-4 border-b border-r border-white/20" />

              <motion.div 
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 3, ease: "easeInOut", repeat: Infinity }}
                className="text-8xl mb-8 filter drop-shadow-[0_15px_15px_rgba(245,158,11,0.3)] select-none"
              >
                ✨
              </motion.div>

              <p className="text-xs tracking-[0.3em] font-black uppercase text-white/40 mb-2">unlocked pack item</p>
              <h2 className="text-4xl font-extrabold mb-3 tracking-tight text-white uppercase">YOU WON!</h2>
              
              <div className="inline-block px-4 py-1.5 bg-white/5 rounded-full border border-white/10 mb-6">
                <span className={`text-xs font-black uppercase tracking-widest ${currentTheme.text}`}>
                  {wonItem.rarity || "COMMON"}
                </span>
              </div>

              <p className="text-2xl font-black text-white px-2 tracking-tight line-clamp-2 min-h-[4rem] flex items-center justify-center">
                {wonItem.name}
              </p>

              <div className="h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent my-6" />

              <button 
                onClick={() => setWonItem(null)} 
                className="w-full py-4 bg-white text-black hover:bg-gray-100 rounded-2xl font-black text-sm uppercase tracking-wider transition-all duration-300 shadow-lg"
              >
                Claim Item
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- Main Shop Content --- */}
      <div className="max-w-5xl mx-auto">
        
        {/* --- Campaign Banner: Flash Sale Active --- */}
        {isFlashSaleActive && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }} 
            animate={{ opacity: 1, scale: 1 }} 
            className="mb-8 p-6 bg-gradient-to-r from-red-500/20 to-amber-500/10 border border-amber-500/40 rounded-3xl flex justify-between items-center shadow-[0_0_20px_rgba(245,158,11,0.1)]"
          >
            <div>
              <h4 className="font-black text-amber-500 text-lg uppercase tracking-wider">⚡ FLASH SALE APPLIED!</h4>
              <p className="text-sm text-zinc-300">A special 50% discount from your push notification has been applied to all vault packs.</p>
            </div>
            <button 
              onClick={() => {
                setIsFlashSaleActive(false);
                addLog("Flash sale deactivated.");
              }}
              className="text-xs text-zinc-400 hover:text-white uppercase font-bold tracking-widest bg-white/5 px-4 py-2 rounded-xl transition-all"
            >
              Dismiss
            </button>
          </motion.div>
        )}

        {/* --- Campaign Banner: Daily Bonus Claimed Notification --- */}
        {bonusClaimed && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }} 
            animate={{ opacity: 1, y: 0 }} 
            className="mb-8 p-5 bg-green-500/10 border border-green-500/30 rounded-3xl flex justify-between items-center"
          >
            <div className="flex items-center gap-4">
              <span className="text-2xl">💎</span>
              <div>
                <h4 className="font-bold text-green-400 text-md">Daily Bonus Claimed!</h4>
                <p className="text-xs text-zinc-400">150 coins have been credited automatically to your profile balance.</p>
              </div>
            </div>
            <button 
              onClick={() => setBonusClaimed(false)}
              className="text-xs text-zinc-400 hover:text-white bg-white/5 px-3 py-1.5 rounded-lg transition-all"
            >
              Got it
            </button>
          </motion.div>
        )}

        {/* --- Dynamic Notification Banner --- */}
        {permission === "default" && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }} 
            animate={{ opacity: 1, y: 0 }} 
            className="mb-8 p-6 bg-amber-500/10 border border-amber-500/20 rounded-3xl flex flex-col md:flex-row justify-between items-center gap-4"
          >
            <div className="text-center md:text-left">
              <h4 className="font-bold text-amber-500 text-lg">Never miss a drop!</h4>
              <p className="text-sm text-gray-400">Enable system alerts to get notified when new packs are ready.</p>
            </div>
            <button 
              onClick={handleEnableNotifications} 
              className="px-6 py-3 bg-amber-500 text-black rounded-xl font-bold hover:bg-amber-400 transition-all text-sm uppercase tracking-wider"
            >
              Enable Alerts
            </button>
          </motion.div>
        )}

        {permission === "denied" && (
          <div className="mb-8 p-4 bg-red-500/10 border border-red-500/20 rounded-3xl text-center text-xs text-red-400">
            Alerts are blocked. Please unlock notification permissions in your browser's site settings.
          </div>
        )}

        <h1 className="text-4xl font-black mb-12 tracking-tighter">VAULT</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {packs.map((pack) => {
            // Apply a 50% discount factor dynamically if campaign is active
            const finalPrice = isFlashSaleActive ? Math.floor(pack.price * 0.5) : pack.price;

            return (
              <motion.div whileHover={{ y: -5 }} key={pack.id} className="bg-[#0c0c0c] border border-white/5 p-8 rounded-3xl hover:border-amber-500/30 transition-all relative overflow-hidden">
                {isFlashSaleActive && (
                  <div className="absolute top-4 right-4 bg-red-500 text-black text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider shadow-lg animate-pulse">
                    -50% Off
                  </div>
                )}
                <div className="text-4xl mb-6">🎁</div>
                <h3 className="font-bold text-lg mb-1">{pack.name}</h3>
                <p className="text-gray-500 text-sm mb-8">Unlock rare items from this tier.</p>
                <button 
                  onClick={async () => {
                    const res = await fetch("/api/packs/open", { 
                      method: "POST", 
                      body: JSON.stringify({ packId: pack.id }), 
                      headers: {"Content-Type": "application/json"} 
                    });
                    const data = await res.json();
                    if (res.ok) {
                      setUser(prev => prev ? {...prev, balance: data.newBalance} : null);
                      document.dispatchEvent(new CustomEvent("balanceChanged", { detail: data.newBalance, bubbles: true }));
                      setWonItem(data.wonItem);
                    }
                  }}
                  className="w-full py-4 bg-white/5 hover:bg-amber-500 hover:text-black rounded-xl font-black transition-all flex flex-col items-center justify-center"
                >
                  {isFlashSaleActive && (
                    <span className="text-xs line-through text-zinc-500 font-normal mb-0.5">
                      {pack.price.toLocaleString()} COINS
                    </span>
                  )}
                  <span>{finalPrice.toLocaleString()} COINS</span>
                </button>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* --- DEV TEST CENTER PANEL --- */}
      <div className="fixed bottom-0 left-0 right-0 z-50 p-4 flex justify-center pointer-events-none">
        <div className="bg-[#121212] border border-red-500/30 rounded-t-3xl shadow-[0_-15px_30px_rgba(0,0,0,0.8)] w-full max-w-xl pointer-events-auto overflow-hidden transition-all duration-300">
          <button 
            onClick={() => setShowDevPanel(!showDevPanel)}
            className="w-full px-6 py-3 bg-red-950/20 flex justify-between items-center text-xs font-mono font-bold tracking-wider text-red-400 hover:bg-red-950/45 transition-all border-b border-white/5"
          >
            <span>🛠️ DEV TEST CENTER</span>
            <span>{showDevPanel ? "[ HIDE ]" : "[ EXPAND ]"}</span>
          </button>
          
          <AnimatePresence>
            {showDevPanel && (
              <motion.div 
                initial={{ height: 0 }} 
                animate={{ height: "auto" }} 
                exit={{ height: 0 }}
                className="p-6 space-y-4"
              >
                <div className="grid grid-cols-2 gap-3">
                  <button 
                    onClick={triggerInstantNotification}
                    disabled={isTestingPush}
                    className="py-3 px-4 bg-red-500 text-black text-xs font-bold font-mono rounded-xl hover:bg-red-400 disabled:opacity-50 transition-all uppercase"
                  >
                    {isTestingPush ? "Dispatching..." : "⚡ Test Push Now"}
                  </button>
                  <button 
                    onClick={handleEnableNotifications}
                    className="py-3 px-4 bg-zinc-800 text-white text-xs font-bold font-mono rounded-xl hover:bg-zinc-700 transition-all uppercase"
                  >
                    🔄 Re-Sync Token
                  </button>
                </div>

                <div className="grid grid-cols-1">
                  <button 
                    onClick={triggerPeriodicSyncSimulation}
                    className="py-3 px-4 bg-amber-500 text-black text-xs font-bold font-mono rounded-xl hover:bg-amber-400 transition-all uppercase"
                  >
                    ⏰ Simulate 2-4m Drop Loop
                  </button>
                </div>

                <div className="p-3 bg-black rounded-xl border border-white/5">
                  <div className="text-[10px] uppercase tracking-widest text-zinc-500 font-mono mb-2">Live Debug Logs:</div>
                  <div className="space-y-1.5 font-mono text-[11px] text-zinc-300 h-24 overflow-y-auto">
                    {testLog.length === 0 ? (
                      <span className="text-zinc-600">No events captured. Click an action to test.</span>
                    ) : (
                      testLog.map((log, idx) => <div key={idx} className="line-clamp-1">{log}</div>)
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
      
      {errorDialog && <ErrorDialog message={errorDialog.message} onClose={() => setErrorDialog(null)} />}
    </div>
  );
}