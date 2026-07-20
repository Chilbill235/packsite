"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import Navbar from "@/components/Navbar";
import { Analytics } from "@vercel/analytics/next";
import { Volume2, VolumeX, Sparkles, X, Trophy, Swords, Zap, Gift } from "lucide-react";

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
  const [isMuted, setIsMuted] = useState(false);

  // Splash Screen Logic - Modified to only show on the home page ("/")
  useEffect(() => {
    if (status === "loading") return;
    
    const isPublicPage = pathname === "/login" || pathname === "/register";
    
    if (status !== "authenticated" && !isPublicPage) {
      router.replace("/login");
    } else if (status === "authenticated" && pathname === "/") {
      // Redirect out of home page immediately to your store or shop page
      router.replace("/shop");
    } else {
      // If we are already on a deep page (e.g., /profile), skip the splash delay entirely
      if (pathname !== "/") {
        setLoading(false);
      } else {
        const timer = setTimeout(() => {
          setFadeOut(true);
          setTimeout(() => setLoading(false), 800);
        }, 1500);
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

  // Handle Manual Navbar Dispatched Action Click
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
      {/* Dynamic Global Inject Animations */}
      <style>{`
        @keyframes cyberPulse {
          0%, 100% { transform: scale(1); filter: drop-shadow(0 0 15px rgba(245,158,11,0.4)); }
          50% { transform: scale(1.03); filter: drop-shadow(0 0 35px rgba(239,68,68,0.7)); }
        }
        @keyframes scanline {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(100%); }
        }
        .animate-cyber-pulse { animation: cyberPulse 2s infinite ease-in-out; }
        .scanline-effect::after {
          content: " "; display: block; position: absolute; top: 0; left: 0; right: 0; bottom: 0;
          background: linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.06), rgba(0, 255, 0, 0.02), rgba(0, 0, 255, 0.06));
          z-index: 20; background-size: 100% 2px, 3px 100%; pointer-events: none;
        }
      `}</style>

      {/* 50,000X BETTER ULTRA ARCADE AD STAGE OVERLAY */}
      {adActive && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-[#020205]/95 scanline-effect backdrop-blur-2xl">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f2937_1px,transparent_1px),linear-gradient(to_bottom,#1f2937_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_600px_400px_at_center,black_30%,transparent_80%)] opacity-40" />

          <div className="relative w-full max-w-md bg-gradient-to-br from-[#0a0a0a] to-[#030303] border-2 border-cyan-500/30 rounded-3xl p-8 shadow-[0_0_60px_rgba(6,182,212,0.15)] text-center flex flex-col items-center gap-6 overflow-hidden">
            <div className="absolute -top-20 -inset-x-10 h-48 bg-gradient-to-b from-cyan-500/20 to-transparent blur-3xl" />

            <div className="flex flex-col items-center space-y-2">
              <div className="inline-flex items-center px-4 py-2 bg-black/50 border border-cyan-500/30 rounded-full">
                <span className="text-[11px] font-black text-cyan-400 tracking-widest">REWARD SEQUENCE</span>
                <span className="ml-2 text-2xl font-black text-amber-400">{adCountdown}</span>
              </div>
              <h2 className="text-xl font-black text-white tracking-tight uppercase">
                Syncing Reward Transaction...
              </h2>
              <p className="text-slate-400 text-sm font-light px-3 max-w-xs">
                Do not close this window. Our servers verify your claim in real-time.
              </p>
            </div>

            <div className="w-full max-w-xs h-2.5 bg-slate-900/70 rounded-full overflow-hidden border border-cyan-500/20">
              <div 
                className="h-full bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-500 shadow-[0_0_15px_#3b82f6] transition-all duration-1000 ease-linear"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            <div className="grid grid-cols-3 gap-3 w-full max-w-xs">
              <div className="flex flex-col items-center p-3 bg-black/40 rounded-xl border border-cyan-500/20">
                <span className="text-[10px] text-slate-500 uppercase tracking-wider">Tier</span>
                <span className="text-sm font-black text-cyan-400">MAXIMUM</span>
              </div>
              <div className="flex flex-col items-center p-3 bg-black/40 rounded-xl border border-amber-500/20">
                <span className="text-[10px] text-slate-500 uppercase tracking-wider">Reward</span>
                <span className="text-sm font-black text-amber-400">+50,000</span>
              </div>
              <div className="flex flex-col items-center p-3 bg-black/40 rounded-xl border border-emerald-500/20">
                <span className="text-[10px] text-slate-500 uppercase tracking-wider">Status</span>
                <span className="text-sm font-black text-emerald-400 animate-pulse">VERIFYING</span>
              </div>
            </div>

            <p className="text-slate-500 text-xs px-4 max-w-sm">
              Your premium claim is being processed across multiple blockchain shards and challenge developers live in global servers!
            </p>

            <div className="absolute bottom-0 left-0 right-0 h-2 bg-slate-900 z-20">
              <div 
                className="h-full bg-gradient-to-r from-cyan-500 via-indigo-500 to-purple-500 shadow-[0_0_15px_#3b82f6] transition-all duration-1000 ease-linear"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* DYNAMIC HYPER-GLOW REWARD COLLECTOR MODAL */}
      {showRewardModal && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/85 backdrop-blur-md">
          <div className="relative bg-[#0d111c] border-2 border-amber-500/40 p-8 rounded-[2.5rem] max-w-sm w-full mx-4 shadow-[0_0_60px_rgba(245,158,11,0.25)] text-center flex flex-col items-center gap-6 overflow-hidden">
            
            <div className="absolute top-[-50px] w-64 h-64 bg-amber-500/10 rounded-full blur-[60px] pointer-events-none" />

            <div className="relative w-24 h-24 bg-gradient-to-b from-amber-400 to-orange-600 text-slate-950 rounded-full flex items-center justify-center text-5xl font-black shadow-[0_0_40px_rgba(245,158,11,0.4)] border-4 border-[#0d111c] animate-bounce">
              🪙
              <Sparkles className="absolute -top-1 -right-1 text-yellow-300 animate-spin" style={{ animationDuration: '6s' }} size={22} />
            </div>

            <div className="space-y-2">
              <h3 className="text-3xl font-black text-white tracking-tighter uppercase">BOUNTY SECURED!</h3>
              <p className="text-slate-400 text-sm px-2">
                Verification complete. Your profile account has been directly credited with:
              </p>
              <div className="inline-block px-4 py-1.5 bg-amber-500/10 border border-amber-500/30 rounded-full text-amber-400 font-black tracking-wide text-xl mt-1">
                +{rewardAmount.toLocaleString()} COINS
              </div>
            </div>

            <button
              onClick={async () => {
                try {
                  const response = await fetch("/api/user/verify-ad-claim", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" }
                  });

                  if (response.ok) {
                    const data = await response.json();
                    window.dispatchEvent(
                      new CustomEvent("balanceUpdated", {
                        detail: { balance: Number(data.newBalance) },
                      })
                    );
                  } else {
                    const errorData = await response.json();
                    if (response.status === 429) {
                      alert(errorData.error || "Reward is on cooldown. Please try again later.");
                    }
                  }
                } catch (error) {
                  window.console.error("Failed to claim ad reward:", error);
                } finally {
                  setShowRewardModal(false);
                }
              }}
              className="w-full py-4 px-6 bg-gradient-to-r from-amber-500 via-orange-500 to-yellow-500 hover:brightness-110 text-slate-950 font-black text-xs tracking-widest rounded-2xl transition-all shadow-xl shadow-orange-500/20 active:scale-95 duration-150 uppercase"
            >
              COLLECT FROM HUDBOX
            </button>
          </div>
        </div>
      )}

      {/* Main Framework Content Container Layout */}
      <div className="min-h-screen flex flex-col bg-[#070707]">
        {pathname !== "/login" && pathname !== "/register" && <Navbar />}
        
        {/* If loading is true and we're on the root route, you can render a placeholder splash element here if desired */}
        <main className="flex-grow w-full pt-6 bg-[#070707]">
          {loading && pathname === "/" ? (
            <div className={`fixed inset-0 z-[99999] bg-black flex items-center justify-center transition-opacity duration-700 ${fadeOut ? 'opacity-0' : 'opacity-100'}`}>
              <div className="text-center space-y-4">
                <div className="w-16 h-16 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" />
                <h1 className="text-xl font-black tracking-widest text-white uppercase animate-pulse">Loading PackSite...</h1>
              </div>
            </div>
          ) : children}
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