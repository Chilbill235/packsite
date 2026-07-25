"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import Navbar from "@/components/Navbar";
import { Analytics } from "@vercel/analytics/next";
import { Sparkles } from "lucide-react";

const REWARD_AMOUNT = 50000;

function LayoutInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { status } = useSession();

  const [loading, setLoading] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);

  // --- Immersive Ad States ---
  const [adActive, setAdActive] = useState(false);
  const [adCountdown, setAdCountdown] = useState(5);
  const [showRewardModal, setShowRewardModal] = useState(false);
  const [rewardAmount] = useState(REWARD_AMOUNT);

  // Service Worker Registration
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/ServiceWorker.js")
        .then((registration) => {
          console.log("[ServiceWorker] Registered successfully:", registration.scope);
        })
        .catch((error) => {
          console.error("[ServiceWorker] Registration failed:", error);
        });
    }
  }, []);

  // Auth Routing and Splash Logic
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

  // --- Ad Engine Countdown ---
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (adActive && adCountdown > 0) {
      interval = setInterval(() => {
        setAdCountdown((prev) => prev - 1);
      }, 1000);
    } else if (adActive && adCountdown === 0) {
      setAdActive(false);
      setShowRewardModal(true);
    }

    return () => clearInterval(interval);
  }, [adActive, adCountdown]);

  // Handle Manual Navbar Dispatched Action
  useEffect(() => {
    const startPremiumSequence = () => {
      setAdCountdown(5);
      setAdActive(true);
    };

    window.addEventListener("openShopBalanceModal", startPremiumSequence);
    return () => window.removeEventListener("openShopBalanceModal", startPremiumSequence);
  }, []);

  const totalDuration = 5;
  const progressPercent = ((totalDuration - adCountdown) / totalDuration) * 100;

  return (
    <>
      <style>{`
        @keyframes cyberPulse {
          0%, 100% { transform: scale(1); filter: drop-shadow(0 0 15px rgba(245,158,11,0.4)); }
          50% { transform: scale(1.03); filter: drop-shadow(0 0 35px rgba(239,68,68,0.7)); }
        }
        .animate-cyber-pulse { animation: cyberPulse 2s infinite ease-in-out; }
      `}</style>

      {/* REWARD SEQUENCE OVERLAY */}
      {adActive && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-[#020205]/95 backdrop-blur-2xl">
          <div className="relative w-full max-w-md bg-zinc-950 border border-cyan-500/30 rounded-3xl p-6 sm:p-8 shadow-[0_0_50px_rgba(6,182,212,0.15)] text-center flex flex-col items-center gap-5 overflow-hidden">
            <div className="flex flex-col items-center space-y-2">
              <div className="inline-flex items-center px-4 py-1.5 bg-black/60 border border-cyan-500/30 rounded-full">
                <span className="text-[10px] font-black text-cyan-400 tracking-widest uppercase">
                  REWARD SEQUENCE
                </span>
                <span className="ml-2 text-xl font-black text-amber-400">{adCountdown}s</span>
              </div>
              <h2 className="text-lg font-black text-white tracking-tight uppercase">
                Syncing Reward Transaction...
              </h2>
              <p className="text-zinc-400 text-xs px-2">
                Verifying claim in real-time. Do not navigate away.
              </p>
            </div>

            <div className="w-full h-2 bg-zinc-900 rounded-full overflow-hidden border border-cyan-500/20">
              <div
                className="h-full bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-500 transition-all duration-1000 ease-linear"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            <div className="grid grid-cols-3 gap-2 w-full">
              <div className="flex flex-col items-center p-2.5 bg-black/40 rounded-xl border border-cyan-500/20">
                <span className="text-[9px] text-zinc-500 uppercase font-bold">Tier</span>
                <span className="text-xs font-black text-cyan-400">MAX</span>
              </div>
              <div className="flex flex-col items-center p-2.5 bg-black/40 rounded-xl border border-amber-500/20">
                <span className="text-[9px] text-zinc-500 uppercase font-bold">Reward</span>
                <span className="text-xs font-black text-amber-400">+50K</span>
              </div>
              <div className="flex flex-col items-center p-2.5 bg-black/40 rounded-xl border border-emerald-500/20">
                <span className="text-[9px] text-zinc-500 uppercase font-bold">Status</span>
                <span className="text-xs font-black text-emerald-400 animate-pulse">
                  VERIFYING
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CLAIM REWARD MODAL */}
      {showRewardModal && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="relative bg-[#0d111c] border border-amber-500/40 p-6 sm:p-8 rounded-3xl max-w-sm w-full text-center flex flex-col items-center gap-5 shadow-[0_0_50px_rgba(245,158,11,0.2)]">
            <div className="relative w-20 h-20 bg-gradient-to-b from-amber-400 to-orange-600 rounded-full flex items-center justify-center text-4xl shadow-lg border-2 border-[#0d111c] animate-bounce">
              🪙
              <Sparkles className="absolute -top-1 -right-1 text-yellow-300 animate-spin" size={20} />
            </div>

            <div className="space-y-1">
              <h3 className="text-2xl font-black text-white tracking-tight uppercase">
                BOUNTY SECURED!
              </h3>
              <p className="text-zinc-400 text-xs">
                Verification complete. Account credited with:
              </p>
              <div className="inline-block px-4 py-1.5 bg-amber-500/10 border border-amber-500/30 rounded-full text-amber-400 font-black text-lg mt-2">
                +{rewardAmount.toLocaleString()} COINS
              </div>
            </div>

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
              className="w-full py-3.5 px-6 bg-gradient-to-r from-amber-500 via-orange-500 to-yellow-500 hover:brightness-110 text-slate-950 font-black text-xs tracking-wider rounded-xl transition-all active:scale-95 uppercase"
            >
              COLLECT REWARD
            </button>
          </div>
        </div>
      )}

      {/* Main Page Body Container */}
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