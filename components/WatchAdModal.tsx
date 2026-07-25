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
  const [progress, setProgress] = useState(25);
  const [adStatus, setAdStatus] = useState<"INITIALIZING" | "BUFFERING" | "PLAYING" | "VERIFYING">("INITIALIZING");
  
  const sdkLoadingRef = useRef(false);
  const sdkLoadedRef = useRef(false);

  // Load Applixir SDK
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
      setProgress(50);
      setAdStatus("BUFFERING");
    };
    script.onerror = () => {
      console.error("[WatchAdModal] Failed to load Applixir SDK");
      setAdStatus("VERIFYING");
    };
    document.head.appendChild(script);
  }, [open]);

  // Launch Player
  useEffect(() => {
    if (!open || !isSdkLoaded) return;

    if (typeof (window as any).initializeAndOpenPlayer === "function") {
      setAdStatus("PLAYING");
      setIsAdLoading(false);
      setProgress(85);

      const options = {
        apiKey: "6c5dc649-a3f2-4fd5-907f-9a9d7d6f5422",
        injectionElementId: "applixir_vanishing_ad",
        adStatusCallbackFn: (status: { type: string }) => {
          if (status.type === "complete") {
            setAdStatus("VERIFYING");
            setProgress(100);
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
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/90 backdrop-blur-2xl animate-in fade-in zoom-in-95 duration-300">
      
      {/* Background Cybernetic Grid & Radial Aura */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-25" 
        style={{
          backgroundImage: `
            radial-gradient(circle at 50% 50%, rgba(6, 182, 212, 0.25) 0%, transparent 70%),
            linear-gradient(to right, rgba(6, 182, 212, 0.1) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(6, 182, 212, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: '100% 100%, 32px 32px, 32px 32px'
        }}
      />

      {/* Main Glass Card Wrapper */}
      <div className="w-full max-w-lg relative group">
        
        {/* Animated Neon Border Edge Glow */}
        <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500 via-indigo-500 to-purple-600 rounded-[28px] blur-md opacity-60 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-pulse" />

        <div className="relative w-full bg-zinc-950/90 border border-cyan-500/40 rounded-[26px] p-6 sm:p-8 shadow-2xl backdrop-blur-2xl overflow-hidden">
          
          {/* Top Holographic Scanline Light */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_15px_#06b6d4]" />

          {/* Header Pill */}
          <div className="flex justify-center mb-5">
            <div className="flex items-center gap-2 px-4 py-1.5 rounded-full border border-cyan-500/30 bg-cyan-950/40 backdrop-blur-md shadow-[0_0_20px_rgba(6,182,212,0.15)]">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
              <span className="font-mono text-xs font-bold uppercase tracking-widest text-cyan-300">
                Reward Sequence <span className="text-amber-400 ml-1">02</span>
              </span>
            </div>
          </div>

          {/* Header Text */}
          <h2 className="text-2xl sm:text-3xl font-black text-white text-center tracking-tight uppercase mb-2 drop-shadow-[0_0_12px_rgba(255,255,255,0.2)]">
            Syncing Reward Stream
          </h2>
          
          <p className="text-zinc-400 text-center text-xs sm:text-sm mb-6 max-w-xs mx-auto leading-relaxed font-sans">
            Do not close this window. Our servers verify your claim in real-time.
          </p>

          {/* Fluid Dynamic Progress Bar */}
          <div className="relative w-full bg-zinc-900/90 h-3 rounded-full overflow-hidden mb-6 border border-zinc-800 p-0.5 shadow-inner">
            <div 
              className="h-full bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-600 rounded-full transition-all duration-700 ease-out shadow-[0_0_15px_#06b6d4]" 
              style={{ width: `${progress}%` }} 
            />
          </div>

          {/* Ad Stage Viewport */}
          <div className="relative w-full rounded-2xl bg-zinc-950 border border-cyan-500/30 overflow-hidden mb-6 shadow-[inset_0_0_20px_rgba(0,0,0,0.8)] min-h-[260px] flex items-center justify-center">
            
            {/* Ambient Scanlines */}
            <div 
              className="absolute inset-0 pointer-events-none opacity-10"
              style={{
                backgroundImage: 'repeating-linear-gradient(0deg, #000, #000 2px, transparent 2px, transparent 4px)'
              }}
            />

            {/* Ad Container */}
            <div id="applixir_vanishing_ad" className="w-full h-full min-h-[260px] flex items-center justify-center z-10" />

            {/* High-Tech Loader overlay while SDK connects */}
            {isAdLoading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-950/95 z-20 space-y-4">
                <div className="relative flex items-center justify-center">
                  <div className="w-12 h-12 rounded-full border-2 border-cyan-500/20 border-t-cyan-400 animate-spin" />
                  <div className="absolute w-6 h-6 rounded-full border-2 border-purple-500/20 border-b-purple-400 animate-spin" />
                </div>
                <div className="text-center space-y-1">
                  <span className="block text-xs font-mono font-bold text-cyan-400 uppercase tracking-widest animate-pulse">
                    Initializing High-Speed Stream
                  </span>
                  <span className="block text-[10px] text-zinc-500 font-mono">Connecting to global node servers...</span>
                </div>
              </div>
            )}
          </div>

          {/* Interactive Status Grid */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="bg-zinc-900/70 border border-cyan-500/20 hover:border-cyan-500/40 rounded-xl p-3 text-center backdrop-blur-md transition-colors">
              <span className="block text-[10px] text-zinc-500 font-mono uppercase tracking-wider mb-1">Tier</span>
              <span className="text-xs sm:text-sm font-black text-cyan-400 font-mono tracking-wider drop-shadow-[0_0_8px_rgba(6,182,212,0.4)]">
                {tierName}
              </span>
            </div>

            <div className="bg-zinc-900/70 border border-amber-500/20 hover:border-amber-500/40 rounded-xl p-3 text-center backdrop-blur-md transition-colors">
              <span className="block text-[10px] text-zinc-500 font-mono uppercase tracking-wider mb-1">Reward</span>
              <span className="text-xs sm:text-sm font-black text-amber-400 font-mono tracking-wider drop-shadow-[0_0_8px_rgba(251,191,36,0.4)]">
                {rewardAmount}
              </span>
            </div>

            <div className="bg-zinc-900/70 border border-emerald-500/20 hover:border-emerald-500/40 rounded-xl p-3 text-center backdrop-blur-md transition-colors">
              <span className="block text-[10px] text-zinc-500 font-mono uppercase tracking-wider mb-1">Status</span>
              <span className="text-xs sm:text-sm font-black text-emerald-400 font-mono tracking-wider animate-pulse drop-shadow-[0_0_8px_rgba(52,211,153,0.4)]">
                {adStatus}
              </span>
            </div>
          </div>

          {/* Subtext Notice */}
          <p className="text-[11px] text-zinc-500 text-center mb-6 px-2 leading-relaxed font-mono">
            Your premium claim is being processed across multiple blockchain shards and challenge developers live in global servers!
          </p>

          {/* Cancel Button */}
          <button
            onClick={onClose}
            className="w-full py-3.5 rounded-xl font-mono text-xs font-bold uppercase tracking-wider text-zinc-400 hover:text-white bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-800 hover:border-cyan-500/50 transition-all duration-200 shadow-lg active:scale-[0.98]"
          >
            Cancel Sequence
          </button>

        </div>
      </div>
    </div>
  );
}