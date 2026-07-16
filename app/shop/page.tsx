"use client";

import { useState, useEffect, useRef } from "react";
import ErrorDialog from "@/components/ErrorDialog";
import { RewardedAdService } from '@/lib/adService';
import type { PackWithItems } from "@/types";

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}

interface ExtendedServiceWorkerRegistration extends ServiceWorkerRegistration {
  periodicSync?: {
    register(tag: string, options?: { minInterval: number }): Promise<void>;
  };
}

export default function ShopPage() {
  const [packs, setPacks] = useState<PackWithItems[]>([]);
  const [user, setUser] = useState<{ balance: number; email?: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [isWaiting, setIsWaiting] = useState(false);
  const [countdown, setCountdown] = useState(10);
  const [notification, setNotification] = useState<string | null>(null);
  const [errorDialog, setErrorDialog] = useState<{ message: string } | null>(null);
  
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);

  const targetTimeRef = useRef<number | null>(null);
  const adService = useRef<RewardedAdService | null>(null);

  const notify = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  // --- Hand off countdown to the Service Worker ---
  const delegateCountdownToServiceWorker = async (msRemaining: number) => {
    if (!('serviceWorker' in navigator)) return;
    try {
      const registration = await navigator.serviceWorker.ready;
      if (registration.active) {
        // Sends a signal to sw1.js to schedule a background-safe system notification
        registration.active.postMessage({
          type: "START_BACKGROUND_TIMER",
          delay: msRemaining
        });
      }
    } catch (err) {
      console.warn("Failed to delegate background countdown to Service Worker:", err);
    }
  };

  async function checkSubscriptionStatus() {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;
    try {
      const registration = await navigator.serviceWorker.ready;
      const existingSubscription = await registration.pushManager.getSubscription();
      if (existingSubscription) {
        setIsSubscribed(true);
      }
    } catch (err) {
      console.warn("Could not check subscription status:", err);
    }
  }

  async function registerPeriodicNotifications(registration: ServiceWorkerRegistration) {
    const reg = registration as ExtendedServiceWorkerRegistration;
    if (!reg.periodicSync) return;
    try {
      const status = await navigator.permissions.query({
        name: 'periodic-background-sync' as any,
      });
      if (status.state === 'granted') {
        await reg.periodicSync.register('random-shop-alert', {
          minInterval: 20 * 60 * 1000, 
        });
      }
    } catch (err) {
      console.warn("Periodic sync registry skipped:", err);
    }
  }

  async function registerPushSubscription() {
    try {
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;

      const permission = await Notification.requestPermission();
      if (permission !== 'granted') return;
      
      const registration = await navigator.serviceWorker.ready;
      const vapidKey = "BEtKdyDMRqNtEXn-VObKK2cdNlmnSSk3oz1_KXET_MDVUBPDGrofEvpAYaNBQpGp3-MS45qj_KV9nBbzxzftDtU";
      const sub = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey)
      });

      await fetch('/api/user/subscribe', {
        method: 'POST',
        body: JSON.stringify(sub),
        headers: { 'Content-Type': 'application/json' }
      });
      setIsSubscribed(true);
      await registerPeriodicNotifications(registration);
    } catch (err) {
      console.error("Push subscription failed:", err);
    }
  }

  async function loadShopData() {
    try {
      const [userRes, packRes] = await Promise.all([
        fetch("/api/user/profile"),
        fetch("/api/packs")
      ]);
      if (userRes.ok) setUser(await userRes.json());
      if (packRes.ok) setPacks(await packRes.json());
    } catch (err) { console.error(err); } 
    finally { setLoading(false); }
  }

  const handleClaimReward = async () => {
    setIsWaiting(false);
    targetTimeRef.current = null;
    try {
      const res = await fetch("/api/user/add-coins", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setUser(prev => prev ? { ...prev, balance: data.newBalance } : null);
        document.dispatchEvent(new CustomEvent("balanceChanged", { detail: data.newBalance, bubbles: true }));
        notify("🎉 500 coins added!");
      } else {
        throw new Error(data.error || "Failed to claim reward");
      }
    } catch (err) {
      setErrorDialog({ message: "Error claiming reward." });
    }
  };

  const handleWatchAdClick = async () => {
    targetTimeRef.current = Date.now() + 10000;
    setCountdown(10);
    setIsWaiting(true);

    if (isSubscribed) {
      setShowSubscriptionModal(true);
    } else {
      await registerPushSubscription();
    }

    // Tell the Service Worker to run a guaranteed 10s background clock right now
    await delegateCountdownToServiceWorker(10000);

    adService.current?.showAd(user?.email || "anon"); 
  };

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw1.js')
        .then((reg) => {
          if (Notification.permission === 'granted') {
            registerPeriodicNotifications(reg);
          }
          checkSubscriptionStatus();
        })
        .catch(console.error);
    }
    adService.current = new RewardedAdService();
    loadShopData();
  }, []);

  // --- LOCAL UI COUNTDOWN LOGIC ---
  useEffect(() => {
    let animationFrameId: number;

    const updateTimer = () => {
      if (!isWaiting || !targetTimeRef.current) return;

      const now = Date.now();
      const remainingSeconds = Math.max(0, Math.ceil((targetTimeRef.current - now) / 1000));

      setCountdown(remainingSeconds);

      if (remainingSeconds <= 0) {
        handleClaimReward();
      } else {
        animationFrameId = requestAnimationFrame(updateTimer);
      }
    };

    if (isWaiting) {
      animationFrameId = requestAnimationFrame(updateTimer);
    }

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [isWaiting]);

  // Listen to visibility transitions
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible" && isWaiting && targetTimeRef.current) {
        const now = Date.now();
        const remainingSeconds = Math.max(0, Math.ceil((targetTimeRef.current - now) / 1000));
        
        setCountdown(remainingSeconds);
        
        if (remainingSeconds <= 0) {
          handleClaimReward();
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [isWaiting]);

  if (loading) return <div className="min-h-screen bg-black text-white flex items-center justify-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-black text-white p-6 relative">
      {notification && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-amber-600 px-6 py-3 rounded-full shadow-lg">
          {notification}
        </div>
      )}

      {showSubscriptionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity" 
            onClick={() => setShowSubscriptionModal(false)}
          />
          
          <div className="relative transform overflow-hidden rounded-3xl border border-amber-500/30 bg-gray-950 p-8 text-center shadow-2xl transition-all max-w-md w-full ring-1 ring-amber-500/10">
            <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-amber-500/10 border border-amber-500/20 mb-6 shadow-[0_0_15px_rgba(245,158,11,0.1)]">
              <span className="text-3xl animate-bounce">🔔</span>
            </div>

            <h3 className="text-2xl font-black text-amber-400 tracking-tight mb-2">
              Notifications Active!
            </h3>
            <p className="text-gray-400 text-sm leading-relaxed mb-6">
              You're already registered to receive background rewards, daily free coin codes, and flash deal updates. Thank you for staying connected!
            </p>

            <button
              onClick={() => setShowSubscriptionModal(false)}
              className="w-full bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-400 hover:to-yellow-500 text-black font-extrabold py-3 px-6 rounded-xl transition-all shadow-md active:scale-95"
            >
              Awesome, Let's Go!
            </button>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto">
        <div className="mb-12 text-center border border-gray-800 p-8 rounded-3xl bg-gray-900/30">
          <button 
            onClick={handleWatchAdClick}
            disabled={isWaiting}
            className={`px-8 py-4 rounded-full font-bold transition-all ${isWaiting ? 'bg-gray-700' : 'bg-amber-500 hover:bg-amber-400 text-black'}`}
          >
            {isWaiting ? `Watching... (${countdown}s)` : "Watch Ad for 500 Coins"}
          </button>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {packs.map((pack) => (
            <div key={pack.id} className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
              <h2 className="text-xl font-bold mb-2">{pack.name}</h2>
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
                    notify(`🎉 Won: ${data.wonItem.name}`);
                  }
                }}
                className="w-full bg-amber-600 py-2 rounded-lg font-bold"
              >
                {pack.price.toLocaleString()} Coins
              </button>
            </div>
          ))}
        </div>
      </div>
      {errorDialog && <ErrorDialog message={errorDialog.message} onClose={() => setErrorDialog(null)} />}
    </div>
  );
}