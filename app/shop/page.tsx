"use client";

import { useState, useEffect, useRef } from "react";
import ErrorDialog from "@/components/ErrorDialog";
import { RewardedAdService } from '@/lib/adService';
import type { PackWithItems } from "@/types";

// Helper: Converts the VAPID string to the required Uint8Array format
function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}

export default function ShopPage() {
  const [packs, setPacks] = useState<PackWithItems[]>([]);
  const [user, setUser] = useState<{ balance: number; email?: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [isWaiting, setIsWaiting] = useState(false);
  const [countdown, setCountdown] = useState(10);
  const [notification, setNotification] = useState<string | null>(null);
  const [errorDialog, setErrorDialog] = useState<{ message: string } | null>(null);

  const adService = useRef<RewardedAdService | null>(null);

  const notify = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  async function registerPushSubscription() {
    try {
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        console.warn("Push messaging not supported");
        return;
      }

      // 1. Request Permission
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        console.warn("Permission denied for notifications");
        return;
      }
      
      const registration = await navigator.serviceWorker.ready;
      
      // 2. Subscribe with properly converted key
      const vapidKey = "BEtKdyDMRqNtEXn-VObKK2cdNlmnSSk3oz1_KXET_MDVUBPDGrofEvpAYaNBQpGp3-MS45qj_KV9nBbzxzftDtU";
      const sub = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey)
      });

      // 3. Send to server
      await fetch('/api/user/subscribe', {
        method: 'POST',
        body: JSON.stringify(sub),
        headers: { 'Content-Type': 'application/json' }
      });
      console.log("Successfully subscribed");
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

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw1.js').catch(console.error);
    }
    adService.current = new RewardedAdService();
    loadShopData();
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isWaiting) {
      setCountdown(10);
      interval = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(interval);
            handleClaimReward();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isWaiting]);

  if (loading) return <div className="min-h-screen bg-black text-white flex items-center justify-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-black text-white p-6">
      {notification && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-amber-600 px-6 py-3 rounded-full shadow-lg">
          {notification}
        </div>
      )}

      <div className="max-w-7xl mx-auto">
        <div className="mb-12 text-center border border-gray-800 p-8 rounded-3xl bg-gray-900/30">
          <button 
            onClick={async () => { 
              setIsWaiting(true);
              await registerPushSubscription();
              adService.current?.showAd(user?.email || "anon"); 
            }}
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