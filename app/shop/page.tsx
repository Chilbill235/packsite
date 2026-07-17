"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, X, ChevronDown, Smartphone } from "lucide-react";
import ErrorDialog from "@/components/ErrorDialog";
import { RewardedAdService } from '@/lib/adService';
import type { PackWithItems } from "@/types";

export default function ShopPage() {
  // --- States ---
  const [packs, setPacks] = useState<PackWithItems[]>([]);
  const [user, setUser] = useState<{ id?: string; email?: string; balance?: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [isWaiting, setIsWaiting] = useState(false);
  const [countdown, setCountdown] = useState(10);
  const [showAdModal, setShowAdModal] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  
  const [isStandalone, setIsStandalone] = useState(true);
  const [isIOS, setIsIOS] = useState(false);
  
  const [openQuantity, setOpenQuantity] = useState(1);
  const [wonItems, setWonItems] = useState<{ name: string; rarity?: string; value?: number }[]>([]);
  
  const [errorDialog, setErrorDialog] = useState<{ message: string } | null>(null);
  const [hasDispatchedPush, setHasDispatchedPush] = useState(false);
  const [isFlashSaleActive, setIsFlashSaleActive] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">("default");
  const [showBanner, setShowBanner] = useState(true);

  const targetTimeRef = useRef<number | null>(null);
  const adService = useRef<RewardedAdService | null>(null);

  // --- Core Logic ---

  const fetchUserData = useCallback(async () => {
    try {
      const res = await fetch(`/api/user/profile?t=${Date.now()}`);
      if (res.ok) {
        const userData = await res.json();
        setUser(userData);
        window.dispatchEvent(new CustomEvent('balanceUpdated', { detail: { balance: userData.balance } }));
      }
    } catch (err) { console.error("Failed to refresh user:", err); }
  }, []);

  const loadShopData = useCallback(async () => {
    try {
      setLoading(true);
      const [userRes, packRes] = await Promise.all([fetch("/api/user/profile"), fetch("/api/packs")]);
      if (userRes.ok) setUser(await userRes.json());
      if (packRes.ok) setPacks(await packRes.json());
    } catch (err) { console.error(err); } 
    finally { setLoading(false); }
  }, []);

  const handleClaimReward = useCallback(async () => {
    setIsWaiting(false);
    targetTimeRef.current = null;
    const storedAmount = sessionStorage.getItem('pendingRewardAmount');
    const amount = storedAmount ? parseInt(storedAmount) : 500;
    try {
      const verifyRes = await fetch("/api/user/verify-ad-claim");
      const verifyData = await verifyRes.json();
      if (!verifyRes.ok || !verifyData.eligible) {
        setErrorDialog({ message: "Reward not available or already claimed." });
        return;
      }
      const res = await fetch("/api/user/add-coins", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ amount }) });
      if (res.ok) {
        sessionStorage.removeItem('pendingRewardAmount');
        setShowAdModal(false);
        setHasDispatchedPush(false);
        await fetchUserData();
      }
    } catch (err) { setErrorDialog({ message: "Error claiming reward." }); }
  }, [fetchUserData]);

  const handleTimerComplete = useCallback(async () => {
    setIsWaiting(false);
    targetTimeRef.current = null;
    setHasDispatchedPush(true);
    try { await fetch("/api/user/ad-complete", { method: "POST" }); } catch (e) { console.error("Failed to sync ad completion."); }
  }, []);

  const handleNotificationRouting = useCallback(async (ref: string) => {
    // Exact requested routing logic
    if (["flash-deal", "weekend-sale", "double-coins", "anniversary", "clearance", "night-owl"].includes(ref)) {
      setIsFlashSaleActive(true);
    } else if (["daily-bonus", "level-up", "streak"].includes(ref)) {
      try {
        await fetch("/api/user/add-coins", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ amount: 150 }) });
        await fetchUserData();
      } catch (e) { console.error("Auto-claim failed"); }
    } else if (["reward-claim", "vault-drop", "mystery-box", "surprise"].includes(ref)) {
      setShowAdModal(true);
      if (ref === "reward-claim") {
          setTimeout(() => handleClaimReward(), 500);
      }
    } else if (["new-item", "best-seller", "refresh", "seasonal"].includes(ref)) {
      loadShopData();
    }
  }, [fetchUserData, handleClaimReward, loadShopData]);

  // --- Utilities ---
  const urlBase64ToUint8Array = (base64String: string) => {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) outputArray[i] = rawData.charCodeAt(i);
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
          const subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(publicKey)
          });
          await fetch("/api/user/subscribe", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ subscription })
          });
        }
      }
    } catch (err: any) { console.error("Permission Error: " + err.message); }
  };

  const handleWatchAdClick = async (amount: number) => {
    sessionStorage.setItem('pendingRewardAmount', amount.toString());
    targetTimeRef.current = Date.now() + 10000;
    setCountdown(10);
    setIsWaiting(true);
    setHasDispatchedPush(false);
    adService.current?.showAd(user?.email || "anon");

    if ("serviceWorker" in navigator) {
      const registration = await navigator.serviceWorker.ready;
      if (registration.active) {
        registration.active.postMessage({ 
          type: "START_BACKGROUND_TIMER", 
          delay: 10000, 
          amount: amount, 
          url: window.location.origin + "/shop?ref=reward-claim" 
        });
      }
    }
  };

  const handleOpenPack = async (packId: string) => {
    try {
      const res = await fetch("/api/packs/open", { 
        method: "POST", 
        body: JSON.stringify({ packId, quantity: openQuantity, isFlashSale: isFlashSaleActive }), 
        headers: {"Content-Type": "application/json"} 
      });
      const data = await res.json();
      if (res.ok) {
        setWonItems(data.wonItems || [data.wonItem]); 
        await fetchUserData(); 
      } else {
        setErrorDialog({ message: data.error || "Failed to open pack" });
      }
    } catch (err) { setErrorDialog({ message: "Network error occurred" }); }
  };

  // --- Effects ---
  useEffect(() => {
    if (typeof window !== "undefined") {
      const is_ios = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
      const is_standalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true;
      setIsIOS(is_ios);
      setIsStandalone(is_standalone);

      if (!("Notification" in window)) setPermission("unsupported");
      else setPermission(Notification.permission);
    }

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/serviceWorker.js")
        .then((reg) => console.log("Service Worker registered: ", reg.scope))
        .catch((err) => console.error("Service Worker registration failed: ", err));
    }

    loadShopData();
    adService.current = new RewardedAdService();
    
    const handleServiceWorkerMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === "BACKGROUND_TIMER_COMPLETE") handleTimerComplete();
    };
    navigator.serviceWorker?.addEventListener("message", handleServiceWorkerMessage);

    const openModal = () => { setHasDispatchedPush(false); setShowAdModal(true); };
    window.addEventListener("openBalanceModal", openModal);

    return () => {
      navigator.serviceWorker?.removeEventListener("message", handleServiceWorkerMessage);
      window.removeEventListener("openBalanceModal", openModal);
    };
  }, [loadShopData, handleTimerComplete]);

  useEffect(() => {
    if (!loading) {
      const params = new URLSearchParams(window.location.search);
      const ref = params.get("ref");
      if (ref) {
        handleNotificationRouting(ref);
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    }
  }, [loading, handleNotificationRouting]);

  useEffect(() => {
    const intervalId = setInterval(() => {
      if (isWaiting && targetTimeRef.current) {
        const remaining = Math.max(0, Math.ceil((targetTimeRef.current - Date.now()) / 1000));
        setCountdown(remaining);
        if (remaining <= 0) handleTimerComplete();
      }
    }, 250);
    return () => clearInterval(intervalId);
  }, [isWaiting, handleTimerComplete]);

  const getRarityStyles = (rarity?: string) => {
    const r = rarity?.toLowerCase() || "common";
    if (r.includes("legend")) return { border: "border-yellow-500/50", text: "text-yellow-400", glow: "from-yellow-500/20", shadow: "shadow-yellow-500/10" };
    if (r.includes("epic")) return { border: "border-purple-500/50", text: "text-purple-400", glow: "from-purple-500/20", shadow: "shadow-purple-500/10" };
    if (r.includes("rare")) return { border: "border-blue-500/50", text: "text-blue-400", glow: "from-blue-500/20", shadow: "shadow-blue-500/10" };
    return { border: "border-amber-600/50", text: "text-amber-500", glow: "from-amber-600/20", shadow: "shadow-amber-600/10" };
  };

  if (loading) return <div className="min-h-screen bg-black" />;

  return (
    <div className="min-h-screen bg-[#070707] text-white p-6 md:p-12 font-sans relative pb-32">
      
      {/* iOS Safari Standalone Guide Banner */}
      {isIOS && !isStandalone && (
        <div className="mb-6 p-5 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
          <Smartphone className="text-amber-500 shrink-0" size={28} />
          <div>
            <h4 className="font-bold text-amber-500">Enable Safari Background Alerts</h4>
            <p className="text-sm text-gray-300">Tap the <strong className="text-white">Share</strong> button in Safari, then choose <strong className="text-white">"Add to Home Screen"</strong> to receive background timer payouts and free drops!</p>
          </div>
        </div>
      )}

      {/* Notifications Request Banner */}
      <AnimatePresence>
        {permission === "default" && showBanner && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, height: 0 }} className="mb-12 relative overflow-hidden rounded-2xl border border-white/10 bg-black/40 backdrop-blur-xl p-6 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="absolute inset-0 bg-gradient-to-r from-amber-500/10 to-transparent pointer-events-none" />
            <div className="flex items-center gap-4 relative z-10">
              <div className="p-3 bg-amber-500/20 rounded-xl text-amber-500"><Bell size={24} /></div>
              <div>
                <h4 className="font-bold text-lg">Enable Notifications</h4>
                <p className="text-gray-400 text-sm">Get alerts for shop drops, flash sales, and bonus claims.</p>
              </div>
            </div>
            <div className="flex items-center gap-3 relative z-10 w-full md:w-auto">
              <button onClick={handleEnableNotifications} className="flex-1 md:flex-none px-6 py-3 bg-amber-500 hover:bg-amber-400 text-black font-black rounded-xl transition-all shadow-[0_0_15px_rgba(245,158,11,0.3)]">ALLOW ALERTS</button>
              <button onClick={() => setShowBanner(false)} className="p-3 text-gray-500 hover:text-white transition-colors"><X size={20} /></button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Ad Modal */}
      <AnimatePresence>
        {showAdModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div className="bg-[#111111] border border-white/10 p-8 rounded-[2rem] w-full max-w-sm text-center relative overflow-hidden shadow-2xl">
              {isWaiting ? (
                <div className="flex flex-col items-center py-8">
                  <div className="relative w-24 h-24 mb-6 flex items-center justify-center">
                    <svg className="w-full h-full rotate-[-90deg]">
                      <circle cx="48" cy="48" r="44" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-zinc-800" />
                      <motion.circle cx="48" cy="48" r="44" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-amber-500" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 10, ease: "linear" }} />
                    </svg>
                    <span className="absolute text-3xl font-black">{countdown}</span>
                  </div>
                  <h3 className="text-xl font-bold">Watching Ad</h3>
                </div>
              ) : !hasDispatchedPush ? (
                <>
                  <h3 className="text-2xl font-black mb-2 tracking-tight">Boost Balance</h3>
                  <button onClick={() => handleWatchAdClick(500)} className="w-full py-4 rounded-2xl font-black bg-amber-500/10 border border-amber-500/20 text-amber-500">WATCH AD (500)</button>
                  <button onClick={() => setShowAdModal(false)} className="mt-6 text-sm text-zinc-600">Cancel</button>
                </>
              ) : (
                <div className="py-6">
                  <div className="text-5xl mb-4 animate-bounce">🔔</div>
                  <h3 className="text-xl font-bold">Notification Sent!</h3>
                  <button onClick={() => setShowAdModal(false)} className="w-full py-3 bg-white text-black font-black rounded-xl">Close</button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Won Items Grid Modal */}
      <AnimatePresence>
        {wonItems.length > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-xl p-4 overflow-y-auto" onClick={() => setWonItems([])}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="w-full max-w-3xl" onClick={(e) => e.stopPropagation()}>
              <h2 className="text-center text-4xl font-black mb-12 uppercase tracking-widest text-white">You Won!</h2>
              
              <div className="flex flex-wrap justify-center gap-4 w-full">
                {wonItems.map((item, idx) => {
                  const theme = getRarityStyles(item.rarity);
                  return (
                    <motion.div 
                      key={idx} 
                      initial={{ y: 20, opacity: 0, scale: 0.9 }} 
                      animate={{ y: 0, opacity: 1, scale: 1 }} 
                      transition={{ delay: idx * 0.05 }} 
                      className={`w-full max-w-[200px] bg-black border ${theme.border} p-6 rounded-2xl text-center relative overflow-hidden`}
                    >
                      <div className={`absolute inset-0 bg-gradient-to-b ${theme.glow} to-transparent`} />
                      <div className="relative z-10">
                        <span className={`text-[10px] font-black uppercase tracking-widest ${theme.text} mb-2 block`}>{item.rarity || "COMMON"}</span>
                        <p className="font-bold text-lg mb-2">{item.name}</p>
                        <p className="text-amber-500 font-bold text-xs">{item.value?.toLocaleString()} COINS</p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              <button onClick={() => setWonItems([])} className="mt-12 w-full max-w-xs mx-auto block py-4 bg-white text-black hover:bg-gray-200 rounded-2xl font-black transition-all">Collect All</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto flex flex-col items-center w-full">
        <h1 className="text-4xl font-black mb-10 tracking-tighter text-center">VAULT</h1>
        
        {/* Quantity Dropdown */}
        <div className="relative mb-12 z-20">
          <button 
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-4 bg-[#111] border border-white/10 px-6 py-3 rounded-2xl hover:bg-[#1a1a1a] transition-all min-w-[200px] justify-between group"
          >
            <span className="font-bold">Open {openQuantity} {openQuantity > 1 ? "Packs" : "Pack"}</span>
            <ChevronDown className={`transition-transform ${isDropdownOpen ? "rotate-180" : ""}`} size={20} />
          </button>
          
          <AnimatePresence>
            {isDropdownOpen && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
                className="absolute top-full left-0 w-full mt-2 bg-[#161616] border border-white/10 rounded-2xl overflow-hidden shadow-2xl"
              >
                {[1, 3, 6].map((q) => (
                  <button 
                    key={q} 
                    onClick={() => { setOpenQuantity(q); setIsDropdownOpen(false); }}
                    className={`w-full px-6 py-4 text-left font-bold transition-all hover:bg-white/5 ${openQuantity === q ? "text-amber-500 bg-white/5" : "text-white"}`}
                  >
                    Open {q} {q > 1 ? "Packs" : "Pack"}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        
        {/* Pack Grid */}
        <div className="flex flex-wrap justify-center gap-6 w-full max-w-5xl">
          {packs.map((pack) => {
            const basePrice = typeof pack.price === 'string' ? parseInt(pack.price) : pack.price;
            const finalPrice = isFlashSaleActive ? Math.floor(basePrice * 0.5) : basePrice;
            const totalCost = finalPrice * openQuantity;
            
            return (
              <motion.div 
                key={pack.id} 
                className="w-full max-w-[320px] bg-[#0c0c0c] border border-white/5 p-8 rounded-3xl relative overflow-hidden flex flex-col items-center"
              >
                {isFlashSaleActive && <div className="absolute top-4 right-4 bg-red-500 text-black text-[10px] font-black px-2.5 py-1 rounded-full uppercase shadow-lg animate-pulse">-50%</div>}
                <div className="text-4xl mb-6">🎁</div>
                <h3 className="font-bold text-lg mb-4 text-center">{pack.name}</h3>
                <button onClick={() => handleOpenPack(pack.id)} className="w-full py-4 bg-white/5 hover:bg-amber-500 hover:text-black rounded-xl font-black transition-all">
                  OPEN {openQuantity} FOR {totalCost.toLocaleString()} COINS
                </button>
              </motion.div>
            );
          })}
        </div>
      </div>

      {errorDialog && <ErrorDialog message={errorDialog.message} onClose={() => setErrorDialog(null)} />}
    </div>
  );
}