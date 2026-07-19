"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, X, Smartphone } from "lucide-react";
import ErrorDialog from "@/components/ErrorDialog";
import { RewardedAdService } from "@/lib/adService";
import { notificationService } from "@/lib/notificationService";

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

interface PackBasic {
  id: string;
  name: string;
  price: number;
}

interface UserProfile {
  id?: string;
  email?: string;
  balance?: number;
  activeLuck?: number;
  activeDiscount?: number;
  hasExclusivePack?: boolean;
  activeXpBoost?: boolean;
  luckExpiresAt?: string | Date | null;
  discountExpiresAt?: string | Date | null;
  xpBoostExpiresAt?: string | Date | null;
}

interface ApiPack {
  id: string;
  name: string;
  price: number | string;
}

const FALLBACK_PACKS: PackBasic[] = [
  { id: "76796f88-c7d0-442a-bfeb-380c3863c8b7", name: "Cosmic Vault", price: 1000 },
  { id: "1a91f6e0-03ce-4a1a-aae0-51ca4057ba8f", name: "Starter Cache", price: 100 },
  { id: "5d2b1d7e-0f4d-4425-ba60-a0ddfeed968f", name: "Event Crate", price: 500 },
  { id: "02ada6c5-4bb7-4d2c-953d-3228f28855eb", name: "Void Box", price: 2000 },
  { id: "b38e2c41-9d5a-4f17-8c63-7a1f9b4e2d04", name: "Singularity Crate", price: 5000 },
  { id: "5fd47c89-8fd5-4946-9f09-00d90055c6e5", name: "Promo Bundle", price: 0 },
];

const getIsIOS = () => {
  if (typeof window === "undefined") return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !("MSStream" in window);
};

const getIsStandalone = () => {
  if (typeof window === "undefined") return true;
  const navigatorWithStandalone = window.navigator as Navigator & { standalone?: boolean };
  return window.matchMedia("(display-mode: standalone)").matches || navigatorWithStandalone.standalone === true;
};

