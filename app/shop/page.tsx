"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ErrorDialog from "@/components/ErrorDialog";
import { RewardedAdService } from '@/lib/adService';
import type { PackWithItems } from "@/types";

export default function ShopPage() {
  const [packs, setPacks] = useState<PackWithItems[]>([]);
  const [user, setUser] = useState<{ balance: number; email?: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [isWaiting, setIsWaiting] = useState(false);
  const [countdown, setCountdown] = useState(10);
  const [showAdModal, setShowAdModal] = useState(false);
  const [wonItem, setWonItem] = useState<any>(null);
  const [errorDialog, setErrorDialog] = useState<{ message: string } | null>(null);

  // Track if they have successfully dispatched a push request so we can display instructions
  const [hasDispatchedPush, setHasDispatchedPush] = useState(false);

  // --- Notification State ---
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">("default");

  const targetTimeRef = useRef<number | null>(null);
  const adService = useRef<RewardedAdService | null>(null);

  // Check current notification state on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      if (!("Notification" in window)) {
        setPermission("unsupported");
      } else {
        setPermission(Notification.permission);
      }
    }
  }, []);

  // Helper utility to convert base64 VAPID keys into Uint8Array
  const urlBase64ToUint8Array = (base64String: string) => {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/\-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  };

  // --- Notification Request Trigger ---
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
            console.log("[Push Register] Notifications enabled and saved.");
          } else {
            const errData = await response.json();
            console.error("[Push Register Error]", errData);
          }
        }
      }
    } catch (err) {
      console.error("[Push Register Error]", err);
    }
  };

  // --- Logic Helpers ---
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

  // ONLY called when users click the actual notification URL (?ref=reward-claim)
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
        
        // Clean up URL parameters so they don't claim again on manual refreshes
        if (typeof window !== "undefined") {
          window.history.replaceState({}, document.title, window.location.pathname);
        }
      }
    } catch (err) { setErrorDialog({ message: "Error claiming reward." }); }
  }, []);

  const handleWatchAdClick = async () => {
    targetTimeRef.current = Date.now() + 10000;
    setCountdown(10);
    setIsWaiting(true);
    setHasDispatchedPush(false);

    // 1. Fire up the monetization ad
    adService.current?.showAd(user?.email || "anon");

    // 2. Alert the Service Worker to begin the background timer
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

  // Timer complete step (Runs when the client-side 10s timer ends)
  const handleTimerComplete = useCallback(() => {
    setIsWaiting(false);
    targetTimeRef.current = null;
    setHasDispatchedPush(true); // Switches modal UI to say "Check your notifications!"
  }, []);

  // Listen for messages directly from the Service Worker
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    const handleServiceWorkerMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === "BACKGROUND_TIMER_COMPLETE") {
        // When the SW says the timer completed in the background, we do NOT claim here anymore.
        // We let the SW dispatch the push notification!
        handleTimerComplete();
      }
    };

    navigator.serviceWorker.addEventListener("message", handleServiceWorkerMessage);
    return () => {
      navigator.serviceWorker.removeEventListener("message", handleServiceWorkerMessage);
    };
  }, [handleTimerComplete]);

  // --- Check parameters on load and apply visual delay ---
  useEffect(() => {
    if (typeof window !== "undefined" && !loading) {
      const params = new URLSearchParams(window.location.search);
      
      // They clicked the notification! Trigger claim now.
      if (params.get("ref") === "reward-claim") {
        setShowAdModal(true);
        
        const claimTimeout = setTimeout(() => {
          handleClaimReward();
        }, 1200);

        return () => clearTimeout(claimTimeout);
      } else if (params.get("open-ad") === "true") {
        setShowAdModal(true);
      }
    }
  }, [loading, handleClaimReward]);

  // --- Effects ---
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

  if (loading) return <div className="min-h-screen bg-black" />;

  return (
    <div className="min-h-screen bg-black text-white p-6 md:p-12 font-sans">
      
      {/* --- Ad Reward Modal --- */}
      <AnimatePresence>
        {showAdModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-[#111] border border-white/10 p-8 rounded-3xl w-full max-w-sm text-center">
              
              {!hasDispatchedPush ? (
                <>
                  <h3 className="text-xl font-bold mb-6">Boost Your Balance</h3>
                  <button onClick={handleWatchAdClick} disabled={isWaiting} className={`w-full py-4 rounded-xl font-black transition-all ${isWaiting ? 'bg-white/5 text-gray-500' : 'bg-amber-500 text-black hover:bg-amber-400'}`}>
                    {isWaiting ? `WATCHING (${countdown}s)` : "WATCH AD FOR 500 COINS"}
                  </button>
                  <button onClick={() => setShowAdModal(false)} className="mt-4 text-sm text-gray-500 hover:text-white">Cancel</button>
                </>
              ) : (
                <>
                  <div className="text-5xl mb-4">🔔</div>
                  <h3 className="text-xl font-bold mb-2">Notification Sent!</h3>
                  <p className="text-sm text-gray-400 mb-6">Tap the system push notification that just appeared on your device to claim your 500 coins!</p>
                  <button onClick={() => setShowAdModal(false)} className="w-full py-3 bg-white/10 hover:bg-white/20 rounded-xl text-sm font-bold transition-all">Close Window</button>
                </>
              )}
              
            </motion.div>
          </motion.div>
        )}

        {/* --- Pack Reveal Modal --- */}
        {wonItem && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-xl" onClick={() => setWonItem(null)}>
            <motion.div initial={{ scale: 0.5, rotate: -10 }} animate={{ scale: 1, rotate: 0 }} className="bg-gradient-to-b from-amber-500/20 to-transparent p-10 rounded-[3rem] border border-amber-500/30 text-center">
              <div className="text-8xl mb-6">✨</div>
              <h2 className="text-4xl font-black mb-2">YOU WON!</h2>
              <p className="text-2xl text-amber-500 font-bold">{wonItem.name}</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- Main Shop Content --- */}
      <div className="max-w-5xl mx-auto">
        
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
          {packs.map((pack) => (
            <motion.div whileHover={{ y: -5 }} key={pack.id} className="bg-[#0a0a0a] border border-white/5 p-8 rounded-3xl hover:border-amber-500/30 transition-all">
              <div className="text-4xl mb-6">🎁</div>
              <h3 className="font-bold text-lg mb-1">{pack.name}</h3>
              <p className="text-gray-500 text-sm mb-8">Unlock rare items from this tier.</p>
              <button 
                onClick={async () => {
                  const res = await fetch("/api/packs/open", { method: "POST", body: JSON.stringify({ packId: pack.id }), headers: {"Content-Type": "application/json"} });
                  const data = await res.json();
                  if (res.ok) {
                    setUser(prev => prev ? {...prev, balance: data.newBalance} : null);
                    document.dispatchEvent(new CustomEvent("balanceChanged", { detail: data.newBalance, bubbles: true }));
                    setWonItem(data.wonItem);
                  }
                }}
                className="w-full py-4 bg-white/5 hover:bg-amber-500 hover:text-black rounded-xl font-black transition-all"
              >
                {pack.price.toLocaleString()} COINS
              </button>
            </motion.div>
          ))}
        </div>
      </div>
      
      {errorDialog && <ErrorDialog message={errorDialog.message} onClose={() => setErrorDialog(null)} />}
    </div>
  );
}