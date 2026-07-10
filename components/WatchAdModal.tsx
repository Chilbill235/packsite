"use client";

import { useEffect, useState } from "react";
import Script from "next/script";

type WatchAdModalProps = {
  open: boolean;
  onFinished: () => void;
  onClose: () => void;
};

export default function WatchAdModal({ open, onFinished, onClose }: WatchAdModalProps) {
  const [isDone, setIsDone] = useState(false);
  const [timeLeft, setTimeLeft] = useState(15);

  // Reset state when modal opens
  useEffect(() => {
    if (open) {
      setIsDone(false);
      setTimeLeft(15);
    }
  }, [open]);

  // Timer logic
  useEffect(() => {
    if (!open || isDone) return;

    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setIsDone(true);
      onFinished();
    }
  }, [open, timeLeft, isDone, onFinished]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
      <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-3xl p-8 shadow-2xl relative">
        
        <h2 className="text-2xl font-black text-white text-center mb-2">
          {isDone ? "Reward Ready!" : "Support Us"}
        </h2>
        <p className="text-zinc-400 text-center text-sm mb-6">
          {isDone ? "Your reward is ready to be collected." : "Please view the ad to earn your coins."}
        </p>

        {/* Ad Container */}
        <div className="bg-black min-h-[250px] flex items-center justify-center rounded-2xl overflow-hidden border border-zinc-800 mb-6">
          <ins
            className="adsbygoogle"
            style={{ display: "block" }}
            data-ad-client="ca-pub-1167000799645777"
            data-ad-slot="9699378693"
            data-ad-format="auto"
            data-full-width-responsive="true"
          ></ins>
        </div>

        {/* Action Button */}
        <button
          disabled={!isDone}
          onClick={onClose}
          className={`w-full py-4 rounded-2xl font-bold transition-all duration-300 ${
            isDone 
              ? "bg-amber-500 hover:bg-amber-400 text-black shadow-[0_0_20px_rgba(245,158,11,0.3)]" 
              : "bg-zinc-800 text-zinc-500 cursor-not-allowed"
          }`}
        >
          {isDone ? "Collect Reward" : `Wait ${timeLeft}s`}
        </button>

        {/* Initialize AdSense */}
        <Script
          id="adsbygoogle-init"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `(adsbygoogle = window.adsbygoogle || []).push({});`,
          }}
        />
      </div>
    </div>
  );
}