export default function ShopPage() {
  // --- States ---
  const searchParams = useSearchParams();
  const [packs, setPacks] = useState<PackBasic[]>(FALLBACK_PACKS);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isWaiting, setIsWaiting] = useState(false);
  const [countdown, setCountdown] = useState(10);
  const [showAdModal, setShowAdModal] = useState(false);
  const [isOpening, setIsOpening] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIOS] = useState(getIsIOS);

  const [isFetchingUser, setIsFetchingUser] = useState(false);
  const [isFetchingPacks, setIsFetchingPacks] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    setIsStandalone(getIsStandalone());
  }, []);

  const getInitialNotificationPermission = (): NotificationPermission | "unsupported" => {
    if (typeof window === "undefined" || !("Notification" in window)) return "unsupported";
    return Notification.permission;
  };

  const [openQuantity, setOpenQuantity] = useState(1);
  const [pendingPack, setPendingPack] = useState<PackBasic | null>(null);
  const [modalQuantity, setModalQuantity] = useState(1);
  const [wonItems, setWonItems] = useState<{ name: string; rarity?: string; value?: number }[]>([]);

  const getGridCols = (count: number): number => {
    if (count <= 1) return 1;
    if (count <= 4) return 2;
    if (count <= 9) return 3;
    return 4;
  };

  const [errorDialog, setErrorDialog] = useState<{ message: string } | null>(null);
  const [isFlashSaleActive, setIsFlashSaleActive] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">(getInitialNotificationPermission);
  const [showBanner, setShowBanner] = useState(true);

  // Prevent body scroll when modals are open
  useEffect(() => {
    const shouldLockScroll = wonItems.length > 0 || showAdModal || isOpening || pendingPack;
    
    if (shouldLockScroll) {
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
      document.body.style.touchAction = 'none';
    } else {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
      document.body.style.touchAction = '';
    }
    
    return () => {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
      document.body.style.touchAction = '';
    };
  }, [wonItems.length, showAdModal, isOpening, pendingPack]);

  // --- Active Gameplay Buff States ---
  const [activeDiscount, setActiveDiscount] = useState<number>(0);
  const [activeLuck, setActiveLuck] = useState<number>(1);
  const [hasExclusivePack, setHasExclusivePack] = useState<boolean>(false);
  const [packError, setPackError] = useState<string | null>(null);
  const [activeXpBoost, setActiveXpBoost] = useState<boolean>(false);
  const [adStatus, setAdStatus] = useState<'idle' | 'loading' | 'success' | 'error' | 'completed'>('idle');

  // --- Formatting Time Left Helper ---
  const formatTimeLeft = (expirationTime: string | Date | null | undefined): string => {
    if (!expirationTime) return "";
    const msLeft = new Date(expirationTime).getTime() - Date.now();
    if (msLeft <= 0) return "";

    const secs = Math.floor(msLeft / 1000);
    const mins = Math.floor(secs / 60);
    const hours = Math.floor(mins / 60);

    if (hours > 0) return `${hours}h ${mins % 60}m`;
    if (mins > 0) return `${mins}m ${secs % 60}s`;
    return `${secs}s`;
  };

  const [luckTimeLeft, setLuckTimeLeft] = useState("");
  const [discountTimeLeft, setDiscountTimeLeft] = useState("");
  const [xpTimeLeft, setXpTimeLeft] = useState("");

  // --- Refs ---
  const userIdRef = useRef<string | undefined>(undefined);
  const targetTimeRef = useRef<number | null>(null);
  const timerCompletedRef = useRef(false);
  const adService = useRef<RewardedAdService | null>(null);
  const notificationTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastNotificationTimeRef = useRef<number>(0);
  const initializeFetchGuardRef = useRef(false);

  // --- Core Logic ---
  const syncUserState = useCallback((userData: UserProfile) => {
    setUser((current) => ({ ...current, ...userData }));
    if (userData.id) {
      if (userIdRef.current !== userData.id) {
        userIdRef.current = userData.id;
        notificationService.login(userData.id);
      }
    }

    const now = Date.now();
    
    const luckExpired = userData.luckExpiresAt ? new Date(userData.luckExpiresAt).getTime() <= now : false;
    setActiveLuck(luckExpired ? 1 : (userData.activeLuck ?? 1));

    const discountExpired = userData.discountExpiresAt ? new Date(userData.discountExpiresAt).getTime() <= now : false;
    setActiveDiscount(discountExpired ? 0 : (userData.activeDiscount ?? 0));

    const xpExpired = userData.xpBoostExpiresAt ? new Date(userData.xpBoostExpiresAt).getTime() <= now : false;
    setActiveXpBoost(xpExpired ? false : (userData.activeXpBoost ?? false));

    setHasExclusivePack(userData.hasExclusivePack ?? false);

    if (typeof userData.balance === "number") {
      window.dispatchEvent(new CustomEvent("balanceUpdated", { detail: { balance: userData.balance } }));
    }
  }, []);

  // Live expiration ticker running every second
  useEffect(() => {
    if (!user) return;

    const ticker = setInterval(() => {
      const now = Date.now();
      const dynamicUpdates: Partial<UserProfile> = {};
      let changed = false;

      if (user.luckExpiresAt) {
        const timeStr = formatTimeLeft(user.luckExpiresAt);
        setLuckTimeLeft(timeStr);
        if (new Date(user.luckExpiresAt).getTime() <= now && activeLuck !== 1) {
          setActiveLuck(1);
          dynamicUpdates.activeLuck = 1;
          dynamicUpdates.luckExpiresAt = null;
          changed = true;
        }
      } else {
        setLuckTimeLeft("");
      }

      if (user.discountExpiresAt) {
        const timeStr = formatTimeLeft(user.discountExpiresAt);
        setDiscountTimeLeft(timeStr);
        if (new Date(user.discountExpiresAt).getTime() <= now && activeDiscount !== 0) {
          setActiveDiscount(0);
          dynamicUpdates.activeDiscount = 0;
          dynamicUpdates.discountExpiresAt = null;
          changed = true;
        }
      } else {
        setDiscountTimeLeft("");
      }

      if (user.xpBoostExpiresAt) {
        const timeStr = formatTimeLeft(user.xpBoostExpiresAt);
        setXpTimeLeft(timeStr);
        if (new Date(user.xpBoostExpiresAt).getTime() <= now && activeXpBoost !== false) {
          setActiveXpBoost(false);
          dynamicUpdates.activeXpBoost = false;
          dynamicUpdates.xpBoostExpiresAt = null;
          changed = true;
        }
      } else {
        setXpTimeLeft("");
      }

      if (changed) {
        setUser(curr => curr ? { ...curr, ...dynamicUpdates } : null);
      }
    }, 1000);

    return () => clearInterval(ticker);
  }, [user, activeLuck, activeDiscount, activeXpBoost]);

  const fetchUserData = useCallback(async () => {
    if (isFetchingUser) return null;
    setIsFetchingUser(true);
    try {
      const res = await fetch(`/api/user/profile`);
      if (res.ok) {
        const userData = await res.json() as UserProfile;
        syncUserState(userData);
        return userData;
      }
    } catch (err) { 
      console.error("Failed to refresh user:", err); 
    } finally {
      setIsFetchingUser(false);
    }
    return null;
  }, [syncUserState, isFetchingUser]);

  const applyBuff = useCallback(async (buff: string) => {
    if (!buff) return;
    console.log("Applying buff from URL:", buff);
    if (!BUFF_MAP[buff]) console.warn("Unknown buff type:", buff);
    try {
      const res = await fetch("/api/rewards/apply-buff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ buffType: buff }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to apply reward");
      }

      const data = await res.json();
      syncUserState(data);
    } catch (err) {
      console.error("Failed to apply buff:", err);
      setErrorDialog({ message: err instanceof Error ? err.message : "Failed to apply reward" });
    }
  }, [syncUserState]);

  const handleTimerComplete = useCallback(async () => {
    if (timerCompletedRef.current || !isWaiting) return;

    timerCompletedRef.current = true;
    setIsWaiting(false);
    setAdStatus('success');

    try {
      let currentUserId = userIdRef.current;

      if (!currentUserId) {
        try {
          const userData = await fetchUserData();
          currentUserId = userData?.id;
          if (userData?.id) userIdRef.current = userData.id;
        } catch (err) {
          console.error("Failed to fetch user data for ad reward:", err);
        }
      }

      if (currentUserId) {
        try {
          await fetch("/api/send-notification", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              userId: currentUserId,
              title: "Ad Reward Earned!",
              message: "Your 500 coins are waiting. Tap to claim!",
              ref: "reward-claim"
            }),
          }).catch(err => console.warn("Notification failed (non-critical):", err));
        } catch (notificationError) {
          console.warn("Notification service error:", notificationError);
        }

        const addCoinsResponse = await fetch("/api/user/add-coins", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ amount: 500, suppressNotification: true })
        });

        if (!addCoinsResponse.ok) {
          throw new Error(`Failed to award ad reward: ${addCoinsResponse.status}`);
        }

        await fetchUserData();
        setAdStatus('completed');

        setTimeout(() => {
          setAdStatus('idle');
        }, 3000);
      } else {
        throw new Error("Unable to identify user for reward");
      }
    } catch (error) {
      console.error("Failed to process ad reward:", error);
      setAdStatus('error');
      setErrorDialog({ message: "Failed to process your reward. Please try again." });
      setTimeout(() => {
        setAdStatus('idle');
      }, 3000);
    } finally {
      targetTimeRef.current = null;
      if (isWaiting) setIsWaiting(false);
    }
  }, [isWaiting, fetchUserData]);

  const loadShopData = useCallback(async () => {
    if (isFetchingPacks) return;
    setIsFetchingPacks(true);
    try {
      setPackError(null);
      console.log("[Shop] Loading shop data...");

      try {
        const packRes = await fetch("/api/packs");
        if (packRes.ok) {
          const packData = await packRes.json();
          if (Array.isArray(packData) && packData.length > 0) {
            setPacks(packData.map((pack: ApiPack) => ({
              id: String(pack.id),
              name: String(pack.name),
              price: Number(pack.price) || 0,
            })));
          } else {
            setPacks(FALLBACK_PACKS);
          }
        } else {
          setPacks(FALLBACK_PACKS);
        }
      } catch (packErr) {
        console.warn("[Shop] Failed to fetch packs, using fallback packs:", packErr);
        setPacks(FALLBACK_PACKS);
      }

      await fetchUserData();
    } catch (err) {
      console.error("[Shop] Error in loadShopData:", err);
      setPackError("An error occurred while loading packs");
      setPacks(FALLBACK_PACKS);
    } finally {
      setIsFetchingPacks(false);
    }
  }, [fetchUserData, isFetchingPacks]);

  const handleNotificationRouting = useCallback(async (ref: string) => {
    const currentUser = user || await fetchUserData();
    if (!currentUser) return;

    if (["flash-deal", "weekend-sale", "double-coins", "anniversary", "clearance", "night-owl", "classic-flash", "classic-midnight", "classic-golden", "classic-weekend"].includes(ref)) {
      setIsFlashSaleActive(true);
    } else if (["daily-bonus", "level-up", "streak", "classic-streak", "classic-level", "classic-freeroll", "classic-rain"].includes(ref)) {
      try {
        await fetch("/api/user/add-coins", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ amount: 150 }) });
        await fetchUserData();
      } catch { console.error("Auto-claim failed"); }
    } else if (ref === "reward-claim") {
      try {
        console.log("Handling reward claim notification - awarding coins");
        setAdStatus('completed');
        await fetch("/api/user/add-coins", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ amount: 500, suppressNotification: true }) });
        await fetchUserData();
        setTimeout(() => { setAdStatus('idle'); }, 3000);
      } catch (e) {
        console.error("Reward claim failed:", e);
        setAdStatus('error');
        setTimeout(() => { setAdStatus('idle'); }, 3000);
        setErrorDialog({ message: "Failed to claim reward: " + (e instanceof Error ? e.message : "Unknown error") });
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
      const granted = await notificationService.requestPermission();
      setPermission(granted ? "granted" : "denied");
      if (userIdRef.current && granted) {
        await notificationService.login(userIdRef.current);
      }
    } catch (err) {
      console.error("Notification Permission Request Error: ", err);
      setPermission("denied");
    }
  };

  const handleWatchAdClick = async (amount: number) => {
    if (isWaiting) return;

    timerCompletedRef.current = false;
    targetTimeRef.current = Date.now() + 10000;
    setCountdown(10);
    setIsWaiting(true);
    setAdStatus('loading');

    if (!adService.current) {
      console.error("Ad service not initialized");
      setIsWaiting(false);
      setAdStatus('error');
      return;
    }

    try {
      const adResult = await adService.current.showAd(user?.email || "anon");
      if (adResult && adResult.completed) {
        await handleAdRewarded(amount);
        return;
      }
    } catch (adError) {
      console.error("Ad failed to show or play:", adError);
    }

    if ("serviceWorker" in navigator) {
      try {
        const registration = await navigator.serviceWorker.ready;
        if (registration.active) {
          registration.active.postMessage({
            type: "START_BACKGROUND_TIMER", delay: 10000, amount: amount, url: `${window.location.origin}/shop?ref=reward-claim`
          });
        }
      } catch (err) {
        console.error("Service Worker not ready for messaging:", err);
      }
    }

    const adTimer = setTimeout(() => {
      if (isWaiting) {
        handleAdRewarded(amount);
      }
    }, 10000);
  };

  const handleAdRewarded = useCallback(async (amount: number) => {
    if (timerCompletedRef.current) return;

    timerCompletedRef.current = true;
    setIsWaiting(false);
    setAdStatus('success');
    targetTimeRef.current = null;

    try {
      const userId = userIdRef.current || (await fetchUserData())?.id;
      if (userId) {
        await fetch("/api/send-notification", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: userId,
            title: "Ad Reward Earned!",
            message: `You've earned ${amount} coins!`,
            ref: ""
          }),
        });
      }

      await fetch("/api/user/add-coins", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ amount: 500, suppressNotification: true }) });
      await fetchUserData();
      setAdStatus('completed');
      setTimeout(() => { setAdStatus('idle'); }, 3000);
    } catch (error) {
      console.error("Failed to process ad reward:", error);
      setAdStatus('error');
      setTimeout(() => { setAdStatus('idle'); setIsWaiting(false); }, 5000);
    }
  }, [fetchUserData]);

  const requestOpenPack = (packId: string) => {
    const pack = packs.find((p) => p.id === packId);
    if (!pack && packId !== "exclusive_vault_pack") return;
    const target: PackBasic =
      pack ?? ({ id: "exclusive_vault_pack", name: "🔥 Secret Vault Pack", price: 0 } as PackBasic);
    setModalQuantity(openQuantity > 0 ? openQuantity : 1);
    setPendingPack(target);
  };

  const closePackModal = () => {
    setPendingPack(null);
  };

  const confirmOpenPack = async () => {
    if (!pendingPack) return;
    const packId = pendingPack.id;
    const qty = Math.max(1, modalQuantity | 0);

    const pack = packs.find((p) => p.id === packId);
    if (!pack && packId !== "exclusive_vault_pack") {
      setPendingPack(null);
      return;
    }

    const basePrice = pack ? Number(pack.price) || 0 : 0;
    const isExclusive = packId === "exclusive_vault_pack";

    let discountMultiplier = 1;
    if (isFlashSaleActive && !isExclusive) discountMultiplier = 0.5;
    else if (activeDiscount > 0 && !isExclusive) discountMultiplier = 1 - activeDiscount;

    const finalPrice = Math.floor(basePrice * discountMultiplier);
    const totalCost = finalPrice * qty;

    if (user && (user.balance ?? 0) < totalCost) {
      setErrorDialog({ message: "Insufficient coins! Wait for drops." });
      return;
    }

    setPendingPack(null);
    setOpenQuantity(qty);
    setIsOpening(true);
    try {
      const res = await fetch("/api/packs/open", {
        method: "POST",
        body: JSON.stringify({ packId, quantity: qty, isFlashSale: isFlashSaleActive }),
        headers: { "Content-Type": "application/json" }
      });
      const data = await res.json();

      await new Promise((resolve) => setTimeout(resolve, 2000));

      if (res.ok) {
        setWonItems(Array.isArray(data.wonItems) ? data.wonItems : []);
        syncUserState({
          balance: data.newBalance,
          activeLuck: data.user?.activeLuck ?? 1,
          activeDiscount: data.user?.activeDiscount ?? 0,
          hasExclusivePack: data.user?.hasExclusivePack ?? false,
          activeXpBoost: data.user?.activeXpBoost ?? false,
          luckExpiresAt: data.user?.luckExpiresAt,
          discountExpiresAt: data.user?.discountExpiresAt,
          xpBoostExpiresAt: data.user?.xpBoostExpiresAt
        });
      } else {
        setErrorDialog({ message: data.error || "Failed to open pack" });
      }
    } catch {
      setErrorDialog({ message: "Network error occurred" });
    } finally {
      setIsOpening(false);
    }
  };

  useEffect(() => {
    if (initializeFetchGuardRef.current) return;
    initializeFetchGuardRef.current = true;

    loadShopData();

    adService.current = new RewardedAdService();

    const handleServiceWorkerMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === "BACKGROUND_TIMER_COMPLETE") {
        const amount = event.data.amount || 500;
        handleAdRewarded(amount);
      }
    };
    navigator.serviceWorker?.addEventListener("message", handleServiceWorkerMessage);
    const openModal = () => { setShowAdModal(true); };
    window.addEventListener("openBalanceModal", openModal);

    return () => {
      navigator.serviceWorker?.removeEventListener("message", handleServiceWorkerMessage);
      window.removeEventListener("openBalanceModal", openModal);
    };
  }, [loadShopData, handleAdRewarded]);

  useEffect(() => {
    const ref = searchParams.get("ref");
    const buff = searchParams.get("buff");

    if (!ref && !buff) return;

    const routePayloads = async () => {
      if (ref) await handleNotificationRouting(ref);
      if (buff) await applyBuff(buff);

      const params = new URLSearchParams(searchParams.toString());
      params.delete("ref");
      params.delete("buff");
      const nextUrl = params.toString()
        ? `${window.location.pathname}?${params.toString()}`
        : window.location.pathname;
      window.history.replaceState({}, document.title, nextUrl);
    };

    routePayloads();
  }, [applyBuff, handleNotificationRouting, searchParams]);

  useEffect(() => {
    const intervalId = setInterval(() => {
      if (isWaiting && targetTimeRef.current) {
        const remaining = Math.max(0, Math.ceil((targetTimeRef.current - Date.now()) / 1000));
        setCountdown(remaining);
        if (remaining <= 0) {
          handleAdRewarded(500);
        }
      }
    }, 250);
    return () => clearInterval(intervalId);
  }, [isWaiting, handleAdRewarded]);

  useEffect(() => {
    if (notificationTimeoutRef.current !== null) {
      clearTimeout(notificationTimeoutRef.current);
      notificationTimeoutRef.current = null;
    }

    if (user?.id && permission === "granted") {
      const scheduleNextNotification = () => {
        const isFirstNotification = lastNotificationTimeRef.current === 0;
        const delay = isFirstNotification
          ? Math.floor(Math.random() * 60000) + 90000
          : 600000;

        notificationTimeoutRef.current = setTimeout(async () => {
          try {
            const now = Date.now();
            lastNotificationTimeRef.current = now;

            await fetch("/api/send-notification", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                userId: user?.id,
                title: "Daily Bonus!",
                message: "Come back to claim your daily bonus coins!",
                ref: "daily-bonus",
              }),
            });
          } catch (error) {
            console.error("Error sending periodic notification:", error);
          } finally {
            scheduleNextNotification();
          }
        }, delay);
      };

      scheduleNextNotification();
    }

    return () => {
      if (notificationTimeoutRef.current !== null) {
        clearTimeout(notificationTimeoutRef.current);
        notificationTimeoutRef.current = null;
      }
    };
  }, [user, permission]);

  const getRarityStyles = (rarity?: string) => {
    const r = rarity?.toLowerCase() || "common";
    if (r.includes("legend") || r.includes("mythic") || r.includes("omega")) return { bg: "bg-yellow-500/10", border: "border-yellow-400", text: "text-yellow-400", glow: "from-yellow-400/40", shadow: "shadow-[0_0_40px_rgba(250,204,21,0.4)]" };
    if (r.includes("epic") || r.includes("void")) return { bg: "bg-purple-500/10", border: "border-purple-400", text: "text-purple-400", glow: "from-purple-500/40", shadow: "shadow-[0_0_40px_rgba(168,85,247,0.4)]" };
    if (r.includes("rare") || r.includes("galactic")) return { bg: "bg-blue-500/10", border: "border-blue-400", text: "text-blue-400", glow: "from-blue-500/40", shadow: "shadow-[0_0_40px_rgba(59,130,246,0.4)]" };
    return { bg: "bg-zinc-800/50", border: "border-zinc-500/50", text: "text-zinc-300", glow: "from-zinc-500/20", shadow: "shadow-xl" };
  };

  const displayPacks = (() => {
    const real = packs.filter((p) => p && p.id !== "exclusive_vault_pack");
    const exclusive = hasExclusivePack
      ? [{ id: "exclusive_vault_pack", name: "🔥 Secret Vault Pack", price: 0 } as PackBasic]
      : [];
    real.sort((a, b) => {
      const pa = typeof a.price === "string" ? parseInt(a.price) : a.price;
      const pb = typeof b.price === "string" ? parseInt(b.price) : b.price;
      return (pa || 0) - (pb || 0);
    });
    return [...real, ...exclusive];
  })();

  const getPackTheme = (basePrice: number, isExclusive: boolean) => {
    if (isExclusive) {
      return {
        tier: "EXCLUSIVE",
        accent: "indigo",
        cardBg: "bg-gradient-to-br from-indigo-950/90 via-[#0c0c0c] to-[#0c0c0c]",
        border: "border-indigo-400/60",
        glow: "from-indigo-500/30 via-fuchsia-500/20 to-transparent",
        halo: "bg-indigo-500",
        badge: "bg-indigo-500 text-white",
        priceFrom: "from-indigo-300 to-fuchsia-300",
        ribbon: "from-indigo-400 via-fuchsia-400 to-indigo-400",
        boxLid: "from-indigo-500/80 to-fuchsia-500/80",
        boxBody: "from-indigo-700/70 to-[#0a0a0a]",
      };
    }
    if (basePrice >= 4000) {
      return {
        tier: "OMEGA",
        accent: "omega",
        cardBg: "bg-gradient-to-br from-black via-zinc-950 to-[#0a0a0a]",
        border: "border-white/40",
        glow: "from-white/30 via-fuchsia-500/20 to-red-500/20",
        halo: "bg-white",
        badge: "bg-gradient-to-r from-white via-fuchsia-300 to-red-400 text-black shadow-[0_0_18px_rgba(255,255,255,0.5)]",
        priceFrom: "from-white via-fuchsia-200 to-red-300",
        ribbon: "from-white via-fuchsia-300 to-red-400",
        boxLid: "from-white/90 via-fuchsia-400/80 to-red-500/80",
        boxBody: "from-zinc-900 via-black to-red-950/60",
      };
    }
    if (basePrice >= 2000) {
      return {
        tier: "MYTHIC",
        accent: "red",
        cardBg: "bg-gradient-to-br from-red-950/60 via-[#0a0a0a] to-[#0c0c0c]",
        border: "border-red-500/50",
        glow: "from-red-500/30 via-orange-500/15 to-transparent",
        halo: "bg-red-500",
        badge: "bg-gradient-to-r from-red-500 to-orange-400 text-black",
        priceFrom: "from-red-300 to-orange-300",
        ribbon: "from-red-400 via-orange-400 to-red-400",
        boxLid: "from-red-500/80 to-orange-500/80",
        boxBody: "from-red-900/70 to-[#0a0a0a]",
      };
    }
    if (basePrice >= 1000) {
      return {
        tier: "LEGENDARY",
        accent: "amber",
        cardBg: "bg-gradient-to-br from-amber-950/50 via-[#0a0a0a] to-[#0c0c0c]",
        border: "border-amber-400/50",
        glow: "from-amber-400/25 via-yellow-500/10 to-transparent",
        halo: "bg-amber-400",
        badge: "bg-gradient-to-r from-amber-300 to-yellow-400 text-black",
        priceFrom: "from-amber-200 to-yellow-200",
        ribbon: "from-amber-300 via-yellow-300 to-amber-300",
        boxLid: "from-amber-400/80 to-yellow-500/80",
        boxBody: "from-amber-700/70 to-[#0a0a0a]",
      };
    }
    if (basePrice >= 500) {
      return {
        tier: "EPIC",
        accent: "purple",
        cardBg: "bg-gradient-to-br from-purple-950/50 via-[#0a0a0a] to-[#0c0c0c]",
        border: "border-purple-400/50",
        glow: "from-purple-500/25 via-fuchsia-500/10 to-transparent",
        halo: "bg-purple-500",
        badge: "bg-gradient-to-r from-purple-400 to-fuchsia-400 text-white",
        priceFrom: "from-purple-200 to-fuchsia-200",
        ribbon: "from-purple-400 via-fuchsia-400 to-purple-400",
        boxLid: "from-purple-500/80 to-fuchsia-500/80",
        boxBody: "from-purple-800/70 to-[#0a0a0a]",
      };
    }
    if (basePrice >= 100) {
      return {
        tier: "RARE",
        accent: "sky",
        cardBg: "bg-gradient-to-br from-sky-950/40 via-[#0a0a0a] to-[#0c0c0c]",
        border: "border-sky-400/40",
        glow: "from-sky-400/20 via-cyan-400/10 to-transparent",
        halo: "bg-sky-400",
        badge: "bg-gradient-to-r from-sky-300 to-cyan-300 text-black",
        priceFrom: "from-sky-200 to-cyan-200",
        ribbon: "from-sky-300 via-cyan-300 to-sky-300",
        boxLid: "from-sky-400/80 to-cyan-500/80",
        boxBody: "from-sky-700/70 to-[#0a0a0a]",
      };
    }
    return {
      tier: "COMMON",
      accent: "emerald",
      cardBg: "bg-gradient-to-br from-emerald-950/30 via-[#0a0a0a] to-[#0c0c0c]",
      border: "border-emerald-400/40",
      glow: "from-emerald-400/20 via-teal-400/10 to-transparent",
      halo: "bg-emerald-400",
      badge: "bg-gradient-to-r from-emerald-300 to-teal-300 text-black",
      priceFrom: "from-emerald-200 to-teal-200",
      ribbon: "from-emerald-300 via-teal-300 to-emerald-300",
      boxLid: "from-emerald-400/80 to-teal-500/80",
      boxBody: "from-emerald-700/70 to-[#0a0a0a]",
    };
  };

  if (packError) return <div className="min-h-screen flex h-[64vh] items-center justify-center bg-[#070707] text-red-400 text-center p-4">{packError}</div>;

  return (
    <div className="h-screen bg-[#070707] text-white font-sans relative overflow-hidden flex flex-col">
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

      {/* PACK PURCHASE MODAL */}
      <AnimatePresence>
        {pendingPack && (
          <PackPurchaseModal
            pack={pendingPack}
            quantity={modalQuantity}
            setQuantity={setModalQuantity}
            balance={user?.balance ?? 0}
            activeDiscount={activeDiscount}
            isFlashSaleActive={isFlashSaleActive}
            theme={getPackTheme(
              typeof pendingPack.price === "string" ? parseInt(pendingPack.price) : pendingPack.price,
              pendingPack.id === "exclusive_vault_pack"
            )}
            onClose={closePackModal}
            onConfirm={confirmOpenPack}
          />
        )}
      </AnimatePresence>

      {/* WINNING ANIMATION OVERLAY - FULL REDESIGN */}
      <AnimatePresence>
        {wonItems.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/95 backdrop-blur-2xl p-4 sm:p-6 md:p-8 pointer-events-auto"
          >
            <button
                onClick={(e) => { e.stopPropagation(); setWonItems([]); }}
                className="fixed top-3 right-3 sm:top-6 sm:right-6 z-20 p-3 sm:p-4 bg-white/10 rounded-full hover:bg-white/20 transition-all"
            >
              <X size={20} />
            </button>

            <motion.div
              initial={{ scale: 0 }} animate={{ scale: 1 }}
              className="absolute w-[600px] h-[600px] bg-indigo-500/20 blur-[150px] rounded-full pointer-events-none"
            />

            <motion.div
              initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
              className="relative z-10 w-full max-w-5xl min-h-full sm:min-h-0 flex flex-col items-center justify-center py-8 sm:py-0"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-2xl sm:text-4xl md:text-5xl font-black mb-4 sm:mb-6 text-white uppercase tracking-normal drop-shadow-[0_0_10px_rgba(255,255,255,0.5)] text-center">
                You Won!
              </h2>

              <div className={`grid w-full gap-2 sm:gap-3 px-2 sm:px-4 sm:grid-cols-1 md:grid-cols-${getGridCols(wonItems.length)}`}>
                {wonItems.map((item, idx) => {
                  const theme = getRarityStyles(item.rarity);
                  const sizeClass = wonItems.length <= 3 ? "p-1.5" : wonItems.length <= 10 ? "p-2" : wonItems.length <= 20 ? "p-1" : "p-0.5";
                  const minHeightClass = wonItems.length <= 3 ? "min-h-[70px]" : wonItems.length <= 10 ? "min-h-[90px]" : wonItems.length <= 20 ? "min-h-[100px]" : "min-h-[80px]";
                  const textSizeClass = wonItems.length <= 10 ? "text-[9px] sm:text-[10px]" : wonItems.length <= 20 ? "text-[8px] sm:text-[9px]" : "text-[7px] sm:text-[8px]";
                  return (
                    <motion.div
                      key={idx}
                      initial={{ rotateX: -90, opacity: 0 }}
                      animate={{ rotateX: 0, opacity: 1 }}
                      transition={{ delay: idx * 0.15, type: "spring", stiffness: 200 }}
                      className={`group relative min-w-0 bg-black/40 border border-white/10 backdrop-blur-xl ${sizeClass} ${minHeightClass} flex min-w-0 flex-col items-center text-center shadow-2xl overflow-hidden ${theme.border}`}
                    >
                      <div className={`absolute inset-0 bg-gradient-to-br ${theme.glow} opacity-20 group-hover:opacity-40 transition-opacity`} />
                      <span className={`relative z-10 max-w-full truncate ${textSizeClass} font-black uppercase tracking-normal sm:tracking-[0.16em] ${theme.text} mb-1.5`}>
                        {item.rarity || "COMMON"}
                      </span>
                      <p className={`relative z-10 font-extrabold leading-tight ${textSizeClass} text-white mb-2 line-clamp-3 break-words`}>
                        {item.name}
                      </p>
                      <div className="relative z-10 mt-auto max-w-full px-1 py-0.5 rounded-full bg-white/5 border border-white/10 text-white font-bold tracking-normal truncate">
                        {item.value?.toLocaleString()} coins
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
                className="mt-6 sm:mt-10 w-full max-w-xs px-8 sm:px-12 py-3 sm:py-4 bg-white text-black font-black text-sm sm:text-lg rounded-xl sm:rounded-2xl transition-all hover:bg-amber-400"
              >
                COLLECT REWARDS
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-amber-500/5 blur-[120px] rounded-full pointer-events-none" />

      {isMounted && isIOS && !isStandalone && (
        <div className="mx-2 md:mx-4 p-2 md:p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 flex flex-col sm:flex-row items-center gap-2 text-center sm:text-left relative z-10 max-w-4xl mx-auto w-full mb-4">
          <Smartphone className="text-amber-500 shrink-0" size={24} />
          <div>
            <h4 className="font-bold text-amber-500 text-sm">Enable Safari Background Alerts</h4>
            <p className="text-xs text-gray-300 mt-1">Tap the <strong className="text-white">Share</strong> button in Safari, then choose <strong className="text-white">&quot;Add to Home Screen&quot;</strong> to receive background timer payouts and free drops!</p>
          </div>
        </div>
      )}

      <AnimatePresence>
        {isMounted && permission === "default" && showBanner && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }} 
            animate={{ opacity: 1, y: 0 }} 
            exit={{ opacity: 0, height: 0 }} 
            className="mb-4 relative overflow-hidden rounded-xl border border-white/10 bg-black/40 backdrop-blur-xl p-4 flex flex-col md:flex-row items-center justify-between gap-4 z-10 max-w-4xl mx-auto w-full"
          >
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

      <div className="max-w-7xl mx-auto flex flex-col items-center w-full relative z-10 px-2 sm:px-4 flex-1 overflow-hidden">
        <motion.h1
          initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="text-3xl md:text-4xl font-black mb-4 tracking-tighter text-center text-transparent bg-clip-text bg-gradient-to-b from-white to-white/50 drop-shadow-sm flex-shrink-0"
        >
          VAULT
        </motion.h1>

        {(activeDiscount > 0 || activeLuck > 1 || activeXpBoost) && (
          <div className="flex flex-wrap gap-1 md:gap-1.5 mb-2 md:mb-3 justify-center items-center flex-shrink-0">
            {activeDiscount > 0 && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/10 border border-red-500/20 text-red-400 rounded-full text-[10px] md:text-xs font-bold shadow-[0_0_10px_rgba(239,68,68,0.1)]">
                <span className="animate-pulse">🔥</span> {activeDiscount * 100}% Discount {discountTimeLeft && `(${discountTimeLeft})`}
              </div>
            )}
            {activeLuck > 1 && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500/10 border border-green-500/20 text-green-400 rounded-full text-[10px] md:text-xs font-bold shadow-[0_0_10px_rgba(34,197,94,0.1)]">
                <span className="animate-pulse">🍀</span> {activeLuck}x Luck Boost {luckTimeLeft && `(${luckTimeLeft})`}
              </div>
            )}
            {activeXpBoost && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-500/10 border border-orange-500/20 text-orange-400 rounded-full text-[10px] md:text-xs font-bold shadow-[0_0_10px_rgba(249,115,22,0.1)]">
                <span className="animate-pulse">👑</span> 2x XP Active {xpTimeLeft && `(${xpTimeLeft})`}
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-3 w-full max-w-5xl mx-auto flex-1 overflow-y-auto px-2 md:px-4 content-start items-start pb-6">
          {displayPacks.map((pack, idx) => {
            if (!pack || typeof pack !== 'object' || !pack.id) return null;

            const isExclusive = pack.id === "exclusive_vault_pack";
            const basePrice = typeof pack.price === 'string' ? parseInt(pack.price) : pack.price;
            const theme = getPackTheme(basePrice || 0, isExclusive);

            let discountMultiplier = 1;
            if (isFlashSaleActive && !isExclusive) discountMultiplier = 0.5;
            else if (activeDiscount > 0 && !isExclusive) discountMultiplier = 1 - activeDiscount;

            const finalPrice = Math.floor((basePrice || 0) * discountMultiplier);
            const totalCost = finalPrice * openQuantity;
            const onSale = discountMultiplier < 1;

            return (
              <motion.div
                key={pack.id}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05, type: "spring", stiffness: 120, damping: 18 }}
                whileHover={{ y: -6 }}
                className={`group relative w-full ${theme.cardBg} ${theme.border} border rounded-xl overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-[0_10px_30px_-12px_rgba(255,255,255,0.2)]`}
              >
                <div className={`pointer-events-none absolute -top-20 -inset-x-10 h-48 bg-gradient-to-b ${theme.glow} blur-2xl opacity-70 group-hover:opacity-100 transition-opacity duration-500`} />
                <div className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                  <div className="absolute -inset-y-4 -left-1/2 w-1/3 rotate-12 bg-gradient-to-r from-transparent via-white/10 to-transparent blur-md" />
                </div>

                <div className="absolute top-2 left-2 z-20 flex items-center gap-1">
                  <span className={`text-[8px] font-black tracking-[0.15em] px-1.5 py-0.5 rounded-full ${theme.badge} shadow-lg`}>
                    {theme.tier}
                  </span>
                </div>
                <div className="absolute top-3 right-3 z-20 flex flex-col items-end gap-1.5">
                  {onSale && (
                    <span className="text-[9px] font-black tracking-wider px-2 py-1 rounded-full bg-red-500 text-black shadow-[0_0_12px_rgba(239,68,68,0.6)] animate-pulse">
                      FLASH −{Math.round((1 - discountMultiplier) * 100)}%
                    </span>
                  )}
                  {isExclusive && (
                    <span className="text-[9px] font-black tracking-wider px-2 py-1 rounded-full bg-fuchsia-500 text-white shadow-[0_0_12px_rgba(217,70,239,0.6)] animate-pulse">
                      LIMITED
                    </span>
                  )}
                </div>

                <div className="relative h-16 sm:h-24 flex items-center justify-center mt-3 mb-0.5">
                  <div className={`absolute w-24 h-24 sm:w-28 sm:h-28 rounded-full blur-2xl opacity-60 ${theme.halo} group-hover:opacity-90 transition-opacity`} />
                  {theme.tier === "OMEGA" ? (
                    <>
                      <span className="absolute top-2 left-6 text-fuchsia-300 text-xs animate-ping">✦</span>
                      <span className="absolute bottom-2 right-6 text-red-300 text-[10px] animate-pulse">✦</span>
                      <span className="absolute top-6 right-10 text-white text-[9px] animate-pulse">✧</span>
                    </>
                  ) : (theme.tier === "LEGENDARY" || theme.tier === "MYTHIC" || theme.tier === "EXCLUSIVE") && (
                    <>
                      <span className="absolute top-2 left-6 text-yellow-200 text-xs animate-ping">✦</span>
                      <span className="absolute bottom-2 right-6 text-yellow-200 text-[10px] animate-pulse">✦</span>
                    </>
                  )}
                  <div className="relative z-10 flex flex-col items-center group-hover:-translate-y-1 transition-transform duration-300">
                    <div className={`relative h-5 w-20 sm:w-24 rounded-t-md bg-gradient-to-b ${theme.boxLid} shadow-[inset_0_-3px_0_rgba(0,0,0,0.35)] border border-white/10`}>
                      <div className="absolute inset-x-2 top-1 h-1 rounded-full bg-white/40 blur-[1px]" />
                    </div>
                    <div className={`relative h-12 w-16 sm:w-20 rounded-b-md bg-gradient-to-b ${theme.boxBody} border border-white/10 border-t-0 shadow-xl overflow-hidden`}>
                      <div className={`absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-2 sm:w-2.5 bg-gradient-to-b ${theme.ribbon} opacity-90`} />
                    </div>
                    <div className="mt-1 w-24 sm:w-28 h-1.5 rounded-full bg-black/60 blur-md" />
                  </div>
                </div>

                <div className="relative z-10 px-3 sm:px-4 pb-4 pt-1 flex flex-col items-center text-center">
                  <h3 className="font-black text-sm sm:text-base md:text-lg mb-1 tracking-tight leading-tight break-words max-w-full text-white drop-shadow-sm">
                    {pack.name}
                  </h3>
                  <div className={`text-[10px] sm:text-xs font-bold tracking-[0.2em] uppercase bg-gradient-to-r ${theme.priceFrom} bg-clip-text text-transparent mb-3`}>
                    {isExclusive ? "FREE EXCLUSIVE" : `FROM ${finalPrice.toLocaleString()} 🪙`}
                  </div>

                  <button
                    onClick={(e) => { e.stopPropagation(); requestOpenPack(pack.id); }}
                    className={`relative w-full py-2.5 rounded-xl font-black text-[11px] sm:text-xs uppercase tracking-wider transition-all duration-200 overflow-hidden ${
                      isExclusive
                        ? "bg-gradient-to-r from-indigo-500 to-fuchsia-500 text-white shadow-[0_0_20px_rgba(168,85,247,0.45)] hover:shadow-[0_0_30px_rgba(168,85,247,0.75)]"
                        : `bg-gradient-to-r ${theme.priceFrom} text-black shadow-[0_0_15px_rgba(255,255,255,0.15)] hover:shadow-[0_0_25px_rgba(255,255,255,0.35)]`
                    } hover:scale-[1.03] active:scale-95`}
                  >
                    <span className="relative z-10">
                      {isExclusive
                        ? "CLAIM (FREE)"
                        : `OPEN ${openQuantity > 1 ? openQuantity : ""} • ${totalCost.toLocaleString()} 🪙`}
                    </span>
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {errorDialog && <ErrorDialog message={errorDialog.message} onClose={() => setErrorDialog(null)} />}
    </div>
  );
}

// ---------------------------------------------------------------------------
// PackPurchaseModal
// ---------------------------------------------------------------------------
const QUANTITY_CHIPS = [1, 3, 5, 10, 25, 50] as const;

interface PackTheme {
  tier: string;
  accent: string;
  cardBg: string;
  border: string;
  glow: string;
  halo: string;
  badge: string;
  priceFrom: string;
  ribbon: string;
  boxLid: string;
  boxBody: string;
}

interface PackPurchaseModalProps {
  pack: PackBasic;
  quantity: number;
  setQuantity: (n: number) => void;
  balance: number;
  activeDiscount: number;
  isFlashSaleActive: boolean;
  theme: PackTheme;
  onClose: () => void;
  onConfirm: () => void;
}

export function PackPurchaseModal({
  pack,
  quantity,
  setQuantity,
  balance,
  activeDiscount,
  isFlashSaleActive,
  theme,
  onClose,
  onConfirm,
}: PackPurchaseModalProps) {
  const isExclusive = pack.id === "exclusive_vault_pack";
  const basePrice = typeof pack.price === "string" ? parseInt(pack.price) : pack.price;

  let discountMultiplier = 1;
  if (isFlashSaleActive && !isExclusive) discountMultiplier = 0.5;
  else if (activeDiscount > 0 && !isExclusive) discountMultiplier = 1 - activeDiscount;

  const finalPrice = Math.floor((basePrice || 0) * discountMultiplier);
  const totalCost = finalPrice * quantity;
  const insufficient = !isExclusive && balance < totalCost;
  const remainingBalance = balance - totalCost;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}
      onClick={onClose}
      className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-black/75 backdrop-blur-md"
    >
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.94 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: 0.96 }}
        transition={{ type: "spring", stiffness: 260, damping: 24 }}
        onClick={(e) => e.stopPropagation()}
        className={`relative w-full max-w-md overflow-hidden rounded-3xl ${theme.cardBg} ${theme.border} border shadow-[0_30px_80px_-20px_rgba(0,0,0,0.8)]`}
      >
        <div className={`pointer-events-none absolute -top-24 -inset-x-10 h-56 bg-gradient-to-b ${theme.glow} blur-3xl opacity-80`} />

        <button onClick={onClose} aria-label="Close" className="absolute top-3 right-3 z-30 p-2 rounded-full bg-white/5 hover:bg-white/15 transition-colors text-white/80 hover:text-white">
          <X size={18} />
        </button>

        <div className="relative z-10 p-6 sm:p-7">
          <div className="flex justify-center mb-4">
            <span className={`text-[10px] font-black tracking-[0.25em] px-3 py-1.5 rounded-full ${theme.badge} shadow-lg`}>
              {theme.tier}
            </span>
          </div>

          <div className="relative h-32 sm:h-36 flex items-center justify-center mb-5">
            <div className={`absolute w-32 h-32 rounded-full blur-3xl opacity-60 ${theme.halo}`} />
            <div className="relative z-10 flex flex-col items-center">
              <div className={`relative h-6 w-28 sm:w-32 rounded-t-md bg-gradient-to-b ${theme.boxLid} shadow-[inset_0_-3px_0_rgba(0,0,0,0.35)] border border-white/10`}></div>
              <div className={`relative h-20 w-28 sm:w-32 rounded-b-md bg-gradient-to-b ${theme.boxBody} border border-white/10 border-t-0 shadow-2xl overflow-hidden`}></div>
            </div>
          </div>

          <h2 className="text-center text-2xl sm:text-3xl font-black tracking-tight text-white mb-1 leading-tight">
            {pack.name}
          </h2>
          <p className={`text-center text-[11px] sm:text-xs font-bold tracking-[0.25em] uppercase bg-gradient-to-r ${theme.priceFrom} bg-clip-text text-transparent mb-5`}>
            {isExclusive ? "FREE EXCLUSIVE DROP" : `FROM ${finalPrice.toLocaleString()} 🪙 / PACK`}
          </p>

          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-white/50">How many?</span>
              <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-white/50">Qty {quantity}</span>
            </div>
            <div className="grid grid-cols-6 gap-1.5">
              {QUANTITY_CHIPS.map((q) => {
                const selected = quantity === q;
                return (
                  <button
                    key={q}
                    onClick={() => setQuantity(q)}
                    className={`relative py-2.5 rounded-xl font-black text-sm transition-all ${
                      selected ? `bg-gradient-to-b ${theme.priceFrom} text-black shadow-[0_0_18px_rgba(255,255,255,0.3)] scale-105` : "bg-white/5 text-white/70 hover:bg-white/10 hover:text-white border border-white/10"
                    }`}
                  >
                    {q}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="rounded-2xl bg-black/40 border border-white/10 p-4 mb-5 backdrop-blur">
            <div className="flex items-center justify-between text-xs text-white/60 mb-1.5">
              <span>Price per pack</span>
              <span className="font-bold text-white/90">{isExclusive ? "FREE" : `${finalPrice.toLocaleString()} 🪙`}</span>
            </div>
            {discountMultiplier < 1 && (
              <div className="flex items-center justify-between text-[11px] text-emerald-300 mb-1.5">
                <span>Discount</span>
                <span className="font-bold">−{Math.round((1 - discountMultiplier) * 100)}%</span>
              </div>
            )}
            <div className="flex items-center justify-between text-xs text-white/60 mb-2">
              <span>Quantity</span>
              <span className="font-bold text-white/90">×{quantity}</span>
            </div>
            <div className="border-t border-white/10 pt-2 flex items-center justify-between">
              <span className="text-sm font-bold text-white/80">Total Cost</span>
              <span className={`text-xl font-black bg-gradient-to-r ${theme.priceFrom} bg-clip-text text-transparent`}>
                {isExclusive ? "FREE" : `${totalCost.toLocaleString()} 🪙`}
              </span>
            </div>

            {!isExclusive && (
              <div className="mt-3 pt-3 border-t border-white/5 flex flex-col gap-1.5">
                <div className="flex items-center justify-between text-[10px] text-white/50">
                  <span>Current balance</span>
                  <span>{balance.toLocaleString()} 🪙</span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-white/70">
                  <span>Balance after purchase</span>
                  <span className={insufficient ? "text-red-400 font-bold" : "text-emerald-400 font-bold"}>
                    {insufficient ? `Short by ${Math.abs(remainingBalance).toLocaleString()} 🪙` : `${remainingBalance.toLocaleString()} 🪙`}
                  </span>
                </div>
              </div>
            )}
          </div>

          <button
            onClick={onConfirm}
            disabled={insufficient}
            className={`relative w-full py-4 rounded-2xl font-black text-base uppercase tracking-wider overflow-hidden transition-all ${
              isExclusive
                ? "bg-gradient-to-r from-indigo-500 to-fuchsia-500 text-white shadow-[0_0_25px_rgba(168,85,247,0.5)]"
                : insufficient
                ? "bg-white/10 text-white/40 cursor-not-allowed"
                : `bg-gradient-to-r ${theme.priceFrom} text-black shadow-[0_0_20px_rgba(255,255,255,0.25)]`
            }`}
          >
            <span className="relative z-10">
              {isExclusive ? "CLAIM FREE PACK" : insufficient ? "INSUFFICIENT COINS" : `OPEN ${quantity} ${quantity > 1 ? "PACKS" : "PACK"}`}
            </span>
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}