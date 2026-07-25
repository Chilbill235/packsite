"use client";

import { useState, useEffect, useCallback, useRef, Suspense } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import Navbar from "@/components/Navbar";
import { Analytics } from "@vercel/analytics/next";
import {
  Sparkles,
  ShieldCheck,
  Zap,
  Cpu,
  Flame,
  CheckCircle2,
  ExternalLink,
  AlertTriangle,
  RefreshCw,
  Volume2,
  VolumeX,
} from "lucide-react";
import { adService } from "@/lib/adService";

const REWARD_AMOUNT = 50000;
const AD_TIMER_SECONDS = 15; // Synced with ad duration requirement

export function LayoutInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, status } = useSession();

  const [loading, setLoading] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);

  // --- Ad Engine States ---
  const [adActive, setAdActive] = useState(false);
  const [adCountdown, setAdCountdown] = useState(AD_TIMER_SECONDS);
  const [hasVisitedAd, setHasVisitedAd] = useState(false);
  const [userReturned, setUserReturned] = useState(false);
  const [popupBlocked, setPopupBlocked] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [showRewardModal, setShowRewardModal] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const adPopupRef = useRef<Window | null>(null);

  // Synthesized Web Audio Sound Effects
  const playSound = useCallback((type: "click" | "tick" | "success") => {
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
        osc.start();
        osc.stop(ctx.currentTime + 0.08);
      } else if (type === "click") {
        osc.frequency.setValueAtTime(400, ctx.currentTime);
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
        osc.start();
        osc.stop(ctx.currentTime + 0.1);
      } else if (type === "success") {
        osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
        osc.frequency.exponentialRampToValueAtTime(1046.50, ctx.currentTime + 0.3); // C6
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
        osc.start();
        osc.stop(ctx.currentTime + 0.4);
      }
    } catch (e) {
      // Audio context fallbacks
    }
  }, []);

  // Launch Ad Sequence
  const triggerAdSequence = useCallback(() => {
    setAdCountdown(AD_TIMER_SECONDS);
    setHasVisitedAd(false);
    setUserReturned(false);
    setPopupBlocked(false);
    setIsVerifying(false);

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
  }, [session]);

  // Window Focus & Return Tracking
  useEffect(() => {
    if (!adActive) return;

    const handleFocus = () => {
      if (hasVisitedAd) {
        setUserReturned(true);
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible" && hasVisitedAd) {
        setUserReturned(true);
      }
    };

    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [adActive, hasVisitedAd]);

  // Countdown Interval Guard
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (adActive && adCountdown > 0) {
      interval = setInterval(() => {
        setAdCountdown((prev) => {
          if (soundEnabled && prev > 1) playSound("tick");
          return prev - 1;
        });
      }, 1000);
    } else if (adActive && adCountdown === 0) {
      setIsVerifying(true);
      const verifyTimer = setTimeout(() => {
        if (soundEnabled) playSound("success");
        setAdActive(false);
        setIsVerifying(false);
        setShowRewardModal(true);
      }, 1500);

      return () => clearTimeout(verifyTimer);
    }

    return () => clearInterval(interval);
  }, [adActive, adCountdown, playSound, soundEnabled]);

  // Auth Routing & Splash Screen Guard
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

  // Custom Event Listener from Navbar
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

      {/* ULTRA CYBER REWARD STAGE */}
      {adActive && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-[#020308]/95 backdrop-blur-3xl overflow-hidden select-none">
          {/* Ambient Lighting Gradients */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[650px] bg-cyan-500/10 rounded-full blur-[140px] pointer-events-none animate-pulse-glow" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[450px] h-[450px] bg-amber-500/10 rounded-full blur-[100px] pointer-events-none animate-pulse-glow" />

          {/* Grid Mesh */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f2937_1px,transparent_1px),linear-gradient(to_bottom,#1f2937_1px,transparent_1px)] bg-[size:3rem_3rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,black_40%,transparent_100%)] opacity-25 pointer-events-none" />

          {/* Main Stage Glass Console */}
          <div className="relative w-full max-w-lg bg-[#050811]/90 border border-cyan-500/30 rounded-3xl p-6 sm:p-8 shadow-[0_0_80px_rgba(6,182,212,0.2)] text-center flex flex-col items-center gap-6 overflow-hidden">
            
            {/* Top Sound Toggle & Header */}
            <div className="w-full flex justify-between items-center z-10 border-b border-cyan-500/10 pb-3">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-500"></span>
                </span>
                <span className="text-[10px] font-black text-cyan-400 tracking-widest uppercase">
                  NODE REWARD SEQUENCE
                </span>
              </div>

              <button
                onClick={() => setSoundEnabled(!soundEnabled)}
                className="p-1.5 rounded-lg bg-white/5 border border-white/10 text-zinc-400 hover:text-white transition-all"
                title="Toggle SFX"
              >
                {soundEnabled ? <Volume2 size={14} /> : <VolumeX size={14} />}
              </button>
            </div>

            {/* Popup Blocker Fallback Trigger */}
            {popupBlocked ? (
              <div className="flex flex-col items-center space-y-4 my-2 z-10">
                <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-amber-400">
                  <AlertTriangle size={28} className="animate-bounce" />
                </div>
                <h3 className="text-xl font-black text-white">Ad Window Launch Required</h3>
                <p className="text-xs text-zinc-400 max-w-xs leading-relaxed">
                  Your browser prevented the verification tab from opening automatically. Click below to launch the offer page.
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
                  <ExternalLink size={16} /> Open Ad Tab Now
                </button>
              </div>
            ) : (
              <>
                {/* Header Title */}
                <div className="flex flex-col items-center space-y-2 z-10">
                  <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight uppercase">
                    {isVerifying ? "VERIFYING PROOF..." : "SYNCING BOUNTY BLOCK"}
                  </h2>
                  <p className="text-zinc-400 text-xs sm:text-sm max-w-xs leading-relaxed font-medium">
                    {userReturned
                      ? "Ad visit detected! Keep window active while verification completes."
                      : "Interact with the sponsored page tab while timer validates."}
                  </p>
                </div>

                {/* Interactive Holographic Countdown Sphere */}
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

                {/* Progress Bar Container */}
                <div className="w-full space-y-2 z-10">
                  <div className="flex justify-between items-center text-xs font-bold px-1">
                    <span className="text-cyan-400 flex items-center gap-1">
                      <Zap size={12} /> {isVerifying ? "Validating Proof" : "Syncing Chain"}
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

                {/* Real-Time Telemetry Metrics */}
                <div className="grid grid-cols-3 gap-2.5 w-full z-10">
                  <div className="flex flex-col items-center p-2.5 bg-black/40 rounded-2xl border border-cyan-500/20 backdrop-blur-md">
                    <span className="text-[9px] text-zinc-500 font-black uppercase">Ad Portal</span>
                    <span className={`text-[11px] font-black mt-0.5 ${hasVisitedAd ? "text-cyan-400" : "text-amber-400"}`}>
                      {hasVisitedAd ? "CONNECTED" : "PENDING"}
                    </span>
                  </div>

                  <div className="flex flex-col items-center p-2.5 bg-black/40 rounded-2xl border border-amber-500/20 backdrop-blur-md">
                    <span className="text-[9px] text-zinc-500 font-black uppercase">Reward</span>
                    <span className="text-[11px] font-black text-amber-400 flex items-center gap-0.5 mt-0.5">
                      <Flame size={11} /> +50K
                    </span>
                  </div>

                  <div className="flex flex-col items-center p-2.5 bg-black/40 rounded-2xl border border-emerald-500/20 backdrop-blur-md">
                    <span className="text-[9px] text-zinc-500 font-black uppercase">Focus Return</span>
                    <span className={`text-[11px] font-black mt-0.5 ${userReturned ? "text-emerald-400" : "text-zinc-400"}`}>
                      {userReturned ? "DETECTED" : "WAITING"}
                    </span>
                  </div>
                </div>

                {/* Re-Open Ad Tab Manual Link */}
                <button
                  onClick={() => {
                    const userId = session?.user?.id || session?.user?.email || undefined;
                    adService.showAd(userId);
                    setHasVisitedAd(true);
                  }}
                  className="text-[11px] text-zinc-400 hover:text-cyan-400 underline flex items-center gap-1 z-10 transition-colors"
                >
                  <ExternalLink size={12} /> Re-open sponsored ad window
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* GOLD BOUNTY CLAIM MODAL */}
      {showRewardModal && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/85 backdrop-blur-2xl">
          <div className="relative bg-[#0b0c10] border-2 border-amber-500/40 p-6 sm:p-8 rounded-3xl max-w-sm w-full text-center flex flex-col items-center gap-6 shadow-[0_0_80px_rgba(245,158,11,0.25)] overflow-hidden">
            
            {/* Ambient Golden Glow */}
            <div className="absolute top-[-60px] w-64 h-64 bg-amber-500/15 rounded-full blur-[80px] pointer-events-none" />

            {/* Icon Sphere */}
            <div className="relative w-24 h-24 bg-gradient-to-b from-amber-400 via-orange-500 to-amber-700 rounded-full flex items-center justify-center text-5xl shadow-[0_0_40px_rgba(245,158,11,0.4)] border-4 border-[#0b0c10] animate-bounce">
              🪙
              <Sparkles
                className="absolute -top-2 -right-2 text-yellow-300 animate-spin"
                style={{ animationDuration: "6s" }}
                size={24}
              />
            </div>

            {/* Modal Text */}
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

            {/* Action Button */}
            <button
              onClick={async () => {
                try {
                  const response = await fetch("/api/user/verify-ad-claim", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                  });

                  if (response.ok) {
                    const data = await response.json();
                    window.dispatchEvent(
                      new CustomEvent("balanceUpdated", {
                        detail: { balance: Number(data.newBalance) },
                      })
                    );
                  }
                } catch (error) {
                  console.error("Failed to claim ad reward:", error);
                } finally {
                  setShowRewardModal(false);
                }
              }}
              className="w-full py-4 px-6 bg-gradient-to-r from-amber-400 via-orange-500 to-amber-500 hover:brightness-110 text-black font-black text-xs tracking-widest rounded-2xl transition-all shadow-xl shadow-amber-500/20 active:scale-95 uppercase cursor-pointer"
            >
              COLLECT FROM HUDBOX
            </button>
          </div>
        </div>
      )}

      {/* Main Framework Container Layout */}
      <div className="min-h-screen flex flex-col bg-[#070707] text-zinc-100 selection:bg-amber-500/30">
        {pathname !== "/login" && pathname !== "/register" && <Navbar />}

        <main className="flex-grow w-full">
          {loading && pathname === "/" ? (
            <div
              className={`fixed inset-0 z-[99999] bg-[#070707] flex items-center justify-center transition-opacity duration-500 ${
                fadeOut ? "opacity-0" : "opacity-100"
              }`}
            >
              <div className="text-center space-y-3">
                <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" />
                <h1 className="text-sm font-black tracking-widest text-zinc-400 uppercase animate-pulse">
                  Loading PackSite...
                </h1>
              </div>
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