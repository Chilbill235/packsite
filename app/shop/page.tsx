"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, X, ChevronDown, Smartphone } from "lucide-react";
import ErrorDialog from "@/components/ErrorDialog";
import { RewardedAdService } from '@/lib/adService';
import type { PackWithItems } from "@/types";
import OneSignal from "react-onesignal";

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

  // --- Active Gameplay Buff States ---
  const [activeReward, setActiveReward] = useState<BuffDetails | null>(null);
  const [activeDiscount, setActiveDiscount] = useState<number>(0); 
  const [activeLuck, setActiveLuck] = useState<number>(1); 
  const [hasExclusivePack, setHasExclusivePack] = useState<boolean>(false);
  const [activeXpBoost, setActiveXpBoost] = useState<boolean>(false);

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
      
      if (userRes.ok) {
        const userData = await userRes.json();
        setUser(userData);
        
        if (userData?.id) {
          try {
            await OneSignal.login(userData.id);
          } catch (e) {
            console.error("OneSignal Login Error:", e);
          }
        }
      }
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
    if (["flash-deal", "weekend-sale", "double-coins", "anniversary", "clearance", "night-owl", "classic-flash", "classic-midnight", "classic-golden", "classic-weekend"].includes(ref)) {
      setIsFlashSaleActive(true);
    } else if (["daily-bonus", "level-up", "streak", "classic-streak", "classic-level", "classic-freeroll", "classic-rain"].includes(ref)) {
      try {
        await fetch("/api/user/add-coins", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ amount: 150 }) });
        await fetchUserData();
      } catch (e) { console.error("Auto-claim failed"); }
    } else if (["reward-claim", "vault-drop", "mystery-box", "surprise", "classic-mystery", "classic-key"].includes(ref)) {
      setShowAdModal(true);
      if (ref === "reward-claim") {
          setTimeout(() => handleClaimReward(), 500);
      }
    } else if (["new-item", "best-seller", "refresh", "seasonal", "classic-weekly", "classic-collector", "classic-inventory"].includes(ref)) {
      loadShopData();
    }
  }, [fetchUserData, handleClaimReward, loadShopData]);

  const applyBuffEffect = useCallback(async (ref: string, buff: string) => {
    if (!BUFF_MAP[buff]) return;
    const selectedBuff = BUFF_MAP[buff];

    if (buff.startsWith("discount_")) {
      const val = parseInt(buff.split("_")[1]);
      setActiveDiscount(val / 100);
    } else if (buff.startsWith("luck_boost_")) {
      const valStr = buff.replace("luck_boost_", "").replace("x", "");
      setActiveLuck(parseFloat(valStr));
    } else if (buff === "exclusive_pack") {
      setHasExclusivePack(true);
    } else if (buff === "xp_boost_2x") {
      setActiveXpBoost(true);
    }

    try {
      const res = await fetch("/api/rewards/apply-buff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ buffType: buff, refSource: ref })
      });
      if (res.ok) {
        setActiveReward(selectedBuff);
        await fetchUserData(); 
      }
    } catch (err) {
      console.error("Failed to apply notification reward:", err);
    }
  }, [fetchUserData]);

  const handleEnableNotifications = async () => {
    if (!("Notification" in window)) {
      setPermission("unsupported");
      return;
    }
    try {
      const status = await OneSignal.Notifications.requestPermission();
      setPermission(status ? "granted" : "denied");
      if (status && user?.id) await OneSignal.login(user.id);
    } catch (err) { console.error("OneSignal Permission Request Error: ", err); }
  };

  const handleWatchAdClick = async (amount: number) => {
    sessionStorage.setItem('pendingRewardAmount', amount.toString());
    targetTimeRef.current = Date.now() + 10000;
    setCountdown(10);
    setIsWaiting(true);
    setHasDispatchedPush(false);
    
    adService.current?.showAd(user?.email || "anon");

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
    try {
      const res = await fetch("/api/packs/open", { 
        method: "POST", 
        body: JSON.stringify({ packId, quantity: openQuantity, isFlashSale: isFlashSaleActive, activeDiscount, activeLuck }), 
        headers: {"Content-Type": "application/json"} 
      });
      const data = await res.json();
      if (res.ok) {
        setWonItems(data.wonItems || [data.wonItem]); 
        await fetchUserData(); 
        if (activeDiscount > 0) setActiveDiscount(0);
        if (activeLuck > 1) setActiveLuck(1);
        if (packId === "exclusive_vault_pack") setHasExclusivePack(false);
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
      const buff = params.get("buff");
      if (ref && !buff) {
        handleNotificationRouting(ref);
        const cleanParams = new URLSearchParams(window.location.search);
        cleanParams.delete("ref");
        const cleanPath = window.location.pathname + (cleanParams.toString() ? `?${cleanParams.toString()}` : "");
        window.history.replaceState({}, document.title, cleanPath);
      }
    }
  }, [loading, handleNotificationRouting]);

  useEffect(() => {
    if (typeof window === "undefined" || loading || !user) return;
    const params = new URLSearchParams(window.location.search);
    const ref = params.get("ref");
    const buff = params.get("buff");
    if (ref && buff && BUFF_MAP[buff]) {
      applyBuffEffect(ref, buff);
      const cleanParams = new URLSearchParams(window.location.search);
      cleanParams.delete("ref");
      cleanParams.delete("buff");
      const cleanPath = window.location.pathname + (cleanParams.toString() ? `?${cleanParams.toString()}` : "");
      window.history.replaceState({}, document.title, cleanPath);
    }
  }, [loading, user, applyBuffEffect]);

  useEffect(() => {
    if (loading || !user) return;
    let nextTimeoutId: NodeJS.Timeout;

    const triggerNotification = () => {
      const refs = ["flash-deal", "reward-claim", "daily-bonus", "new-item", "vault-drop", "classic-flash", "classic-midnight", "classic-golden", "classic-weekend"];
      const randomRef = refs[Math.floor(Math.random() * refs.length)];
      const buffs = Object.keys(BUFF_MAP);
      const randomBuff = buffs[Math.floor(Math.random() * buffs.length)];
      const buffDetails = BUFF_MAP[randomBuff];

      if (Notification.permission === "granted") {
        const notification = new Notification(buffDetails.title, { body: buffDetails.description, icon: "/favicon.ico" });
        notification.onclick = () => { window.focus(); applyBuffEffect(randomRef, randomBuff); };
      } else {
        applyBuffEffect(randomRef, randomBuff);
      }
      const tenMinutesInMs = 600000;
      const deviation = (Math.random() * 60000) - 30000; 
      nextTimeoutId = setTimeout(triggerNotification, tenMinutesInMs + deviation);
    };

    nextTimeoutId = setTimeout(triggerNotification, Math.random() * 120000);
    return () => clearTimeout(nextTimeoutId);
  }, [loading, user, applyBuffEffect]);

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

  // Enhanced Rarity Styles
  const getRarityStyles = (rarity?: string) => {
    const r = rarity?.toLowerCase() || "common";
    if (r.includes("legend") || r.includes("mythic") || r.includes("omega")) return { bg: "bg-yellow-500/10", border: "border-yellow-400", text: "text-yellow-400", glow: "from-yellow-400/40", shadow: "shadow-[0_0_40px_rgba(250,204,21,0.4)]" };
    if (r.includes("epic") || r.includes("void")) return { bg: "bg-purple-500/10", border: "border-purple-400", text: "text-purple-400", glow: "from-purple-500/40", shadow: "shadow-[0_0_40px_rgba(168,85,247,0.4)]" };
    if (r.includes("rare") || r.includes("galactic")) return { bg: "bg-blue-500/10", border: "border-blue-400", text: "text-blue-400", glow: "from-blue-500/40", shadow: "shadow-[0_0_40px_rgba(59,130,246,0.4)]" };
    return { bg: "bg-zinc-800/50", border: "border-zinc-500/50", text: "text-zinc-300", glow: "from-zinc-500/20", shadow: "shadow-xl" };
  };

  const displayPacks = hasExclusivePack 
    ? [ ...packs, { id: "exclusive_vault_pack", name: "🔥 Secret Vault Pack", price: 0, description: "An exclusive pack hidden away.", image: "/images/vault-pack.png", category: "exclusive", items: [] } as PackWithItems ] 
    : packs;

  if (loading) return <div className="min-h-screen bg-[#070707]" />;

  return (
    <div className="min-h-screen bg-[#070707] text-white p-2 md:p-6 font-sans relative pb-24 overflow-hidden">
      
      {/* Background Ambient Glow */}
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

      {/* Ad Modal */}
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
              ) : !hasDispatchedPush ? (
                <>
                  <h3 className="text-xl font-black mb-2 tracking-tight">Boost Balance</h3>
                  <button onClick={() => handleWatchAdClick(500)} className="w-full py-3 mt-4 rounded-xl font-black text-sm bg-amber-500/10 border border-amber-500/20 text-amber-500">WATCH AD (500)</button>
                  <button onClick={() => setShowAdModal(false)} className="mt-4 text-xs text-zinc-600">Cancel</button>
                </>
              ) : (
                <div className="py-4">
                  <div className="text-4xl mb-3 animate-bounce">🔔</div>
                  <h3 className="text-lg font-bold">Notification Sent!</h3>
                  <button onClick={() => setShowAdModal(false)} className="mt-4 w-full py-2.5 bg-white text-black text-sm font-black rounded-lg">Close</button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FIXED MOBILE RESPONSIVE WON ITEMS MODAL */}
      <AnimatePresence>
        {wonItems.length > 0 && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} 
            className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/95 backdrop-blur-2xl p-4" 
            onClick={() => setWonItems([])}
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 30 }} 
              animate={{ scale: 1, opacity: 1, y: 0 }} 
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="w-full max-w-3xl flex flex-col items-center" 
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-center text-2xl md:text-4xl font-black mb-4 md:mb-6 uppercase tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-amber-500 drop-shadow-lg">
                You Won!
              </h2>
              
              {/* Responsive Compact Grid */}
              <div className={`grid ${wonItems.length === 1 ? 'grid-cols-1 max-w-[220px]' : 'grid-cols-2 md:grid-cols-3'} gap-2 md:gap-4 w-full mx-auto`}>
                {wonItems.map((item, idx) => {
                  const theme = getRarityStyles(item.rarity);
                  return (
                    <motion.div 
                      key={idx} 
                      initial={{ scale: 0.8, opacity: 0, y: 20 }} 
                      animate={{ scale: 1, opacity: 1, y: 0 }} 
                      transition={{ delay: idx * 0.05, type: "spring", stiffness: 300, damping: 20 }} 
                      className={`w-full aspect-square md:aspect-auto md:min-h-[160px] ${theme.bg} border-2 ${theme.border} p-3 rounded-2xl flex flex-col items-center justify-center text-center relative overflow-hidden ${theme.shadow}`}
                    >
                      <div className={`absolute top-0 left-0 w-full h-full bg-gradient-to-b ${theme.glow} to-transparent opacity-60`} />
                      
                      {/* Inner Item Content */}
                      <div className="relative z-10 flex flex-col items-center justify-center w-full h-full">
                        <span className={`text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] ${theme.text} mb-1`}>
                          {item.rarity || "COMMON"}
                        </span>
                        <p className="font-extrabold text-sm md:text-base text-white mb-2 leading-tight line-clamp-2 px-1">
                          {item.name}
                        </p>
                        <p className="text-white/80 bg-black/40 px-2 py-0.5 rounded-full font-bold text-[9px] md:text-xs mt-auto backdrop-blur-md border border-white/10">
                          {item.value?.toLocaleString()} COINS
                        </p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              <motion.button 
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: wonItems.length * 0.1 + 0.1 }}
                onClick={() => setWonItems([])} 
                className="mt-6 md:mt-8 w-full max-w-[220px] block py-3 bg-white text-black hover:bg-gray-200 rounded-xl font-black text-sm transition-all shadow-[0_0_20px_rgba(255,255,255,0.2)] active:scale-95"
              >
                COLLECT ALL
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Notification Reward / Buff Pop-up Modal */}
      <AnimatePresence>
        {activeReward && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} 
            className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4"
            onClick={() => setActiveReward(null)}
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              className="bg-[#111115] border border-zinc-800 p-6 rounded-3xl max-w-sm w-full text-center shadow-2xl relative overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="absolute -inset-10 bg-gradient-to-r from-violet-600/20 to-indigo-600/20 blur-3xl opacity-50 pointer-events-none" />
              <div className="text-5xl mb-3 animate-bounce select-none">{activeReward.icon}</div>
              <h3 className={`text-xl font-black ${activeReward.color} mb-2 tracking-tight`}>{activeReward.title}</h3>
              <p className="text-zinc-400 text-sm mb-5 leading-relaxed">{activeReward.description}</p>
              <button onClick={() => setActiveReward(null)} className="w-full py-3 px-6 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 font-bold text-black text-sm shadow-lg transition-all active:scale-95 duration-100">
                Let's Go! 🚀
              </button>
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

        {/* Active Buffs Status Banner */}
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
        
        {/* Quantity Dropdown */}
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
        
        {/* Pack Grid - Now COMPACT to eliminate scrolling */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4 w-full">
          {displayPacks.map((pack, idx) => {
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
                className={`w-full bg-[#0c0c0c] border p-4 sm:p-5 rounded-2xl relative overflow-hidden flex flex-col items-center cursor-pointer ${
                  pack.id === "exclusive_vault_pack"
                    ? "border-indigo-500/50 shadow-[0_5px_20px_rgba(99,102,241,0.15)]"
                    : "border-white/10 shadow-lg hover:border-white/30 hover:shadow-[0_5px_20px_rgba(255,255,255,0.05)]"
                }`}
              >
                {/* Internal Glow Effect */}
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
                
                <div className="relative mb-3 mt-2">
                  <div className={`absolute inset-0 blur-xl opacity-40 ${pack.id === "exclusive_vault_pack" ? "bg-indigo-500" : "bg-white"}`} />
                  <div className="text-4xl relative z-10 drop-shadow-xl filter hover:brightness-125 transition-all">
                    {pack.id === "exclusive_vault_pack" ? "📦" : "🎁"}
                  </div>
                </div>
                
                <h3 className="font-black text-sm md:text-base mb-4 text-center tracking-wide z-10 leading-tight min-h-[40px] flex items-center justify-center">
                  {pack.name}
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

      {errorDialog && <ErrorDialog message={errorDialog.message} onClose={() => setErrorDialog(null)} />}
    </div>
  );
}