"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, X, ChevronDown, Smartphone } from "lucide-react";
import ErrorDialog from "@/components/ErrorDialog";
import Notification from '@/components/Notification';
import { RewardedAdService } from '@/lib/adService';
import type { Pack } from "@prisma/client";
import { notificationService } from '@/lib/notificationService';

// --- Notification Buff Definitions ---
interface BuffDetails {
  title: string;
  description: string;
  icon: string;
  color: string;
}

const BUFF_MAP: Record<string, BuffDetails> = {
  coin_grant_100: { title: "+100 Coins Claimed!", description: "Coins have been credited to your balance.", icon: "🪙", color: "text-yellow-400" },
  coin_grant_150: { title: "+150 Coins Claimed!", description: "Coins have been credited to your balance.", icon: "🪙", color: "text-yellow-400" },
  coin_grant_200: { title: "+200 Coins Claimed!", description: "Coins have been credited to your balance.", icon: "🪙", color: "text-yellow-400" },
  coin_grant_250: { title: "+250 Coins Claimed!", description: "Coins have been credited to your balance.", icon: "🪙", color: "text-yellow-400" },
  coin_grant_300: { title: "+300 Coins Claimed!", description: "Coins have been credited to your balance.", icon: "🪙", color: "text-yellow-400" },
  coin_grant_500: { title: "+500 Coins Claimed!", description: "Mega drop! Coins added to your account.", icon: "💎", color: "text-blue-400" },
  "luck_boost_1.5x": { title: "1.5x Luck Active!", description: "Your mythic pack odds are boosted by 1.5x on your next opening!", icon: "🍀", color: "text-green-400" },
  luck_boost_2x: { title: "Double Luck Active!", description: "2x Pack Luck active! Open a pack now to use it.", icon: "🍀", color: "text-green-500" },
  luck_boost_3x: { title: "3x Mythic Luck Active!", description: "Unbelievable luck active! Open a mythic pack now.", icon: "🦄", color: "text-purple-400" },
  discount_10: { title: "10% Discount Unlocked!", description: "Enjoy 10% off all packs on your next open.", icon: "🔥", color: "text-red-400" },
  discount_15: { title: "15% Discount Unlocked!", description: "Enjoy 15% off all packs on your next open.", icon: "🔥", color: "text-red-400" },
  discount_20: { title: "20% Discount Unlocked!", description: "Massive 20% discount active for your next pack!", icon: "🔥", color: "text-red-500" },
  exclusive_pack: { title: "Exclusive Pack Unlocked!", description: "A special vault pack has been unlocked in your shop!", icon: "📦", color: "text-indigo-400" },
  xp_boost_2x: { title: "2x XP Buff Active!", description: "Earn double experience progression for your level!", icon: "👑", color: "text-orange-400" }
};

