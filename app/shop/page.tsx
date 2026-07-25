"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Bell, X, Smartphone, Sparkles, Crown, Zap, 
  Coins, Tag, Package, ChevronRight, AlertCircle, RefreshCw
} from "lucide-react";
import ErrorDialog from "@/components/ErrorDialog";
import WonScreen from "@/components/WonScreen"; 
import ExclusiveWonScreen from "@/components/ExclusiveWonScreen";

import { RewardedAdService } from "@/lib/adService";
import { notificationService } from "@/lib/notificationService";

// --- Types ---
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

interface PackBasic {
  id: string;
  name: string;
  price: number;
}

interface ApiPack {
  id: string;
  name: string;
  price: number | string;
}

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

const FALLBACK_PACKS: PackBasic[] = [
  { id: "1a91f6e0-03ce-4a1a-aae0-51ca4057ba8f", name: "ALPHA ARSENAL", price: 100 },
  { id: "5d2b1d7e-0f4d-4425-ba60-a0ddfeed968f", name: "APEX MATRIX", price: 500 },
  { id: "76796f88-c7d0-442a-bfeb-380c3863c8b7", name: "CHRONO VAULT", price: 1000 },
  { id: "02ada6c5-4bb7-4d2c-953d-3228f28855eb", name: "VOID SINGULARITY", price: 2000 },
  { id: "b38e2c41-9d5a-4f17-8c63-7a1f9b4e2d04", name: "ECLIPSE OVERLORD", price: 5000 },
  { id: "5fd47c89-8fd5-4946-9f09-00d90055c6e5", name: "QUANTUM PROMO", price: 10000 },
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

const getPackTheme = (basePrice: number, isExclusive: boolean): PackTheme => {
  if (isExclusive) {
    return {
      tier: "EXCLUSIVE",
      accent: "indigo",
      cardBg: "bg-gradient-to-br from-indigo-950/70 via-black to-slate-950",
      border: "border-indigo-500/40 hover:border-indigo-400",
      glow: "from-indigo-500/20 via-fuchsia-500/10 to-transparent",
      halo: "bg-indigo-500",
      badge: "bg-indigo-500/20 border border-indigo-400/50 text-indigo-300",
      priceFrom: "from-indigo-300 via-fuchsia-300 to-indigo-100",
      ribbon: "from-indigo-400 via-fuchsia-400 to-indigo-400",
      boxLid: "from-indigo-500/80 to-fuchsia-500/80",
      boxBody: "from-indigo-900/80 to-slate-950",
    };
  }
  if (basePrice >= 5000) {
    return {
      tier: "OMEGA",
      accent: "omega",
      cardBg: "bg-gradient-to-br from-zinc-950 via-black to-fuchsia-950/40",
      border: "border-fuchsia-500/30 hover:border-fuchsia-400/60",
      glow: "from-fuchsia-500/20 via-rose-500/10 to-transparent",
      halo: "bg-fuchsia-400",
      badge: "bg-gradient-to-r from-fuchsia-500/20 to-rose-500/20 border border-fuchsia-400/40 text-fuchsia-200",
      priceFrom: "from-white via-fuchsia-200 to-rose-300",
      ribbon: "from-white via-fuchsia-300 to-rose-400",
      boxLid: "from-white/90 via-fuchsia-400/80 to-rose-500/80",
      boxBody: "from-zinc-900 via-black to-fuchsia-950/60",
    };
  }
  if (basePrice >= 2000) {
    return {
      tier: "MYTHIC",
      accent: "red",
      cardBg: "bg-gradient-to-br from-rose-950/40 via-black to-zinc-950",
      border: "border-rose-500/30 hover:border-rose-400/60",
      glow: "from-rose-500/20 via-orange-500/10 to-transparent",
      halo: "bg-rose-500",
      badge: "bg-rose-500/20 border border-rose-400/40 text-rose-300",
      priceFrom: "from-rose-300 to-orange-300",
      ribbon: "from-rose-400 via-orange-400 to-rose-400",
      boxLid: "from-rose-500/80 to-orange-500/80",
      boxBody: "from-rose-950/80 to-black",
    };
  }
  if (basePrice >= 1000) {
    return {
      tier: "LEGENDARY",
      accent: "amber",
      cardBg: "bg-gradient-to-br from-amber-950/40 via-black to-zinc-950",
      border: "border-amber-500/30 hover:border-amber-400/60",
      glow: "from-amber-500/20 via-yellow-500/10 to-transparent",
      halo: "bg-amber-400",
      badge: "bg-amber-500/20 border border-amber-400/40 text-amber-300",
      priceFrom: "from-amber-200 to-yellow-300",
      ribbon: "from-amber-300 via-yellow-300 to-amber-300",
      boxLid: "from-amber-400/80 to-yellow-500/80",
      boxBody: "from-amber-950/80 to-black",
    };
  }
  if (basePrice >= 500) {
    return {
      tier: "EPIC",
      accent: "purple",
      cardBg: "bg-gradient-to-br from-purple-950/40 via-black to-zinc-950",
      border: "border-purple-500/30 hover:border-purple-400/60",
      glow: "from-purple-500/20 via-fuchsia-500/10 to-transparent",
      halo: "bg-purple-500",
      badge: "bg-purple-500/20 border border-purple-400/40 text-purple-300",
      priceFrom: "from-purple-200 to-fuchsia-200",
      ribbon: "from-purple-400 via-fuchsia-400 to-purple-400",
      boxLid: "from-purple-500/80 to-fuchsia-500/80",
      boxBody: "from-purple-950/80 to-black",
    };
  }
  return {
    tier: "RARE",
    accent: "sky",
    cardBg: "bg-gradient-to-br from-sky-950/30 via-black to-zinc-950",
    border: "border-sky-500/30 hover:border-sky-400/60",
    glow: "from-sky-500/20 via-cyan-500/10 to-transparent",
    halo: "bg-sky-400",
    badge: "bg-sky-500/20 border border-sky-400/40 text-sky-300",
    priceFrom: "from-sky-200 to-cyan-200",
    ribbon: "from-sky-300 via-cyan-300 to-sky-300",
    boxLid: "from-sky-400/80 to-cyan-500/80",
    boxBody: "from-sky-950/80 to-black",
  };
};

export default function ShopPage() {
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

  useEffect(() => { setIsMounted(true); }, []);
  useEffect(() => { setIsStandalone(getIsStandalone()); }, []);

  const getInitialNotificationPermission = (): NotificationPermission | "unsupported" => {
    if (typeof window === "undefined" || !("Notification" in window)) return "unsupported";
    return Notification.permission;
  };

  const [openQuantity, setOpenQuantity] = useState(1);
  const [pendingPack, setPendingPack] = useState<PackBasic | null>(null);
  const [modalQuantity, setModalQuantity] = useState(1);
  const [wonItems, setWonItems] = useState<{ name: string; rarity?: string; value?: number }[]>([]);
  const [lastWasExclusive, setLastWasExclusive] = useState(false);
  const [lastNewBalance, setLastNewBalance] = useState<number | undefined>(undefined);

  const [errorDialog, setErrorDialog] = useState<{ message: string } | null>(null);
  const [isFlashSaleActive, setIsFlashSaleActive] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">(getInitialNotificationPermission);
  const [showBanner, setShowBanner] = useState(true);

  // Lock scroll when modals/animations are active
  useEffect(() => {
    const shouldLockScroll = wonItems.length > 0 || showAdModal || isOpening || Boolean(pendingPack);
    if (shouldLockScroll) {
      document.body.style.overflow = 'hidden';
      document.body.style.touchAction = 'none';
    } else {
      document.body.style.overflow = '';
      document.body.style.touchAction = '';
    }
    return () => {
      document.body.style.overflow = '';
      document.body.style.touchAction = '';
    };
  }, [wonItems.length, showAdModal, isOpening, pendingPack]);

  const [activeDiscount, setActiveDiscount] = useState<number>(0);
  const [activeLuck, setActiveLuck] = useState<number>(1);
  const [hasExclusivePack, setHasExclusivePack] = useState<boolean>(false);
  const [packError, setPackError] = useState<string | null>(null);
  const [activeXpBoost, setActiveXpBoost] = useState<boolean>(false);

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

  const userIdRef = useRef<string | undefined>(undefined);
  const targetTimeRef = useRef<number | null>(null);
  const timerCompletedRef = useRef(false);
  const adService = useRef<RewardedAdService | null>(null);
  const initializeFetchGuardRef = useRef(false);

  const syncUserState = useCallback((userData: UserProfile) => {
    setUser((current) => ({ ...current, ...userData }));
    if (userData.id && userIdRef.current !== userData.id) {
      userIdRef.current = userData.id;
      notificationService.login(userData.id);
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

  useEffect(() => {
    if (!user) return;
    const ticker = setInterval(() => {
      const now = Date.now();
      const dynamicUpdates: Partial<UserProfile> = {};
      let changed = false;

      if (user.luckExpiresAt) {
        setLuckTimeLeft(formatTimeLeft(user.luckExpiresAt));
        if (new Date(user.luckExpiresAt).getTime() <= now && activeLuck !== 1) {
          setActiveLuck(1);
          dynamicUpdates.activeLuck = 1;
          dynamicUpdates.luckExpiresAt = null;
          changed = true;
        }
      } else { setLuckTimeLeft(""); }

      if (user.discountExpiresAt) {
        setDiscountTimeLeft(formatTimeLeft(user.discountExpiresAt));
        if (new Date(user.discountExpiresAt).getTime() <= now && activeDiscount !== 0) {
          setActiveDiscount(0);
          dynamicUpdates.activeDiscount = 0;
          dynamicUpdates.discountExpiresAt = null;
          changed = true;
        }
      } else { setDiscountTimeLeft(""); }

      if (user.xpBoostExpiresAt) {
        setXpTimeLeft(formatTimeLeft(user.xpBoostExpiresAt));
        if (new Date(user.xpBoostExpiresAt).getTime() <= now && activeXpBoost !== false) {
          setActiveXpBoost(false);
          dynamicUpdates.activeXpBoost = false;
          dynamicUpdates.xpBoostExpiresAt = null;
          changed = true;
        }
      } else { setXpTimeLeft(""); }

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

  const handleAdRewarded = useCallback(async (amount: number) => {
    if (timerCompletedRef.current) return;

    timerCompletedRef.current = true;
    setIsWaiting(false);
    targetTimeRef.current = null;

    try {
      await fetch("/api/user/add-coins", { 
        method: "POST", 
        headers: { "Content-Type": "application/json" }, 
        body: JSON.stringify({ amount: amount || 500, suppressNotification: true }) 
      });
      await fetchUserData();
      setShowAdModal(false);
    } catch (error) {
      console.error("Failed to process ad reward:", error);
      setIsWaiting(false);
    }
  }, [fetchUserData]);

  const loadShopData = useCallback(async () => {
    if (isFetchingPacks) return;
    setIsFetchingPacks(true);
    try {
      setPackError(null);
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
        console.warn("[Shop] Failed to fetch packs, using fallback:", packErr);
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

    setTimeout(() => {
      if (isWaiting) {
        handleAdRewarded(amount);
      }
    }, 10000);
  };

  const requestOpenPack = (packId: string) => {
    const pack = packs.find((p) => p.id === packId);
    if (!pack && packId !== "exclusive_vault_pack") return;
    const target: PackBasic = pack ?? ({ id: "exclusive_vault_pack", name: "APOCALYPSE VAULT", price: 0 } as PackBasic);
    setModalQuantity(openQuantity > 0 ? openQuantity : 1);
    setPendingPack(target);
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
      setErrorDialog({ message: "Insufficient coins! Watch an ad or claim rewards." });
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

      await new Promise((resolve) => setTimeout(resolve, 1800));

      if (res.ok) {
        setLastWasExclusive(packId === "exclusive_vault_pack");
        setLastNewBalance(data.newBalance);
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

    // Listen for both event handlers from header/nav components
    const openModal = () => { setShowAdModal(true); };
    window.addEventListener("openShopBalanceModal", openModal);
    window.addEventListener("openBalanceModal", openModal);

    return () => {
      window.removeEventListener("openShopBalanceModal", openModal);
      window.removeEventListener("openBalanceModal", openModal);
    };
  }, [loadShopData]);

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

  const displayPacks = useMemo(() => {
    const real = packs.filter((p) => p && p.id !== "exclusive_vault_pack");
    const exclusive = hasExclusivePack
      ? [{ id: "exclusive_vault_pack", name: "APOCALYPSE VAULT", price: 0 } as PackBasic]
      : [];
    real.sort((a, b) => {
      const pa = typeof a.price === "string" ? parseInt(a.price) : a.price;
      const pb = typeof b.price === "string" ? parseInt(b.price) : b.price;
      return (pa || 0) - (pb || 0);
    });
    return [...real, ...exclusive];
  }, [packs, hasExclusivePack]);

  if (packError) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#070707] text-rose-400 p-6 text-center">
        <AlertCircle size={48} className="mb-4 text-rose-500 animate-bounce" />
        <p className="text-lg font-bold">{packError}</p>
        <button onClick={loadShopData} className="mt-4 px-4 py-2 bg-rose-500/10 border border-rose-500/20 text-rose-300 rounded-xl font-bold flex items-center gap-2 hover:bg-rose-500/20 transition">
          <RefreshCw size={16} /> Retry Connection
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#070707] text-slate-100 font-sans relative overflow-hidden flex flex-col selection:bg-amber-500/30">
      
      {/* Background Grid */}
      <div className="absolute inset-0 bg-[radial-gradient(#1f1f2e_1px,transparent_1px)] [background-size:24px_24px] opacity-30 pointer-events-none" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[350px] bg-gradient-to-b from-amber-500/10 via-purple-500/5 to-transparent blur-[140px] rounded-full pointer-events-none" />

      {/* Opening Animation Overlay */}
      <AnimatePresence>
        {isOpening && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-black/90 backdrop-blur-2xl pointer-events-auto"
          >
            <motion.div
              animate={{ rotate: [0, -8, 8, -8, 8, 0], scale: [1, 1.12, 1] }}
              transition={{ duration: 0.6, repeat: Infinity, ease: "easeInOut" }}
              className="relative p-6 rounded-3xl bg-gradient-to-b from-amber-500/20 to-transparent border border-amber-500/30 shadow-[0_0_50px_rgba(245,158,11,0.2)] mb-8"
            >
              <Package size={80} className="text-amber-400 drop-shadow-[0_0_15px_rgba(245,158,11,0.5)]" />
            </motion.div>
            <h2 className="text-xl sm:text-2xl font-black tracking-widest text-white uppercase animate-pulse">
              Decrypting Cyber Vault...
            </h2>
            <div className="w-64 h-2 bg-white/10 mt-6 rounded-full overflow-hidden border border-white/5">
              <motion.div
                className="h-full bg-gradient-to-r from-amber-500 via-fuchsia-500 to-amber-300"
                initial={{ width: "0%" }}
                animate={{ width: "100%" }}
                transition={{ duration: 1.8, ease: "easeInOut" }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Purchase Modal */}
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
            onClose={() => setPendingPack(null)}
            onConfirm={confirmOpenPack}
          />
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {wonItems.length > 0 && lastWasExclusive && (
          <ExclusiveWonScreen
            key="exclusive"
            items={wonItems}
            newBalance={lastNewBalance}
            onClose={() => { setWonItems([]); setLastWasExclusive(false); setLastNewBalance(undefined); }}
          />
        )}
        {wonItems.length > 0 && !lastWasExclusive && (
          <WonScreen
            key="normal"
            items={wonItems}
            newBalance={lastNewBalance}
            onClose={() => { setWonItems([]); setLastWasExclusive(false); setLastNewBalance(undefined); }}
          />
        )}
      </AnimatePresence>

      {/* iOS Banner */}
      {isMounted && isIOS && !isStandalone && (
        <div className="mx-4 mt-4 p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center gap-3 relative z-10 max-w-4xl mx-auto w-full backdrop-blur-md">
          <Smartphone className="text-amber-400 shrink-0" size={22} />
          <div className="text-xs">
            <span className="font-bold text-amber-400">Enable Safari Alerts: </span>
            <span className="text-slate-300">Tap <strong className="text-white">Share</strong> & choose <strong className="text-white">&quot;Add to Home Screen&quot;</strong> for instant payouts!</span>
          </div>
        </div>
      )}

      {/* Notification Banner */}
      <AnimatePresence>
        {isMounted && permission === "default" && showBanner && (
          <motion.div 
            initial={{ opacity: 0, y: -15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, height: 0 }}
            className="m-4 relative overflow-hidden rounded-2xl border border-white/10 bg-slate-900/60 backdrop-blur-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 z-10 max-w-4xl mx-auto w-full shadow-xl"
          >
            <div className="flex items-center gap-3 relative z-10">
              <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-400">
                <Bell size={20} />
              </div>
              <div>
                <h4 className="font-bold text-sm text-white">Enable Notifications</h4>
                <p className="text-slate-400 text-xs">Stay tuned for rare vault drops and flash coin sales.</p>
              </div>
            </div>
            <div className="flex items-center gap-2 relative z-10 w-full sm:w-auto">
              <button onClick={handleEnableNotifications} className="w-full sm:w-auto px-4 py-2 text-xs bg-amber-500 hover:bg-amber-400 text-black font-black rounded-xl transition-all shadow-lg shadow-amber-500/20">ALLOW</button>
              <button onClick={() => setShowBanner(false)} className="p-2 text-slate-500 hover:text-white transition-colors"><X size={18} /></button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Watch Ad Boost Balance Modal */}
      <AnimatePresence>
        {showAdModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div className="bg-slate-900 border border-white/10 p-6 rounded-3xl w-full max-w-xs text-center relative overflow-hidden shadow-2xl">
              {isWaiting ? (
                <div className="flex flex-col items-center py-4">
                  <div className="relative w-20 h-20 mb-4 flex items-center justify-center">
                    <svg className="w-full h-full rotate-[-90deg]">
                      <circle cx="40" cy="40" r="36" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-slate-800" />
                      <motion.circle cx="40" cy="40" r="36" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-amber-500" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 10, ease: "linear" }} />
                    </svg>
                    <span className="absolute text-2xl font-black text-white">{countdown}</span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-300">Processing Stream...</h3>
                </div>
              ) : (
                <>
                  <div className="p-3 bg-amber-500/10 border border-amber-500/20 text-amber-400 w-fit rounded-2xl mx-auto mb-3">
                    <Coins size={28} />
                  </div>
                  <h3 className="text-lg font-black mb-1 text-white">Boost Balance</h3>
                  <p className="text-xs text-slate-400 mb-4">Watch a quick stream to claim bonus coins instantly.</p>
                  <button onClick={() => handleWatchAdClick(500)} className="w-full py-3 rounded-xl font-bold text-xs bg-amber-500 hover:bg-amber-400 text-black transition-all shadow-lg shadow-amber-500/20">WATCH AD (+500)</button>
                  <button onClick={() => setShowAdModal(false)} className="mt-3 text-xs text-slate-500 hover:text-slate-300">Cancel</button>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Shop View */}
      <div className="max-w-6xl mx-auto flex flex-col items-center w-full relative z-10 px-4 flex-1 py-6">
        <div className="text-center mb-6">
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-bold text-amber-400 mb-3">
            <Sparkles size={14} /> EXCLUSIVE VAULT STORE
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="text-4xl sm:text-5xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-white via-slate-200 to-slate-500"
          >
            VAULT SHOP
          </motion.h1>
        </div>

        {/* Active Buff Badges */}
        {(activeDiscount > 0 || activeLuck > 1 || activeXpBoost) && (
          <div className="flex flex-wrap gap-2 mb-6 justify-center items-center">
            {activeDiscount > 0 && (
              <div className="flex items-center gap-1.5 px-3.5 py-1.5 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-full text-xs font-bold shadow-lg shadow-rose-500/5">
                <Tag size={13} className="animate-pulse" /> {activeDiscount * 100}% Off {discountTimeLeft && `(${discountTimeLeft})`}
              </div>
            )}
            {activeLuck > 1 && (
              <div className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full text-xs font-bold shadow-lg shadow-emerald-500/5">
                <Sparkles size={13} className="animate-pulse" /> {activeLuck}x Luck Boost {luckTimeLeft && `(${luckTimeLeft})`}
              </div>
            )}
            {activeXpBoost && (
              <div className="flex items-center gap-1.5 px-3.5 py-1.5 bg-orange-500/10 border border-orange-500/20 text-orange-400 rounded-full text-xs font-bold shadow-lg shadow-orange-500/5">
                <Zap size={13} className="animate-pulse" /> 2x XP Boost {xpTimeLeft && `(${xpTimeLeft})`}
              </div>
            )}
          </div>
        )}

        {/* Packs Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5 w-full">
          {displayPacks.map((pack, idx) => {
            if (!pack || typeof pack !== 'object' || !pack.id) return null;

            const isExclusive = pack.id === "exclusive_vault_pack";
            const basePrice = typeof pack.price === 'string' ? parseInt(pack.price) : pack.price;
            const theme = getPackTheme(basePrice || 0, isExclusive);

            let discountMultiplier = 1;
            if (isFlashSaleActive && !isExclusive) discountMultiplier = 0.5;
            else if (activeDiscount > 0 && !isExclusive) discountMultiplier = 1 - activeDiscount;

            const finalPrice = Math.floor((basePrice || 0) * discountMultiplier);
            const onSale = discountMultiplier < 1;

            return (
              <motion.div
                key={pack.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05, type: "spring", stiffness: 120 }}
                whileHover={{ y: -4 }}
                onClick={() => requestOpenPack(pack.id)}
                className={`group relative w-full ${theme.cardBg} ${theme.border} border rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-2xl hover:shadow-amber-500/5 p-5 flex flex-col justify-between`}
              >
                <div className={`pointer-events-none absolute -top-24 -inset-x-10 h-48 bg-gradient-to-b ${theme.glow} blur-2xl opacity-60 group-hover:opacity-100 transition-opacity duration-500`} />

                <div className="flex items-center justify-between w-full relative z-20 mb-4">
                  <span className={`text-[10px] font-black tracking-widest px-2.5 py-1 rounded-md ${theme.badge}`}>
                    {theme.tier}
                  </span>
                  <div className="flex gap-1">
                    {onSale && (
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-rose-500 text-black animate-pulse">
                        -{Math.round((1 - discountMultiplier) * 100)}%
                      </span>
                    )}
                    {isExclusive && (
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-fuchsia-500 text-white animate-pulse">
                        EXCLUSIVE
                      </span>
                    )}
                  </div>
                </div>

                <div className="relative h-28 flex items-center justify-center my-2">
                  <div className={`absolute w-24 h-24 rounded-full blur-2xl opacity-50 ${theme.halo} group-hover:scale-125 transition-transform duration-500`} />
                  <div className="relative z-10 flex flex-col items-center group-hover:-translate-y-1 transition-transform duration-300">
                    <div className={`relative h-6 w-24 rounded-t-lg bg-gradient-to-b ${theme.boxLid} border border-white/20 shadow-lg`} />
                    <div className={`relative h-14 w-20 rounded-b-lg bg-gradient-to-b ${theme.boxBody} border border-white/20 border-t-0 shadow-2xl flex items-center justify-center`}>
                      <Package size={22} className="text-white/40 group-hover:text-white/80 transition-colors" />
                      <div className={`absolute inset-y-0 w-2.5 bg-gradient-to-b ${theme.ribbon} opacity-80`} />
                    </div>
                  </div>
                </div>

                <div className="relative z-10 flex flex-col items-center text-center mt-2">
                  <h3 className="font-black text-lg text-white mb-1 group-hover:text-amber-300 transition-colors">
                    {pack.name}
                  </h3>
                  <div className={`text-xs font-bold tracking-wider uppercase bg-gradient-to-r ${theme.priceFrom} bg-clip-text text-transparent mb-4 flex items-center gap-1`}>
                    {isExclusive ? (
                      "FREE DROP"
                    ) : (
                      <>
                        <Coins size={12} className="text-amber-400 shrink-0" />
                        <span>{finalPrice.toLocaleString()} COINS</span>
                      </>
                    )}
                  </div>

                  <button
                    onClick={(e) => { e.stopPropagation(); requestOpenPack(pack.id); }}
                    className={`w-full py-3 rounded-xl font-black text-xs uppercase tracking-wider transition-all duration-200 flex items-center justify-center gap-1.5 ${
                      isExclusive
                        ? "bg-gradient-to-r from-indigo-500 to-fuchsia-500 text-white shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40"
                        : "bg-white/10 hover:bg-white text-white hover:text-black border border-white/10"
                    }`}
                  >
                    <span>OPEN VAULT</span>
                    <ChevronRight size={14} />
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

// --- Pack Purchase Modal Component ---
const QUANTITY_CHIPS = [1, 3, 5, 10, 25, 50] as const;

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
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose}
      className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
    >
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: 0.95 }}
        onClick={(e) => e.stopPropagation()}
        className={`relative w-full max-w-md overflow-hidden rounded-3xl ${theme.cardBg} ${theme.border} border p-6 shadow-2xl`}
      >
        <button onClick={onClose} className="absolute top-4 right-4 z-30 p-2 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors">
          <X size={18} />
        </button>

        <div className="relative z-10 flex flex-col items-center">
          <span className={`text-[10px] font-black tracking-widest px-3 py-1 rounded-md mb-4 ${theme.badge}`}>
            {theme.tier}
          </span>

          <h2 className="text-2xl font-black text-white text-center mb-1">{pack.name}</h2>
          <p className="text-xs text-slate-400 mb-6">Select total vaults to decrypt</p>

          <div className="w-full mb-6">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-2 font-medium">
              <span>UNITS TO OPEN</span>
              <span className="text-amber-400 font-bold">{quantity} Vaults</span>
            </div>
            <div className="grid grid-cols-6 gap-1.5">
              {QUANTITY_CHIPS.map((q) => (
                <button
                  key={q}
                  onClick={() => setQuantity(q)}
                  className={`py-2 rounded-xl text-xs font-black transition-all ${
                    quantity === q 
                      ? "bg-amber-500 text-black shadow-lg shadow-amber-500/20" 
                      : "bg-white/5 hover:bg-white/10 text-slate-300 border border-white/5"
                  }`}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>

          <div className="w-full bg-black/40 border border-white/5 rounded-2xl p-4 mb-6 space-y-2 text-xs">
            <div className="flex justify-between text-slate-400">
              <span>Unit Price</span>
              <span className="text-slate-200 font-bold">{isExclusive ? "FREE" : `${finalPrice.toLocaleString()} 🪙`}</span>
            </div>
            {discountMultiplier < 1 && (
              <div className="flex justify-between text-emerald-400">
                <span>Sale Bonus</span>
                <span className="font-bold">-{Math.round((1 - discountMultiplier) * 100)}%</span>
              </div>
            )}
            <div className="flex justify-between text-slate-400 border-b border-white/5 pb-2">
              <span>Quantity</span>
              <span className="text-slate-200 font-bold">{quantity}</span>
            </div>
            <div className="flex justify-between text-sm font-bold text-white pt-1">
              <span>Total Cost</span>
              <span className="text-amber-400">{isExclusive ? "FREE" : `${totalCost.toLocaleString()} 🪙`}</span>
            </div>

            {!isExclusive && (
              <div className="pt-2 border-t border-white/5 flex justify-between text-[11px]">
                <span className="text-slate-500">Remaining Balance</span>
                <span className={insufficient ? "text-rose-400 font-bold" : "text-emerald-400 font-bold"}>
                  {insufficient ? `Short by ${Math.abs(remainingBalance).toLocaleString()} 🪙` : `${remainingBalance.toLocaleString()} 🪙`}
                </span>
              </div>
            )}
          </div>

          <button
            onClick={onConfirm}
            disabled={insufficient}
            className={`w-full py-4 rounded-2xl font-black text-sm uppercase tracking-wider transition-all ${
              isExclusive
                ? "bg-gradient-to-r from-indigo-500 to-fuchsia-500 text-white shadow-lg shadow-indigo-500/20"
                : insufficient
                ? "bg-white/10 text-slate-500 cursor-not-allowed"
                : "bg-amber-500 hover:bg-amber-400 text-black shadow-lg shadow-amber-500/20"
            }`}
          >
            {isExclusive ? "CLAIM FREE VAULT" : insufficient ? "INSUFFICIENT FUNDS" : `OPEN ${quantity} VAULT${quantity > 1 ? "S" : ""}`}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}