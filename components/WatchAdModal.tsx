"use client";

import { useEffect, useState, useRef } from "react";

type WatchAdModalProps = {
  open: boolean;
  onFinished: () => void;
  onClose: () => void;
  rewardAmount?: string;
  tierName?: string;
};

export default function WatchAdModal({
  open,
  onFinished,
  onClose,
  rewardAmount = "+50,000",
  tierName = "MAXIMUM",
}: WatchAdModalProps) {
  const [isSdkLoaded, setIsSdkLoaded] = useState(false);
  const [isAdLoading, setIsAdLoading] = useState(true);
  const [adStatus, setAdStatus] = useState<"LOADING" | "VERIFYING" | "PLAYING" | "READY">("LOADING");
  
  const sdkLoadingRef = useRef(false);
  const sdkLoadedRef = useRef(false);

  // Load Applixir SDK once across app lifecycle
  useEffect(() => {
    if (!open) return;

    if (sdkLoadedRef.current) {
      setIsSdkLoaded(true);
      return;
    }

    if (sdkLoadingRef.current) return;
    sdkLoadingRef.current = true;

    const script = document.createElement("script");
    script.src = "https://cdn.applixir.com/applixir.app.v6.1.0.js";
    script.async = true;
    script.onload = () => {
      sdkLoadedRef.current = true;
      setIsSdkLoaded(true);
    };
    script.onerror = () => {
      console.error("[WatchAdModal] Failed to load Applixir SDK");
      setAdStatus("VERIFYING");
    };
    document.head.appendChild(script);
  }, [open]);

  // Initialize and launch ad player
  useEffect(() => {
    if (!open || !isSdkLoaded) return;

    if (typeof (window as any).initializeAndOpenPlayer === "function") {
      setAdStatus("PLAYING");
      setIsAdLoading(false);

      const options = {
        apiKey: "6c5dc649-a3f2-4fd5-907f-9a9d7d6f5422",
        injectionElementId: "applixir_vanishing_ad",
        adStatusCallbackFn: (status: { type: string }) => {
          if (status.type === "complete") {
            setAdStatus("VERIFYING");
            onFinished();
            onClose();
          } else if (status.type === "skipped" || status.type === "manuallyEnded") {
            onClose();
          }
        },
      };

      try {
        (window as any).initializeAndOpenPlayer(options);
      } catch (err) {
        console.error("[WatchAdModal] Error initializing ad player:", err);
      }
    }
  }, [open, isSdkLoaded, onFinished, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl animate-in fade-in duration-300">
      {/* Background Grid Pattern */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-20" 
        style={{
          backgroundImage: `radial-gradient(circle at 50% 50%, rgba(6, 182, 212, 0.15) 0%, transparent 60%), 
                            linear-gradient(to right, rgba(255,255,255,0.05) 1px, transparent 1px), 
                            linear-gradient(to bottom, rgba(255,255,255,0.05) 1px, transparent 1px)`,
          backgroundSize: '100% 100%, 24px 24px, 24px 24px'
        }}
      />

      {/* Main Glass Card */}
      <div className="w-full max-w-lg relative bg-black/80 border border-cyan-500/30 rounded-3xl p-6 sm:p-8 shadow-[0_0_50px_-12px_rgba(6,182,212,0.25)] backdrop-blur-2xl transition-all duration-300">
        
        {/* Top Glow Accent Bar */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-[1px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_10px_#06b6d4]" />

        {/* Header Badge */}
        <div className="flex justify-center mb-4">
          <div className="px-4 py-1 rounded-full border border-cyan-500/40 bg-cyan-950/30 text-cyan-400 font-mono text-xs font-semibold uppercase tracking-wider shadow-[0_0_15px_rgba(6,182,212,0.2)]">
            Reward Sequence <span className="text-yellow-400 font-extrabold ml-1">2</span>
          </div>
        </div>

        {/* Dynamic Title */}
        <h2 className="text-2xl sm:text-3xl font-black text-white text-center tracking-tight uppercase mb-2 drop-shadow-[0_2px_10px_rgba(255,255,255,0.1)]">
          Syncing Reward Transaction...
        </h2>
        
        <p className="text-zinc-400 text-center text-xs sm:text-sm mb-6 max-w-xs mx-auto leading-relaxed">
          Do not close this window. Our servers verify your claim in real-time.
        </p>

        {/* Animated Loading Bar Header */}
        <div className="w-full bg-zinc-900/90 h-2 rounded-full overflow-hidden mb-6 border border-zinc-800">
          <div className="h-full bg-gradient-to-r from-cyan-500 via-indigo-500 to-purple-500 rounded-full animate-pulse shadow-[0_0_12px_#06b6d4]" style={{ width: '65%' }} />
        </div>

        {/* Ad Video / Stream Frame Container */}
        <div className="relative w-full rounded-2xl bg-zinc-950 border border-cyan-500/20 overflow-hidden mb-6 shadow-inner min-h-[260px] flex items-center justify-center">
          
          {/* Ad Container Slot */}
          <div id="applixir_vanishing_ad" className="w-full h-full min-h-[260px] flex items-center justify-center z-10" />

          {/* Skeleton Loader Displayed Before Video Load */}
          {isAdLoading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-950/90 z-0 p-4 space-y-3">
              <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
              <span className="text-xs font-mono text-cyan-400 uppercase tracking-widest animate-pulse">
                Initializing Video Stream...
              </span>
            </div>
          )}
        </div>

        {/* Real-time Status Badges */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-3 text-center">
            <span className="block text-[10px] text-zinc-500 font-mono uppercase tracking-wider mb-0.5">Tier</span>
            <span className="text-xs sm:text-sm font-extrabold text-cyan-400 font-mono tracking-tight">{tierName}</span>
          </div>

          <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-3 text-center">
            <span className="block text-[10px] text-zinc-500 font-mono uppercase tracking-wider mb-0.5">Reward</span>
            <span className="text-xs sm:text-sm font-extrabold text-amber-400 font-mono tracking-tight">{rewardAmount}</span>
          </div>

          <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-3 text-center">
            <span className="block text-[10px] text-zinc-500 font-mono uppercase tracking-wider mb-0.5">Status</span>
            <span className="text-xs sm:text-sm font-extrabold text-emerald-400 font-mono tracking-tight animate-pulse">{adStatus}</span>
          </div>
        </div>

        {/* Explanatory Footer Note */}
        <p className="text-[11px] text-zinc-500 text-center mb-6 px-2 leading-relaxed font-mono">
          Your premium claim is being processed across multiple blockchain shards and challenge developers live in global servers!
        </p>

        {/* Bottom Progress Accent */}
        <div className="w-full bg-zinc-900/90 h-1.5 rounded-full overflow-hidden mb-6 border border-zinc-800/50">
          <div className="h-full bg-gradient-to-r from-cyan-400 to-purple-600 rounded-full" style={{ width: '42%' }} />
        </div>

        {/* Action Button */}
        <button
          onClick={onClose}
          className="w-full py-3.5 rounded-2xl font-bold text-sm bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 hover:border-zinc-700 transition-all duration-200 shadow-lg active:scale-[0.99]"
        >
          Cancel Sequence
        </button>
      </div>
    </div>
  );
}