"use client";

import { useState, useEffect, useCallback, useRef, Suspense } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import Navbar from "@/components/Navbar";
import { Analytics } from "@vercel/analytics/next";
import { motion } from "framer-motion";
import {
  Sparkles,
  Zap,
  Flame,
  ExternalLink,
  AlertTriangle,
  RefreshCw,
  Volume2,
  VolumeX,
  Lock,
  Package,
} from "lucide-react";
import { adService } from "@/lib/adService";

const REWARD_AMOUNT = 50000;
const AD_TIMER_SECONDS = 15;

export function LayoutInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, status } = useSession();

  const [loading, setLoading] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);

  // State Machine
  const [adActive, setAdActive] = useState(false);
  const [adCountdown, setAdCountdown] = useState(AD_TIMER_SECONDS);
  const [hasVisitedAd, setHasVisitedAd] = useState(false);
  const [userReturned, setUserReturned] = useState(false);
  const [popupBlocked, setPopupBlocked] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [showRewardModal, setShowRewardModal] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [adToken, setAdToken] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const adPopupRef = useRef<Window | null>(null);

  // Sound Engine
  const playSound = useCallback((type: "tick" | "success" | "error") => {
    if (typeof window === "undefined") return;
    try {
      const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === "tick") {
        osc.frequency.setValueAtTime(600, ctx.currentTime);
        gain.gain.setValueAtTime(0.05, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
      } else if (type === "success") {
        osc.frequency.setValueAtTime(523.25, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1046.5, ctx.currentTime + 0.3);
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
      } else if (type === "error") {
        osc.frequency.setValueAtTime(180, ctx.currentTime);
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
      }
      osc.start();
      osc.stop(ctx.currentTime + 0.4);
    } catch (e) {
      // Audio fallback
    }
  }, []);

  // Initiate Sequence
  const triggerAdSequence = useCallback(async () => {
    setErrorMessage(null);
    setAdCountdown(AD_TIMER_SECONDS);
    setHasVisitedAd(false);
    setUserReturned(false);
    setPopupBlocked(false);
    setIsVerifying(false);

    try {
      // Step 1: Initiate session token on server
      const res = await fetch("/api/user/initiate-ad", { method: "POST" });
      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.error || "Failed to start ad sequence.");
        setAdActive(true);
        return;
      }

      setAdToken(data.adToken);

      // Step 2: Open ad window
      const userId = session?.user?.id || session?.user?.email || undefined;
      const { popup } = adService.showAd(userId);

      if (popup) {
        adPopupRef.current = popup;
        setHasVisitedAd(true);
        setPopupBlocked(false);
      } else {
        setPopupBlocked(true);
      }

      setAdActive(true);
    } catch (err) {
      setErrorMessage("Network connection error.");
      setAdActive(true);
    }
  }, [session]);

  // Track window focus/blur return
  useEffect(() => {
    if (!adActive) return;

    const handleFocus = () => {
      if (hasVisitedAd) setUserReturned(true);
    };

    const handleVisibility = () => {
      if (document.visibilityState === "visible" && hasVisitedAd) {
        setUserReturned(true);
      }
    };

    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [adActive, hasVisitedAd]);

  // Countdown & Claim Processing
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (adActive && !errorMessage && adCountdown > 0) {
      interval = setInterval(() => {
        setAdCountdown((prev) => {
          if (soundEnabled && prev > 1) playSound("tick");
          return prev - 1;
        });
      }, 1000);
    } else if (adActive && !errorMessage && adCountdown === 0 && !isVerifying) {
      setIsVerifying(true);

      // Submit verification claim token
      fetch("/api/user/verify-ad-claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adToken }),
      })
        .then(async (res) => {
          const data = await res.json();

          if (res.ok && data.success) {
            if (soundEnabled) playSound("success");
            window.dispatchEvent(
              new CustomEvent("balanceUpdated", {
                detail: { balance: Number(data.newBalance) },
              })
            );
            setAdActive(false);
            setIsVerifying(false);
            setShowRewardModal(true);
          } else {
            if (soundEnabled) playSound("error");
            setIsVerifying(false);
            setErrorMessage(data.error || "Verification failed.");
          }
        })
        .catch(() => {
          if (soundEnabled) playSound("error");
          setIsVerifying(false);
          setErrorMessage("Server error during verification.");
        });
    }

    return () => clearInterval(interval);
  }, [adActive, adCountdown, adToken, errorMessage, isVerifying, playSound, soundEnabled]);

  // Page Routing & Splash Logic
  useEffect(() => {
    if (status === "loading") return;

    const isPublicPage = pathname === "/login" || pathname === "/register";

    if (status !== "authenticated" && !isPublicPage) {
      router.replace("/login");
    } else if (status === "authenticated" && pathname === "/") {
      router.replace("/shop");
    } else {
      if (pathname !== "/") {
        setLoading(false);
      } else {
        const timer = setTimeout(() => {
          setFadeOut(true);
          setTimeout(() => setLoading(false), 500);
        }, 1000);
        return () => clearTimeout(timer);
      }
    }
  }, [status, pathname, router]);

  useEffect(() => {
    const handleOpenModal = () => triggerAdSequence();
    window.addEventListener("openShopBalanceModal", handleOpenModal);
    return () => window.removeEventListener("openShopBalanceModal", handleOpenModal);
  }, [triggerAdSequence]);

  const progressPercent = ((AD_TIMER_SECONDS - adCountdown) / AD_TIMER_SECONDS) * 100;

  return (
    <>
      <style>{`
        @keyframes pulseGlow {
          0%, 100% { opacity: 0.4; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.05); }
        }
        @keyframes radarSweep {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .animate-pulse-glow { animation: pulseGlow 3s infinite ease-in-out; }
        .animate-radar-sweep { animation: radarSweep 3s linear infinite; }
      `}</style>

      {/* AD OVERLAY STAGE */}
      {adActive && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-[#020308]/95 backdrop-blur-3xl overflow-hidden select-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[650px] bg-cyan-500/10 rounded-full blur-[140px] pointer-events-none animate-pulse-glow" />

          <div className="relative w-full max-w-lg bg-[#050811]/90 border border-cyan-500/30 rounded-3xl p-6 sm:p-8 shadow-[0_0_80px_rgba(6,182,212,0.2)] text-center flex flex-col items-center gap-6 overflow-hidden">
            
            {/* Header */}
            <div className="w-full flex justify-between items-center z-10 border-b border-cyan-500/10 pb-3">
              <div className="flex items-center gap-2">
                <Lock size={12} className="text-cyan-400" />
                <span className="text-[10px] font-black text-cyan-400 tracking-widest uppercase">
                  VERIFIED AD SEQUENCE
                </span>
              </div>

              <button
                onClick={() => setSoundEnabled(!soundEnabled)}
                className="p-1.5 rounded-lg bg-white/5 border border-white/10 text-zinc-400 hover:text-white transition-all"
              >
                {soundEnabled ? <Volume2 size={14} /> : <VolumeX size={14} />}
              </button>
            </div>

            {/* Error View */}
            {errorMessage ? (
              <div className="flex flex-col items-center space-y-4 my-2 z-10">
                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-2xl text-red-400">
                  <AlertTriangle size={28} className="animate-bounce" />
                </div>
                <h3 className="text-xl font-black text-white">Verification Error</h3>
                <p className="text-xs text-zinc-400 max-w-xs leading-relaxed">
                  {errorMessage}
                </p>
                <button
                  onClick={() => setAdActive(false)}
                  className="px-6 py-3 bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 text-red-300 font-black text-xs tracking-wider rounded-xl transition-all uppercase"
                >
                  Close Window
                </button>
              </div>
            ) : popupBlocked ? (
              <div className="flex flex-col items-center space-y-4 my-2 z-10">
                <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-amber-400">
                  <AlertTriangle size={28} className="animate-bounce" />
                </div>
                <h3 className="text-xl font-black text-white">Ad Window Blocked</h3>
                <p className="text-xs text-zinc-400 max-w-xs leading-relaxed">
                  Your browser blocked the ad window. Click below to launch the offer tab to complete validation.
                </p>
                <button
                  onClick={() => {
                    const userId = session?.user?.id || session?.user?.email || undefined;
                    const { popup } = adService.showAd(userId);
                    if (popup) {
                      adPopupRef.current = popup;
                      setHasVisitedAd(true);
                      setPopupBlocked(false);
                    }
                  }}
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:brightness-110 text-black font-black text-xs tracking-wider rounded-xl shadow-lg shadow-cyan-500/20 active:scale-95 transition-all uppercase"
                >
                  <ExternalLink size={16} /> Open Ad Tab
                </button>
              </div>
            ) : (
              <>
                <div className="flex flex-col items-center space-y-2 z-10">
                  <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight uppercase">
                    {isVerifying ? "CHECKING PROOF..." : "SYNCING REWARD"}
                  </h2>
                  <p className="text-zinc-400 text-xs sm:text-sm max-w-xs leading-relaxed font-medium">
                    {userReturned
                      ? "User return verified! Finalizing credit check..."
                      : "Interact with the sponsored ad tab until the timer completes."}
                  </p>
                </div>

                {/* Counter Sphere */}
                <div className="relative w-32 h-32 flex items-center justify-center my-1 z-10">
                  <div className="absolute inset-0 rounded-full border border-cyan-500/20" />
                  <div className="absolute inset-2 rounded-full border border-dashed border-cyan-500/40 animate-spin" style={{ animationDuration: "18s" }} />
                  <div className="absolute inset-0 rounded-full border-t-2 border-cyan-400 animate-radar-sweep opacity-80" />

                  <div className="relative w-20 h-20 bg-gradient-to-br from-cyan-950 to-zinc-950 border border-cyan-400/50 rounded-full flex flex-col items-center justify-center shadow-[0_0_30px_rgba(6,182,212,0.3)]">
                    {isVerifying ? (
                      <RefreshCw size={24} className="text-cyan-400 animate-spin" />
                    ) : (
                      <>
                        <span className="text-3xl font-black text-white tracking-tighter drop-shadow-[0_0_10px_rgba(6,182,212,0.8)]">
                          {adCountdown}
                        </span>
                        <span className="text-[9px] font-bold text-cyan-400 tracking-widest uppercase -mt-1">
                          SECS
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full space-y-2 z-10">
                  <div className="flex justify-between items-center text-xs font-bold px-1">
                    <span className="text-cyan-400 flex items-center gap-1">
                      <Zap size={12} /> {isVerifying ? "Validating Nonce" : "Syncing Time"}
                    </span>
                    <span className="text-zinc-400">{Math.round(progressPercent)}%</span>
                  </div>

                  <div className="w-full h-3 bg-zinc-900/80 rounded-full overflow-hidden p-0.5 border border-cyan-500/30 shadow-[inset_0_0_10px_rgba(0,0,0,0.8)]">
                    <div
                      className="h-full bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-500 rounded-full shadow-[0_0_20px_#06b6d4] transition-all duration-1000 ease-linear"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>

                {/* Realtime Metrics */}
                <div className="grid grid-cols-3 gap-2.5 w-full z-10">
                  <div className="flex flex-col items-center p-2.5 bg-black/40 rounded-2xl border border-cyan-500/20 backdrop-blur-md">
                    <span className="text-[9px] text-zinc-500 font-black uppercase">Session</span>
                    <span className="text-[11px] font-black text-cyan-400 mt-0.5">
                      ACTIVE
                    </span>
                  </div>

                  <div className="flex flex-col items-center p-2.5 bg-black/40 rounded-2xl border border-amber-500/20 backdrop-blur-md">
                    <span className="text-[9px] text-zinc-500 font-black uppercase">Bounty</span>
                    <span className="text-[11px] font-black text-amber-400 flex items-center gap-0.5 mt-0.5">
                      <Flame size={11} /> +50K
                    </span>
                  </div>

                  <div className="flex flex-col items-center p-2.5 bg-black/40 rounded-2xl border border-emerald-500/20 backdrop-blur-md">
                    <span className="text-[9px] text-zinc-500 font-black uppercase">Focus</span>
                    <span className={`text-[11px] font-black mt-0.5 ${userReturned ? "text-emerald-400" : "text-zinc-400"}`}>
                      {userReturned ? "RETURNED" : "WAITING"}
                    </span>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* BOUNTY CLAIM SUCCESS MODAL */}
      {showRewardModal && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/85 backdrop-blur-2xl">
          <div className="relative bg-[#0b0c10] border-2 border-amber-500/40 p-6 sm:p-8 rounded-3xl max-w-sm w-full text-center flex flex-col items-center gap-6 shadow-[0_0_80px_rgba(245,158,11,0.25)] overflow-hidden">
            <div className="relative w-24 h-24 bg-gradient-to-b from-amber-400 via-orange-500 to-amber-700 rounded-full flex items-center justify-center text-5xl shadow-[0_0_40px_rgba(245,158,11,0.4)] border-4 border-[#0b0c10] animate-bounce">
              🪙
              <Sparkles className="absolute -top-2 -right-2 text-yellow-300 animate-spin" size={24} />
            </div>

            <div className="space-y-2 z-10">
              <h3 className="text-3xl font-black text-white tracking-tight uppercase">
                BOUNTY SECURED!
              </h3>
              <p className="text-zinc-400 text-xs px-2 leading-relaxed font-medium">
                Verification complete! Your profile balance has been credited:
              </p>

              <div className="inline-flex items-center gap-2 px-5 py-2 bg-amber-500/10 border border-amber-500/40 rounded-full text-amber-400 font-black tracking-wide text-xl mt-3 shadow-[0_0_20px_rgba(245,158,11,0.15)]">
                <span>+{REWARD_AMOUNT.toLocaleString()}</span>
                <span className="text-xs text-amber-300 font-bold uppercase">Coins</span>
              </div>
            </div>

            <button
              onClick={() => setShowRewardModal(false)}
              className="w-full py-4 px-6 bg-gradient-to-r from-amber-400 via-orange-500 to-amber-500 hover:brightness-110 text-black font-black text-xs tracking-widest rounded-2xl transition-all shadow-xl shadow-amber-500/20 active:scale-95 uppercase cursor-pointer"
            >
              COLLECT REWARD
            </button>
          </div>
        </div>
      )}

      {/* Main Container */}
      <div className="min-h-screen flex flex-col bg-[#070707] text-zinc-100 selection:bg-amber-500/30">
        {pathname !== "/login" && pathname !== "/register" && <Navbar />}

        <main className="flex-grow w-full">
          {loading && pathname === "/" ? (
            <div className={`fixed inset-0 z-[99999] bg-black/95 backdrop-blur-2xl flex flex-col items-center justify-center pointer-events-auto transition-opacity duration-500 ${
              fadeOut ? "opacity-0" : "opacity-100"
            }`}>
              <motion.div
                initial={{ scale: 0.7, rotate: -15, opacity: 0 }}
                animate={{ scale: [1, 1.25, 1], rotate: [0, 10, -10, 0], opacity: 1 }}
                transition={{ duration: 0.8, repeat: Infinity, ease: "easeInOut" }}
                className="p-7 rounded-3xl bg-gradient-to-br from-amber-500/30 via-orange-500/20 to-amber-500/10 border border-amber-500/50 shadow-[0_0_100px_rgba(245,158,11,0.4)] mb-6"
              >
                <Package size={72} className="text-amber-400 drop-shadow-[0_0_20px_rgba(245,158,11,0.8)]" />
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center gap-2"
              >
                <h2 className="font-black text-white text-2xl tracking-widest uppercase">
                  DECRYPTING VAULT OS
                </h2>
                <div className="w-48 h-1.5 bg-white/10 rounded-full overflow-hidden border border-white/10">
                  <motion.div 
                    className="h-full bg-gradient-to-r from-amber-500 via-orange-400 to-amber-300"
                    initial={{ width: "0%" }}
                    animate={{ width: "100%" }}
                    transition={{ duration: 0.8, repeat: Infinity, ease: "easeInOut" }}
                  />
                </div>
              </motion.div>
            </div>
          ) : (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full">
              {children}
            </div>
          )}
        </main>

        <Analytics />
      </div>
    </>
  );
}

export default function LayoutContent({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={null}>
      <LayoutInner>{children}</LayoutInner>
    </Suspense>
  );
}