// Import our notification service
export default function ShopPage() {
  // --- States ---
  interface PackBasic {
    id: string;
    name: string;
    price: number;
  }

  const [packs, setPacks] = useState<PackBasic[]>([]);
  const [user, setUser] = useState<{ id?: string; email?: string; balance?: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [isWaiting, setIsWaiting] = useState(false);
  const [countdown, setCountdown] = useState(10);
  const [showAdModal, setShowAdModal] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isOpening, setIsOpening] = useState(false);  
  
  const [isStandalone, setIsStandalone] = useState(true);
  const [isIOS, setIsIOS] = useState(false);
  
  const [openQuantity, setOpenQuantity] = useState(1);
  const [wonItems, setWonItems] = useState<{ name: string; rarity?: string; value?: number }[]>([]);
  
  const [errorDialog, setErrorDialog] = useState<{ message: string } | null>(null);
  const [notification, setNotification] = useState<{ message: string; type?: 'success' | 'error' } | null>(null);
  const [isFlashSaleActive, setIsFlashSaleActive] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">("default");
  const [showBanner, setShowBanner] = useState(true);

  // --- Active Gameplay Buff States ---
  const [activeDiscount, setActiveDiscount] = useState<number>(0); 
  const [activeLuck, setActiveLuck] = useState<number>(1); 
  const [hasExclusivePack, setHasExclusivePack] = useState<boolean>(false);
  const [packError, setPackError] = useState<string | null>(null);
  const [activeXpBoost, setActiveXpBoost] = useState<boolean>(false);

  // --- Refs ---
  const userIdRef = useRef<string | undefined>(undefined);
  const targetTimeRef = useRef<number | null>(null);
  const timerCompletedRef = useRef(false);
  const adService = useRef<RewardedAdService | null>(null);

  // --- Core Logic ---
  const fetchUserData = useCallback(async () => {
    try {
      const res = await fetch(`/api/user/profile?t=${Date.now()}`);
      if (res.ok) {
        const userData = await res.json();
        setUser(userData);
        userIdRef.current = userData?.id;
        window.dispatchEvent(new CustomEvent('balanceUpdated', { detail: { balance: userData.balance } }));
        return userData;
      }
    } catch (err) { console.error("Failed to refresh user:", err); }
    return null;
  }, []);

  // --- Buff Application Logic ---
  const applyBuff = useCallback(async (buff: string) => {
    if (!buff) return;
    console.log("Applying buff from URL:", buff);

    if (buff.startsWith('discount_')) {
      const val = parseInt(buff.split('_')[1]) / 100;
      setActiveDiscount(val);
    } else if (buff.startsWith('luck_boost_')) {
      const val = parseFloat(buff.replace('luck_boost_', '').replace('x', ''));
      setActiveLuck(val || 1);
    } else if (buff === 'exclusive_pack') {
      setHasExclusivePack(true);
    } else if (buff === 'xp_boost_2x') {
      setActiveXpBoost(true);
    } else if (buff.startsWith('coin_grant_')) {
      const amount = parseInt(buff.split('_')[2]);
      try {
        await fetch("/api/user/add-coins", { 
          method: "POST", 
          headers: { "Content-Type": "application/json" }, 
          body: JSON.stringify({ amount }) 
        });
        await fetchUserData();
      } catch (err) { console.error("Failed to grant coins from buff:", err); }
    }
  }, [fetchUserData]);

  const handleTimerComplete = useCallback(async () => {
    if (timerCompletedRef.current) return;
    if (!isWaiting || !targetTimeRef.current) return;
    timerCompletedRef.current = true;

    setIsWaiting(false);
    let currentUserId = userIdRef.current;
    targetTimeRef.current = null;

    if (!currentUserId) {
      try {
        const userData = await fetchUserData();
        currentUserId = userData?.id;
        userIdRef.current = currentUserId;
      } catch (err) {
        console.error("Failed to fetch user data for notification:", err);
      }
    }

    if (!currentUserId) {
      console.error("Cannot send notification: User ID not found");
      return;
    }

    try {
      console.log("Sending ad reward notification with ref: reward-claim");
      const response = await fetch("/api/send-notification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: currentUserId,
          title: "Ad Reward Ready!",
          message: "Your 500 coins are waiting. Click to claim!",
          ref: "reward-claim"
        }),
      });
      console.log("Ad reward notification sent:", response);
    } catch (e) {
      console.error("Push notification trigger failed:", e);
    }

    fetch("/api/user/ad-complete", { method: "POST" }).catch(e => console.error("Ad completion sync failed", e));
  }, [isWaiting, fetchUserData]);

  const loadShopData = useCallback(async () => {
    setPackError(null);
    try {
      setLoading(true);
      console.log("[Shop] Loading shop data...");
      
      // Implement an AbortController so the loading screen doesn't freeze forever
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

      // Safe fetching to prevent crashing
      const [userRes, packRes] = await Promise.all([
        fetch("/api/user/profile", { signal: controller.signal }).catch(() => ({ ok: false, status: 500 })),
        fetch("/api/packs", { signal: controller.signal }).catch(() => ({ ok: false, status: 500 })),
      ]);

      clearTimeout(timeoutId);

      // Handle user response
      if (userRes && userRes.ok && typeof (userRes as any).json === 'function') {
        try {
          const userData = await (userRes as any).json();
          setUser(userData);
          userIdRef.current = userData?.id;
          if (userData?.id) {
            try {
              await notificationService.login(userData.id);
            } catch (e) {
              console.error("Notification Login Error:", e);
            }
          }
        } catch (e) {
          console.warn("[Shop] User JSON parse error:", e);
        }
      } else {
        console.warn("[Shop] Failed to fetch user profile properly");
      }

      // Handle pack response
      let mappedPacks: PackBasic[] = [];
      if (packRes && packRes.ok && typeof (packRes as any).json === 'function') {
        try {
          let packData = await (packRes as any).json();
          console.log("[Shop] Raw pack response:", packData);

          let packsArray: any[] = [];
          if (Array.isArray(packData)) {
            packsArray = packData;
          } else if (packData && typeof packData === 'object') {
            if (Array.isArray(packData.packs)) packsArray = packData.packs;
            else if (Array.isArray(packData.data)) packsArray = packData.data;
          }

          mappedPacks = packsArray.map((pack: any) => ({
            id: pack.id,
            name: pack.name,
            price: pack.price
          }));
        } catch (e) {
          console.error("Failed to parse packs JSON", e);
        }
      }

      const fallbackPacks = [
        { id: "76796f88-c7d0-442a-bfeb-380c3863c8b7", name: "Cosmic Vault", price: 1000 },
        { id: "1a91f6e0-03ce-4a1a-aae0-51ca4057ba8f", name: "Starter Cache", price: 100 },
        { id: "5d2b1d7e-0f4d-4425-ba60-a0ddfeed968f", name: "Event Crate", price: 500 },
        { id: "02ada6c5-4bb7-4d2c-953d-3228f28855eb", name: "Void Box", price: 2000 },
        { id: "5fd47c89-8fd5-4946-9f09-00d90055c6e5", name: "Promo Bundle", price: 0 },
      ];

      // Always guarantee packs display to user
      if (mappedPacks.length === 0) {
        console.warn("[Shop] No packs found in DB or network error, using fallback sample data");
        setPacks(fallbackPacks);
      } else {
        setPacks(mappedPacks);
      }
    } catch (err: any) {
      console.error("[Shop] Error in loadShopData:", err);
      // Fallback explicitly to ensure screen never gets stuck in a broken state
      setPacks([
        { id: "76796f88-c7d0-442a-bfeb-380c3863c8b7", name: "Cosmic Vault", price: 1000 },
        { id: "1a91f6e0-03ce-4a1a-aae0-51ca4057ba8f", name: "Starter Cache", price: 100 },
        { id: "5d2b1d7e-0f4d-4425-ba60-a0ddfeed968f", name: "Event Crate", price: 500 },
        { id: "02ada6c5-4bb7-4d2c-953d-3228f28855eb", name: "Void Box", price: 2000 },
        { id: "5fd47c89-8fd5-4946-9f09-00d90055c6e5", name: "Promo Bundle", price: 0 },
      ]);
      setPackError(null);
    } finally {
      setLoading(false);
      console.log("[Shop] Load finished, loading:", false);
    }
  }, []);

  const handleNotificationRouting = useCallback(async (ref: string) => {
    const currentUser = user || await fetchUserData();
    if (!currentUser) return;

    if (["flash-deal", "weekend-sale", "double-coins", "anniversary", "clearance", "night-owl", "classic-flash", "classic-midnight", "classic-golden", "classic-weekend"].includes(ref)) {
      setIsFlashSaleActive(true);
    } else if (["daily-bonus", "level-up", "streak", "classic-streak", "classic-level", "classic-freeroll", "classic-rain"].includes(ref)) {
      try {
        await fetch("/api/user/add-coins", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ amount: 150 }) });
        await fetchUserData();
      } catch (e) { console.error("Auto-claim failed"); }
    } else if (ref === "reward-claim") {
      try {
        console.log("Attempting to claim reward via notification click");
        const response = await fetch("/api/user/add-coins", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ amount: 500, suppressNotification: true })
        });
        console.log("Reward claim response:", response);
        if (!response.ok) {
          const errorData = await response.json();
          console.error("Reward claim failed with error:", errorData);
          throw new Error(errorData.error || "Failed to claim reward");
        }
        await fetchUserData();
        console.log("Reward claimed successfully");
      } catch (e: any) {
        console.error("Reward claim failed:", e);
        setErrorDialog({ message: "Failed to claim reward: " + (e.message || "Unknown error") });
      }
    } else if (["vault-drop", "mystery-box", "surprise", "classic-mystery", "classic-key"].includes(ref)) {
      setShowAdModal(true);
    } else if (["new-item", "best-seller", "refresh", "seasonal", "classic-weekly", "classic-collector", "classic-inventory"].includes(ref)) {
      loadShopData();
    }
  }, [fetchUserData, loadShopData, user]);

  const handleEnableNotifications = async () => {
    if (!("Notification" in window)) {
      setPermission("unsupported");
      return;
    }
    try {
      const status = await notificationService.requestPermission();
      setPermission(status ? "granted" : "denied");
      if (status && userIdRef.current) await notificationService.login(userIdRef.current);
    } catch (err) { console.error("Notification Permission Request Error: ", err); }
  };

  const handleWatchAdClick = async (amount: number) => {
    timerCompletedRef.current = false;
    targetTimeRef.current = Date.now() + 10000;
    setCountdown(10);
    setIsWaiting(true);

    if (!adService.current) {
      console.error("Ad service not initialized");
      setIsWaiting(false);
      return;
    }

    adService.current.showAd(user?.email || "anon");

    if ("serviceWorker" in navigator) {
      try {
        const registration = await navigator.serviceWorker.ready;
        if (registration.active) {
          registration.active.postMessage({
            type: "START_BACKGROUND_TIMER", delay: 10000, amount: amount, url: `${window.location.origin}/shop?ref=reward-claim`
          });
        }
      } catch (err) { console.error("Service Worker not ready for messaging:", err); }
    }
  };

  const handleOpenPack = async (packId: string) => {
    if (packId === "exclusive_vault_pack") {
      setIsOpening(true);
      try {
        const res = await fetch("/api/packs/open", {
          method: "POST",
          body: JSON.stringify({ packId, quantity: openQuantity, isFlashSale: false, activeDiscount: 0, activeLuck: 1 }),
          headers: {"Content-Type": "application/json"}
        });
        const data = await res.json();

        await new Promise(resolve => setTimeout(resolve, 2000));

        if (res.ok) {
          setWonItems(data.wonItems);
          await fetchUserData();
          setHasExclusivePack(false);
        } else {
          setErrorDialog({ message: data.error || "Failed to open pack" });
        }
      } catch (err) { setErrorDialog({ message: "Network error occurred" }); }
      finally { setIsOpening(false); }
      return;
    }

    const pack = packs.find(p => p.id === packId);
    if (!pack) return;

    const basePrice = pack ? (typeof pack.price === 'string' ? parseInt(pack.price) : pack.price) : 0;

    let discountMultiplier = 1;
    if (isFlashSaleActive && pack.id !== "exclusive_vault_pack") discountMultiplier = 0.5;
    else if (activeDiscount > 0 && pack.id !== "exclusive_vault_pack") discountMultiplier = 1 - activeDiscount;

    const finalPrice = Math.floor(basePrice * discountMultiplier);
    const totalCost = finalPrice * openQuantity;

    if (user && (user.balance ?? 0) < totalCost) {
      setErrorDialog({ message: "Insufficient coins! Wait for drops." });
      return;
    }

    setIsOpening(true);
    try {
      const res = await fetch("/api/packs/open", {
        method: "POST",
        body: JSON.stringify({ packId, quantity: openQuantity, isFlashSale: isFlashSaleActive, activeDiscount, activeLuck }),
        headers: {"Content-Type": "application/json"}
      });
      const data = await res.json();

      await new Promise(resolve => setTimeout(resolve, 2000));

      if (res.ok) {
        setWonItems(data.wonItems);
        await fetchUserData();
        if (activeDiscount > 0) setActiveDiscount(0);
        if (activeLuck > 1) setActiveLuck(1);
      } else {
        setErrorDialog({ message: data.error || "Failed to open pack" });
      }
    } catch (err) { setErrorDialog({ message: "Network error occurred" }); }
    finally { setIsOpening(false); }
  };

  // --- Effects ---
  
  // Isolate Shop loading logic into its own effect to avoid reloading when timers update
  useEffect(() => {
    if (typeof window !== "undefined") {
      const is_ios = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
      const is_standalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true;
      setIsIOS(is_ios);
      setIsStandalone(is_standalone);
      if (!("Notification" in window)) setPermission("unsupported");
      else setPermission((window as any).Notification.permission);
    }
    loadShopData();
  }, [loadShopData]);

  // Handle Event listeners independently
  useEffect(() => {
    adService.current = new RewardedAdService();
    
    const handleServiceWorkerMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === "BACKGROUND_TIMER_COMPLETE") handleTimerComplete();
    };
    navigator.serviceWorker?.addEventListener("message", handleServiceWorkerMessage);
    const openModal = () => { setShowAdModal(true); };
    window.addEventListener("openBalanceModal", openModal);

    return () => {
      navigator.serviceWorker?.removeEventListener("message", handleServiceWorkerMessage);
      window.removeEventListener("openBalanceModal", openModal);
    };
  }, [handleTimerComplete]);

  // COMBINED URL PARAMETER HANDLER - Fixed useSearchParams crash
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!loading && searchParams) {
      const ref = searchParams.get("ref");
      const buff = searchParams.get("buff");

      if (ref) handleNotificationRouting(ref);
      if (buff) applyBuff(buff);

      if (ref || buff) {
        const params = new URLSearchParams(searchParams.toString());
        params.delete('ref');
        params.delete('buff');
        if (params.toString()) {
          window.history.replaceState({}, document.title, `${window.location.pathname}?${params.toString()}`);
        } else {
          window.history.replaceState({}, document.title, window.location.pathname);
        }
      }
    }
  }, [loading, searchParams, handleNotificationRouting, applyBuff]);

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

  // Debugging logs to see data
  useEffect(() => {
    console.log("Packs:", packs);
    // For debugging, define displayPacks again here
    const displayPacks = hasExclusivePack
      ? [...packs, { id: "exclusive_vault_pack", name: "🔥 Secret Vault Pack", price: 0 } as PackBasic]
      : packs;
    console.log("Display Packs:", displayPacks);
  }, [packs, hasExclusivePack]);

  const getRarityStyles = (rarity?: string) => {
    const r = rarity?.toLowerCase() || "common";
    if (r.includes("legend") || r.includes("mythic") || r.includes("omega")) return { bg: "bg-yellow-500/10", border: "border-yellow-400", text: "text-yellow-400", glow: "from-yellow-400/40", shadow: "shadow-[0_0_40px_rgba(250,204,21,0.4)]" };
    if (r.includes("epic") || r.includes("void")) return { bg: "bg-purple-500/10", border: "border-purple-400", text: "text-purple-400", glow: "from-purple-500/40", shadow: "shadow-[0_0_40px_rgba(168,85,247,0.4)]" };
    if (r.includes("rare") || r.includes("galactic")) return { bg: "bg-blue-500/10", border: "border-blue-400", text: "text-blue-400", glow: "from-blue-500/40", shadow: "shadow-[0_0_40px_rgba(59,130,246,0.4)]" };
    return { bg: "bg-zinc-800/50", border: "border-zinc-500/50", text: "text-zinc-300", glow: "from-zinc-500/20", shadow: "shadow-xl" };
  };

  const displayPacks = hasExclusivePack
    ? [ ...packs, { id: "exclusive_vault_pack", name: "🔥 Secret Vault Pack", price: 0 } as PackBasic ]
    : packs;

  // Show loading or error
  if (loading) return <div className="min-h-screen bg-[#070707]" />;
  if (packError) return <div className="min-h-screen flex h-[64vh] items-center justify-center bg-[#070707] text-red-400 text-center p-4">{packError}</div>;

  return (
    <div className="min-h-screen bg-[#070707] text-white p-2 md:p-6 font-sans relative pb-24 overflow-hidden">
      
      {/* Debug info */}
      <div className="mb-4 text-center text-xs text-gray-400">
        Debug: {displayPacks.length} packs to display (hasExclusivePack: {hasExclusivePack ? 'true' : 'false'})
      </div>
      
      {/* PACKS DISPLAY LOG */}
      <div>
        <h2 className="text-white mb-4">Packs Data:</h2>
        <pre className="text-xs bg-black/50 p-2 rounded">{JSON.stringify(packs, null, 2)}</pre>
        <h2 className="text-white mb-4 mt-4">Display Packs:</h2>
        <pre className="text-xs bg-black/50 p-2 rounded">{JSON.stringify(displayPacks, null, 2)}</pre>
      </div>

      {/* ... Rest of your code remains unchanged ... */}

      {/* PACK OPENING ANIMATION OVERLAY */}
      <AnimatePresence>
        {isOpening && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-black/95 backdrop-blur-xl pointer-events-auto"
          >
            <motion.div 
              animate={{ 
                rotate: [0, -10, 10, -10, 10, 0], 
                scale: [1, 1.1, 1],
              }}
              transition={{ duration: 0.8, repeat: Infinity, ease: "easeInOut" }}
              className="text-8xl mb-8"
            >
              🎁
            </motion.div>
            <h2 className="text-2xl font-black tracking-widest text-white uppercase animate-pulse">
              Opening Packs...
            </h2>
            <div className="w-64 h-1.5 bg-white/10 mt-6 rounded-full overflow-hidden">
              <motion.div 
                className="h-full bg-amber-500"
                initial={{ width: "0%" }}
                animate={{ width: "100%" }}
                transition={{ duration: 2, ease: "linear" }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* WINNING ANIMATION OVERLAY */}
      <AnimatePresence>
        {wonItems.length > 0 && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} 
            className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/90 backdrop-blur-3xl p-6 overflow-hidden cursor-pointer pointer-events-auto" 
            onClick={() => setWonItems([])}
          >
            <button 
                onClick={(e) => { e.stopPropagation(); setWonItems([]); }}
                className="absolute top-6 right-6 p-4 bg-white/10 rounded-full hover:bg-white/20 transition-all"
            >
                <X size={24} />
            </button>

            <motion.div 
              initial={{ scale: 0 }} animate={{ scale: 1 }}
              className="absolute w-[600px] h-[600px] bg-indigo-500/20 blur-[150px] rounded-full pointer-events-none" 
            />

            <motion.div 
              initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
              className="relative z-10 w-full max-w-5xl flex flex-col items-center"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-5xl md:text-7xl font-black mb-12 text-white uppercase tracking-tighter drop-shadow-[0_0_15px_rgba(255,255,255,0.5)] text-center">
                You Won!
              </h2>
              
              <div className="flex flex-wrap justify-center items-center gap-4 md:gap-6 w-full px-4">
                {wonItems.map((item, idx) => {
                  const theme = getRarityStyles(item.rarity);
                  return (
                    <motion.div 
                      key={idx} 
                      initial={{ rotateX: -90, opacity: 0 }} 
                      animate={{ rotateX: 0, opacity: 1 }} 
                      transition={{ delay: idx * 0.15, type: "spring", stiffness: 200 }}
                      className={`group relative w-full max-w-[280px] bg-black/40 border border-white/10 backdrop-blur-xl p-6 rounded-3xl flex flex-col items-center text-center shadow-2xl overflow-hidden ${theme.border}`}
                    >
                      <div className={`absolute inset-0 bg-gradient-to-br ${theme.glow} opacity-20 group-hover:opacity-40 transition-opacity`} />
                      
                      <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${theme.text} mb-3`}>
                        {item.rarity || "COMMON"}
                      </span>
                      
                      <p className="font-extrabold text-lg md:text-xl text-white mb-4 line-clamp-2">
                        {item.name}
                      </p>
                      
                      <div className="mt-auto px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-white font-bold text-xs tracking-wider">
                        {item.value?.toLocaleString()} COINS
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              <motion.button 
                initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
                whileHover={{ scale: 1.05, boxShadow: "0 0 30px rgba(255,255,255,0.4)" }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setWonItems([])} 
                className="mt-12 px-12 py-4 bg-white text-black font-black text-lg rounded-2xl transition-all hover:bg-amber-400"
              >
                COLLECT REWARDS
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-amber-500/5 blur-[120px] rounded-full pointer-events-none" />

      {isIOS && !isStandalone && (
        <div className="mb-4 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 flex flex-col sm:flex-row items-center gap-3 text-center sm:text-left relative z-10 max-w-4xl mx-auto">
          <Smartphone className="text-amber-500 shrink-0" size={24} />
          <div>
            <h4 className="font-bold text-amber-500 text-sm">Enable Safari Background Alerts</h4>
            <p className="text-xs text-gray-300 mt-1">Tap the <strong className="text-white">Share</strong> button in Safari, then choose <strong className="text-white">"Add to Home Screen"</strong> to receive background timer payouts and free drops!</p>
          </div>
        </div>
      )}

      <AnimatePresence>
        {permission === "default" && showBanner && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, height: 0 }} className="mb-8 relative overflow-hidden rounded-xl border border-white/10 bg-black/40 backdrop-blur-xl p-4 flex flex-col md:flex-row items-center justify-between gap-4 z-10 max-w-4xl mx-auto">
            <div className="absolute inset-0 bg-gradient-to-r from-amber-500/10 to-transparent pointer-events-none" />
            <div className="flex items-center gap-3 relative z-10">
              <div className="p-2 bg-amber-500/20 rounded-lg text-amber-500"><Bell size={20} /></div>
              <div>
                <h4 className="font-bold text-sm">Enable Notifications</h4>
                <p className="text-gray-400 text-xs">Get alerts for shop drops, flash sales, and bonus claims.</p>
              </div>
            </div>
            <div className="flex items-center gap-2 relative z-10 w-full md:w-auto">
              <button onClick={handleEnableNotifications} className="w-full md:w-auto px-4 py-2 text-sm bg-amber-500 hover:bg-amber-400 text-black font-black rounded-lg transition-all shadow-[0_0_15px_rgba(245,158,11,0.4)]">ALLOW ALERTS</button>
              <button onClick={() => setShowBanner(false)} className="p-2 text-gray-500 hover:text-white transition-colors"><X size={18} /></button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showAdModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div className="bg-[#111111] border border-white/10 p-6 rounded-3xl w-full max-w-xs text-center relative overflow-hidden shadow-2xl">
              {isWaiting ? (
                <div className="flex flex-col items-center py-6">
                  <div className="relative w-20 h-20 mb-4 flex items-center justify-center">
                    <svg className="w-full h-full rotate-[-90deg]">
                      <circle cx="40" cy="40" r="36" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-zinc-800" />
                      <motion.circle cx="40" cy="40" r="36" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-amber-500" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 10, ease: "linear" }} />
                    </svg>
                    <span className="absolute text-2xl font-black">{countdown}</span>
                  </div>
                  <h3 className="text-lg font-bold">Watching Ad</h3>
                </div>
              ) : (
                <>
                  <h3 className="text-xl font-black mb-2 tracking-tight">Boost Balance</h3>
                  <button onClick={() => handleWatchAdClick(500)} className="w-full py-3 mt-4 rounded-xl font-black text-sm bg-amber-500/10 border border-amber-500/20 text-amber-500">WATCH AD (500)</button>
                  <button onClick={() => setShowAdModal(false)} className="mt-4 text-xs text-zinc-600">Cancel</button>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto flex flex-col items-center w-full relative z-10 px-2 sm:px-4">
        <motion.h1 
          initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="text-3xl md:text-4xl font-black mb-4 tracking-tighter text-center text-transparent bg-clip-text bg-gradient-to-b from-white to-white/50 drop-shadow-sm"
        >
          VAULT
        </motion.h1>

        {(activeDiscount > 0 || activeLuck > 1 || activeXpBoost) && (
          <div className="flex flex-wrap gap-2 mb-6 justify-center items-center">
            {activeDiscount > 0 && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/10 border border-red-500/20 text-red-400 rounded-full text-[10px] md:text-xs font-bold shadow-[0_0_10px_rgba(239,68,68,0.1)]">
                <span className="animate-pulse">🔥</span> {activeDiscount * 100}% Discount
              </div>
            )}
            {activeLuck > 1 && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500/10 border border-green-500/20 text-green-400 rounded-full text-[10px] md:text-xs font-bold shadow-[0_0_10px_rgba(34,197,94,0.1)]">
                <span className="animate-pulse">🍀</span> {activeLuck}x Luck Boost
              </div>
            )}
            {activeXpBoost && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-500/10 border border-orange-500/20 text-orange-400 rounded-full text-[10px] md:text-xs font-bold shadow-[0_0_10px_rgba(249,115,22,0.1)]">
                <span className="animate-pulse">👑</span> 2x XP Active
              </div>
            )}
          </div>
        )}

        {/* Dropdown for pack quantity */}
        <div className="relative mb-6 z-20">
          <button 
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-2 bg-[#111] border border-white/10 px-4 py-2 rounded-xl hover:bg-[#1a1a1a] transition-all min-w-[160px] justify-between shadow-xl text-sm"
          >
            <span className="font-bold">Open {openQuantity} {openQuantity > 1 ? "Packs" : "Pack"}</span>
            <ChevronDown className={`transition-transform ${isDropdownOpen ? "rotate-180" : ""}`} size={16} />
          </button>
          
          <AnimatePresence>
            {isDropdownOpen && (
              <motion.div 
                initial={{ opacity: 0, y: 5, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 5, scale: 0.95 }}
                className="absolute top-full left-0 w-full mt-2 bg-[#161616] border border-white/10 rounded-xl overflow-hidden shadow-2xl z-50"
              >
                {[1, 3, 6].map((q) => (
                  <button 
                    key={q} 
                    onClick={() => { setOpenQuantity(q); setIsDropdownOpen(false); }}
                    className={`w-full px-4 py-2.5 text-left font-bold text-sm transition-all hover:bg-white/5 ${openQuantity === q ? "text-amber-500 bg-white/5" : "text-white"}`}
                  >
                    Open {q} {q > 1 ? "Packs" : "Pack"}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Pack cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4 w-full">
          {displayPacks.map((pack, idx) => {
            if (!pack || typeof pack !== 'object' || !pack.id) {
              return null;
            }

            const basePrice = typeof pack.price === 'string' ? parseInt(pack.price) : pack.price;

            let discountMultiplier = 1;
            if (isFlashSaleActive && pack.id !== "exclusive_vault_pack") discountMultiplier = 0.5;
            else if (activeDiscount > 0 && pack.id !== "exclusive_vault_pack") discountMultiplier = 1 - activeDiscount;

            const finalPrice = Math.floor(basePrice * discountMultiplier);
            const totalCost = finalPrice * openQuantity;

            return (
              <motion.div
                key={pack.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                whileHover={{ scale: 1.03, translateY: -4 }}
                whileTap={{ scale: 0.97 }}
                className={`
                  w-full bg-[#0c0c0c] border p-4 sm:p-5 rounded-2xl relative overflow-hidden flex flex-col items-center cursor-pointer
                  ${pack.id === "exclusive_vault_pack"
                    ? "border-indigo-500/50 shadow-[0_5px_20px_rgba(99,102,241,0.15)]"
                    : "border-white/10 shadow-lg hover:border-white/30 hover:shadow-[0_5px_20px_rgba(255,255,255,0.05)]"}
                `}
              >
                <div className={`absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b ${pack.id === "exclusive_vault_pack" ? "from-indigo-500/10" : "from-white/5"} to-transparent pointer-events-none`} />

                {isFlashSaleActive && pack.id !== "exclusive_vault_pack" && (
                  <div className="absolute top-3 right-3 bg-red-500 text-black text-[9px] font-black px-2 py-1 rounded-full uppercase shadow-[0_0_10px_rgba(239,68,68,0.5)] animate-pulse z-10">
                    -50%
                  </div>
                )}
                {pack.id === "exclusive_vault_pack" && (
                  <div className="absolute top-3 right-3 bg-indigo-500 text-white text-[9px] font-black px-2 py-1 rounded-full uppercase shadow-[0_0_10px_rgba(99,102,241,0.5)] animate-pulse z-10">
                    LIMITED
                  </div>
                )}
                
                <div className="relative mb-3 mt-2 flex h-[60px] items-center">
                  <div className={`absolute inset-0 blur-xl opacity-40 ${pack.id === "exclusive_vault_pack" ? "bg-indigo-500" : "bg-white"}`}></div>
                  <div className="relative z-10 flex items-center justify-center w-full">
                    <span className="text-4xl drop-shadow-xl filter hover:brightness-125 transition-all">
                      {pack.id === "exclusive_vault_pack" ? "📦" : "🎁"}
                    </span>
                  </div>
                </div>
                
                <h3 className="font-black text-sm md:text-base mb-4 text-center tracking-wide z-10 leading-tight min-h-[40px] flex items-center justify-center">
                  {typeof pack.name === 'object' || typeof pack.name === 'function'
                    ? 'Unknown Pack'
                    : pack.name}
                </h3>
                
                <button 
                  onClick={() => handleOpenPack(pack.id)} 
                  className={`w-full py-2.5 rounded-lg font-black text-xs transition-all z-10 ${
                    pack.id === "exclusive_vault_pack"
                      ? "bg-indigo-600 hover:bg-indigo-500 text-white shadow-[0_0_15px_rgba(99,102,241,0.3)]"
                      : "bg-white hover:bg-amber-400 text-black shadow-[0_0_15px_rgba(255,255,255,0.1)] hover:shadow-[0_0_20px_rgba(251,191,36,0.4)]"
                  }`}
                >
                  {pack.id === "exclusive_vault_pack"
                    ? "CLAIM (FREE)"
                    : `${totalCost.toLocaleString()} 🪙`
                  }
                </button>
              </motion.div>
            );
          })}
        </div>
      </div>

      {notification && <Notification message={notification.message} type={notification.type} onClose={() => setNotification(null)} />}
      {errorDialog && <ErrorDialog message={errorDialog.message} onClose={() => setErrorDialog(null)} />}
    </div>
  );
}
