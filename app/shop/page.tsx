"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ErrorDialog from "@/components/ErrorDialog";
import { RewardedAdService } from '@/lib/adService';
import type { PackWithItems } from "@/types";

export default function ShopPage() {
  const [packs, setPacks] = useState<PackWithItems[]>([]);
  const [user, setUser] = useState<{ id?: string; email?: string; balance?: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [isWaiting, setIsWaiting] = useState(false);
  const [countdown, setCountdown] = useState(10);
  const [showAdModal, setShowAdModal] = useState(false);
  const [wonItem, setWonItem] = useState<{ name: string; rarity?: string; value?: number } | null>(null);
  const [errorDialog, setErrorDialog] = useState<{ message: string } | null>(null);
  const [hasDispatchedPush, setHasDispatchedPush] = useState(false);

  const [isFlashSaleActive, setIsFlashSaleActive] = useState(false);
  const [bonusClaimed, setBonusClaimed] = useState(false);

  const [permission, setPermission] = useState<NotificationPermission | "unsupported">("default");

  const targetTimeRef = useRef<number | null>(null);
  const adService = useRef<RewardedAdService | null>(null);

  const fetchUserData = useCallback(async () => {
    try {
      const res = await fetch(`/api/user/profile?t=${Date.now()}`);
      if (res.ok) {
        const userData = await res.json();
        setUser(userData);
        window.dispatchEvent(new CustomEvent('balanceUpdated', { detail: { balance: userData.balance } }));
      }
    } catch (err) {
      console.error("Failed to refresh user:", err);
    }
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      if (!("Notification" in window)) setPermission("unsupported");
      else setPermission(Notification.permission);
    }
  }, []);

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
          const convertedKey = urlBase64ToUint8Array(publicKey);
          const subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: convertedKey
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

  async function loadShopData() {
    try {
      const [userRes, packRes] = await Promise.all([fetch("/api/user/profile"), fetch("/api/packs")]);
      if (userRes.ok) setUser(await userRes.json());
      if (packRes.ok) setPacks(await packRes.json());
    } catch (err) { console.error(err); } 
    finally { setLoading(false); }
  }

  const handleClaimReward = useCallback(async () => {
    setIsWaiting(false);
    targetTimeRef.current = null;
    try {
      const verifyRes = await fetch("/api/user/verify-ad-claim");
      const verifyData = await verifyRes.json();
      if (!verifyRes.ok || !verifyData.eligible) {
        setErrorDialog({ message: "Reward not available or already claimed." });
        window.history.replaceState({}, document.title, window.location.pathname);
        return;
      }
      const res = await fetch("/api/user/add-coins", { method: "POST" });
      if (res.ok) {
        setShowAdModal(false);
        setHasDispatchedPush(false);
        await fetchUserData();
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    } catch (err) { setErrorDialog({ message: "Error claiming reward." }); }
  }, [fetchUserData]);

  const handleClaimDailyBonus = async () => {
    try {
      const res = await fetch("/api/user/add-coins", { method: "POST" });
      if (res.ok) {
        setBonusClaimed(true);
        await fetchUserData();
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    } catch (err) { console.error("Failed to claim Daily Bonus automatically."); }
  };

  const handleWatchAdClick = async () => {
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
          url: window.location.origin + "/shop?ref=reward-claim"
        });
      }
    }
  };

  const handleTimerComplete = useCallback(async () => {
    setIsWaiting(false);
    targetTimeRef.current = null;
    setHasDispatchedPush(true);
    try { await fetch("/api/user/ad-complete", { method: "POST" }); } 
    catch (e) { console.error("Failed to sync ad completion."); }
  }, []);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    const handleServiceWorkerMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === "BACKGROUND_TIMER_COMPLETE") handleTimerComplete();
    };
    navigator.serviceWorker.addEventListener("message", handleServiceWorkerMessage);
    return () => navigator.serviceWorker.removeEventListener("message", handleServiceWorkerMessage);
  }, [handleTimerComplete]);

  useEffect(() => {
    if (typeof window !== "undefined" && !loading) {
      const params = new URLSearchParams(window.location.search);
      const ref = params.get("ref");
      if (ref === "reward-claim") {
        setShowAdModal(true);
        handleClaimReward();
      } else if (ref === "notif_flash") {
        setIsFlashSaleActive(true);
      } else if (ref === "notif_bonus" && !bonusClaimed) {
        handleClaimDailyBonus();
      } else if (params.get("open-ad") === "true") {
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
        if (remaining <= 0) handleTimerComplete();
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
    return { border: "border-amber-600/50", text: "text-amber-500", glow: "from-amber-600/20", shadow: "shadow-amber-600/10" };
  };

  const currentTheme = getRarityStyles(wonItem?.rarity);

  if (loading) return <div className="min-h-screen bg-black" />;

  return (
    <div className="min-h-screen bg-[#070707] text-white p-6 md:p-12 font-sans relative pb-32">
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
                  <button onClick={() => { setShowAdModal(false); window.history.replaceState({}, document.title, window.location.pathname); }} className="mt-4 text-sm text-gray-500 hover:text-white transition-colors">Cancel</button>
                </>
              ) : (
                <>
                  <div className="text-5xl mb-4 animate-bounce">🔔</div>
                  <h3 className="text-xl font-bold mb-2">Notification Sent!</h3>
                  <p className="text-sm text-gray-400 mb-6">Tap the system push notification that just appeared on your device to claim your 500 coins!</p>
                  <button onClick={() => { setShowAdModal(false); window.history.replaceState({}, document.title, window.location.pathname); }} className="w-full py-3 bg-white/10 hover:bg-white/20 rounded-xl text-sm font-bold transition-all">Close Window</button>
                </>
              )}
            </motion.div>
          </motion.div>
        )}

        {wonItem && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-xl" onClick={() => setWonItem(null)}>
             <div className="absolute inset-0 flex items-center justify-center overflow-hidden pointer-events-none">
              <div className="absolute w-[800px] h-[800px] bg-[radial-gradient(circle,rgba(245,158,11,0.15)_0%,transparent_60%)] animate-pulse" />
              <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 25, ease: "linear" }} className="absolute w-[1000px] h-[1000px] opacity-15" style={{ backgroundImage: `repeating-conic-gradient(from 0deg, #fff 0deg, #fff 10deg, transparent 10deg, transparent 25deg)` }} />
            </div>
            <motion.div initial={{ scale: 0.3, y: 100, rotate: -25 }} animate={{ scale: 1, y: 0, rotate: 0 }} exit={{ scale: 0.3, y: 100, rotate: 25 }} transition={{ type: "spring", damping: 14, stiffness: 100 }} className={`relative bg-gradient-to-b ${currentTheme.glow} to-black/95 border ${currentTheme.border} p-12 rounded-[2.5rem] text-center w-full max-w-sm cursor-pointer shadow-2xl ${currentTheme.shadow}`} onClick={(e) => e.stopPropagation()}>
              <p className="text-xs tracking-[0.3em] font-black uppercase text-white/40 mb-2">unlocked pack item</p>
              <h2 className="text-4xl font-extrabold mb-3 tracking-tight text-white uppercase">YOU WON!</h2>
              <div className="inline-block px-4 py-1.5 bg-white/5 rounded-full border border-white/10 mb-6">
                <span className={`text-xs font-black uppercase tracking-widest ${currentTheme.text}`}>{wonItem.rarity || "COMMON"}</span>
              </div>
              <p className="text-2xl font-black text-white px-2 tracking-tight line-clamp-2 min-h-[4rem] flex items-center justify-center">{wonItem.name}</p>
              <div className="h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent my-6" />
              <button onClick={() => setWonItem(null)} className="w-full py-4 bg-white text-black hover:bg-gray-100 rounded-2xl font-black text-sm uppercase tracking-wider transition-all duration-300 shadow-lg">Claim Item</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-5xl mx-auto">
        <h1 className="text-4xl font-black mb-12 tracking-tighter">VAULT</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {packs.map((pack) => {
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
                      // FIX: Pass the flash sale state to the backend
                      body: JSON.stringify({ packId: pack.id, isFlashSale: isFlashSaleActive }), 
                      headers: {"Content-Type": "application/json"} 
                    });
                    const data = await res.json();
                    if (res.ok) {
                      setWonItem(data.wonItem);
                      await fetchUserData(); 
                    } else {
                        setErrorDialog({ message: data.error || "Failed to open pack" });
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
      
      {errorDialog && <ErrorDialog message={errorDialog.message} onClose={() => setErrorDialog(null)} />}
    </div>
  );
}