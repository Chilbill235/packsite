"use client";

import { useEffect, useState, useRef } from "react";

type WatchAdModalProps = {
  open: boolean;
  onFinished: () => void;
  onClose: () => void;
  rewardAmount?: string;
  tierName?: string;
  multiplier?: string;
};

export default function WatchAdModal({
  open,
  onFinished,
  onClose,
  rewardAmount = "+50,000",
  tierName = "MAXIMUM",
  multiplier = "2.5x BOOST",
}: WatchAdModalProps) {
  const [isSdkLoaded, setIsSdkLoaded] = useState(false);
  const [isAdLoading, setIsAdLoading] = useState(true);
  const [progress, setProgress] = useState(12);
  const [ping, setPing] = useState(24);
  const [packets, setPackets] = useState(0);
  const [adStatus, setAdStatus] = useState<
    "AUTHENTICATING" | "CONNECTING NODE" | "STREAMING DATA" | "VERIFYING BLOCKCHAIN"
  >("AUTHENTICATING");

  const sdkLoadingRef = useRef(false);
  const sdkLoadedRef = useRef(false);

  // Live telemetry simulation (Ping & Packets processed)
  useEffect(() => {
    if (!open) return;

    const telemetryInterval = setInterval(() => {
      setPing(Math.floor(20 + Math.random() * 12));
      setPackets((prev) => prev + Math.floor(12 + Math.random() * 25));
    }, 400);

    return () => clearInterval(telemetryInterval);
  }, [open]);

  // Load Applixir SDK
  useEffect(() => {
    if (!open) return;

    if (sdkLoadedRef.current) {
      setIsSdkLoaded(true);
      return;
    }

    if (sdkLoadingRef.current) return;
    sdkLoadingRef.current = true;

    const progressTimer = setInterval(() => {
      setProgress((prev) => (prev < 55 ? prev + 4 : prev));
    }, 120);

    const script = document.createElement("script");
    script.src = "https://cdn.applixir.com/applixir.app.v6.1.0.js";
    script.async = true;
    script.onload = () => {
      clearInterval(progressTimer);
      sdkLoadedRef.current = true;
      setIsSdkLoaded(true);
      setProgress(75);
      setAdStatus("CONNECTING NODE");
    };
    script.onerror = () => {
      clearInterval(progressTimer);
      console.error("[WatchAdModal] Failed to load Applixir SDK");
      setAdStatus("VERIFYING BLOCKCHAIN");
    };
    document.head.appendChild(script);

    return () => clearInterval(progressTimer);
  }, [open]);

  // Launch Player when SDK is ready
  useEffect(() => {
    if (!open || !isSdkLoaded) return;

    if (typeof (window as any).initializeAndOpenPlayer === "function") {
      setAdStatus("STREAMING DATA");
      setIsAdLoading(false);
      setProgress(90);

      const options = {
        apiKey: "6c5dc649-a3f2-4fd5-907f-9a9d7d6f5422",
        injectionElementId: "applixir_vanishing_ad",
        adStatusCallbackFn: (status: { type: string }) => {
          if (status.type === "complete") {
            setAdStatus("VERIFYING BLOCKCHAIN");
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
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/92 backdrop-blur-3xl animate-in fade-in zoom-in-95 duration-300">
      
      {/* Dynamic Cyber Grid Background */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-25" 
        style={{
          backgroundImage: `
            radial-gradient(circle at 50% 50%, rgba(6, 182, 212, 0.4) 0%, rgba(147, 51, 234, 0.2) 45%, transparent 75%),
            linear-gradient(to right, rgba(6, 182, 212, 0.1) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(6, 182, 212, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: '100% 100%, 28px 28px, 28px 28px'
        }}
      />

      {/* Main Glass Card Wrapper */}
      <div className="w-full max-w-xl relative group">
        
        {/* Animated Laser Glow Halo */}
        <div className="absolute -inset-[2px] bg-gradient-to-r from-cyan-500 via-indigo-500 via-purple-500 to-cyan-500 rounded-[30px] blur-xl opacity-80 group-hover:opacity-100 transition duration-1000 animate-pulse" />

        <div className="relative w-full bg-zinc-950/95 border border-cyan-500/40 rounded-[28px] p-6 sm:p-8 shadow-[0_0_90px_rgba(6,182,212,0.25)] backdrop-blur-3xl overflow-hidden">
          
          {/* Top Holographic Laser Accent Bar */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_20px_#06b6d4]" />

          {/* Top System Header Bar */}
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-zinc-800/80">
            <div className="flex items-center gap-2 px-3 py-1 rounded-full border border-cyan-500/40 bg-cyan-950/50 backdrop-blur-md shadow-[0_0_15px_rgba(6,182,212,0.2)]">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
              <span className="font-mono text-[11px] font-black uppercase tracking-widest text-cyan-300">
                Reward Sequence <span className="text-amber-400 ml-1">02</span>
              </span>
            </div>

            {/* Live Telemetry Ping Counter */}
            <div className="flex items-center gap-3 font-mono text-[10px] text-zinc-400">
              <div className="flex items-center gap-1.5 bg-zinc-900/90 px-2.5 py-1 rounded-md border border-zinc-800">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>{ping}ms</span>
              </div>
              <div className="hidden sm:flex items-center gap-1 bg-zinc-900/90 px-2.5 py-1 rounded-md border border-zinc-800 text-cyan-400">
                <span>PKTS: {packets}</span>
              </div>
            </div>
          </div>

          {/* Dynamic Title */}
          <h2 className="text-2xl sm:text-3xl font-black text-white text-center tracking-tight uppercase mb-1 drop-shadow-[0_0_20px_rgba(255,255,255,0.3)]">
            Syncing Reward Stream
          </h2>
          
          <p className="text-zinc-400 text-center text-xs mb-5 max-w-sm mx-auto leading-relaxed">
            Do not close this window. Our distributed verification engine is processing your claim in real-time.
          </p>

          {/* Multi-Stage Neon Progress Bar with Percentage Indicator */}
          <div className="mb-5">
            <div className="flex justify-between items-center text-[10px] font-mono text-zinc-400 mb-1.5 px-1">
              <span className="uppercase tracking-wider text-cyan-400 font-bold">Pipeline Sync</span>
              <span className="font-bold text-amber-400">{progress}%</span>
            </div>
            <div className="relative w-full bg-zinc-900/90 h-3.5 rounded-full overflow-hidden border border-zinc-800 p-0.5 shadow-inner">
              <div 
                className="h-full bg-gradient-to-r from-cyan-400 via-indigo-500 to-purple-500 rounded-full transition-all duration-500 ease-out shadow-[0_0_20px_#06b6d4] relative" 
                style={{ width: `${progress}%` }} 
              >
                <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_0%,rgba(255,255,255,0.5)_50%,transparent_100%)] animate-[shimmer_1.5s_infinite]" />
              </div>
            </div>
          </div>

          {/* Holographic Video Screen Viewport */}
          <div className="relative w-full rounded-2xl bg-zinc-950 border border-cyan-500/30 overflow-hidden mb-5 shadow-[inset_0_0_35px_rgba(0,0,0,0.95)] min-h-[260px] flex items-center justify-center">
            
            {/* Sci-Fi Target Brackets */}
            <div className="absolute top-2.5 left-2.5 w-3.5 h-3.5 border-t-2 border-l-2 border-cyan-400/70 z-20 pointer-events-none" />
            <div className="absolute top-2.5 right-2.5 w-3.5 h-3.5 border-t-2 border-r-2 border-cyan-400/70 z-20 pointer-events-none" />
            <div className="absolute bottom-2.5 left-2.5 w-3.5 h-3.5 border-b-2 border-l-2 border-cyan-400/70 z-20 pointer-events-none" />
            <div className="absolute bottom-2.5 right-2.5 w-3.5 h-3.5 border-b-2 border-r-2 border-cyan-400/70 z-20 pointer-events-none" />

            {/* CRT Scanline Texture Overlay */}
            <div 
              className="absolute inset-0 pointer-events-none opacity-15 z-20"
              style={{
                backgroundImage: 'repeating-linear-gradient(0deg, #000, #000 2px, transparent 2px, transparent 4px)'
              }}
            />

            {/* Applixir Target Slot */}
            <div id="applixir_vanishing_ad" className="w-full h-full min-h-[260px] flex items-center justify-center z-10" />

            {/* High-Tech Orbital Loader */}
            {isAdLoading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-950/95 z-30 space-y-4">
                <div className="relative flex items-center justify-center">
                  <div className="w-16 h-16 rounded-full border-2 border-cyan-500/20 border-t-cyan-400 animate-spin" />
                  <div className="absolute w-10 h-10 rounded-full border-2 border-purple-500/20 border-b-purple-400 animate-spin [animation-direction:reverse]" />
                  <div className="absolute w-3 h-3 rounded-full bg-cyan-300 animate-ping" />
                </div>
                
                <div className="text-center space-y-1">
                  <span className="block text-xs font-mono font-black text-cyan-400 uppercase tracking-widest animate-pulse">
                    Connecting Encrypted Stream Tunnel...
                  </span>
                  <span className="block text-[10px] text-zinc-500 font-mono">
                    Routing node: US-EAST-SHARD-04
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Dynamic Audio Visualizer Bar Accent */}
          <div className="flex justify-center items-center gap-1.5 mb-5 opacity-80">
            <span className="w-1 h-3 bg-cyan-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
            <span className="w-1 h-5 bg-purple-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
            <span className="w-1 h-2 bg-indigo-400 rounded-full animate-bounce" />
            <span className="w-1 h-6 bg-cyan-400 rounded-full animate-bounce [animation-delay:-0.25s]" />
            <span className="w-1 h-3 bg-purple-400 rounded-full animate-bounce [animation-delay:-0.1s]" />
          </div>

          {/* 4-Column High Tech Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-5">
            <div className="bg-zinc-900/80 border border-cyan-500/20 hover:border-cyan-500/50 rounded-xl p-2.5 text-center backdrop-blur-md transition-all">
              <span className="block text-[9px] text-zinc-500 font-mono uppercase tracking-widest mb-0.5">Tier</span>
              <span className="text-xs sm:text-sm font-black text-cyan-400 font-mono tracking-wider drop-shadow-[0_0_8px_rgba(6,182,212,0.4)]">
                {tierName}
              </span>
            </div>

            <div className="bg-zinc-900/80 border border-amber-500/20 hover:border-amber-500/50 rounded-xl p-2.5 text-center backdrop-blur-md transition-all">
              <span className="block text-[9px] text-zinc-500 font-mono uppercase tracking-widest mb-0.5">Reward</span>
              <span className="text-xs sm:text-sm font-black text-amber-400 font-mono tracking-wider drop-shadow-[0_0_8px_rgba(251,191,36,0.4)]">
                {rewardAmount}
              </span>
            </div>

            <div className="bg-zinc-900/80 border border-purple-500/20 hover:border-purple-500/50 rounded-xl p-2.5 text-center backdrop-blur-md transition-all">
              <span className="block text-[9px] text-zinc-500 font-mono uppercase tracking-widest mb-0.5">Boost</span>
              <span className="text-xs sm:text-sm font-black text-purple-400 font-mono tracking-wider drop-shadow-[0_0_8px_rgba(168,85,247,0.4)]">
                {multiplier}
              </span>
            </div>

            <div className="bg-zinc-900/80 border border-emerald-500/20 hover:border-emerald-500/50 rounded-xl p-2.5 text-center backdrop-blur-md transition-all">
              <span className="block text-[9px] text-zinc-500 font-mono uppercase tracking-widest mb-0.5">Status</span>
              <span className="text-[10px] sm:text-xs font-black text-emerald-400 font-mono tracking-tight animate-pulse leading-tight">
                {adStatus}
              </span>
            </div>
          </div>

          {/* Subtext Protocol Footer */}
          <p className="text-[10px] sm:text-[11px] text-zinc-500 text-center mb-5 px-2 leading-relaxed font-mono">
            Your premium claim is being processed across multiple blockchain shards and challenge developers live in global servers!
          </p>

          {/* Action Cancel Button */}
          <button
            onClick={onClose}
            className="w-full py-3.5 rounded-xl font-mono text-xs font-black uppercase tracking-widest text-zinc-300 hover:text-white bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-cyan-500/50 transition-all duration-200 shadow-xl active:scale-[0.98]"
          >
            Cancel Sequence
          </button>

        </div>
      </div>
    </div>
  );
}