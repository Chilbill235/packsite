"use client";

import { useEffect } from "react";
import Script from "next/script";

type WatchAdModalProps = {
  open: boolean;
  onFinished: () => void;
  onClose: () => void;
};

export default function WatchAdModal({ open, onFinished, onClose }: WatchAdModalProps) {
  useEffect(() => {
    // Only initialize if the modal is open and the SDK is loaded
    if (!open || typeof window === "undefined" || !(window as any).initializeAndOpenPlayer) return;

    const options = {
      apiKey: "6c5dc649-a3f2-4fd5-907f-9a9d7d6f5422",
      adStatusCallbackFn: (status: string) => {
        // 'ad-watched' is the status for a completed video in the v6 SDK
        if (status === "ad-watched") {
          onFinished(); 
          onClose();
        } else if (status === "ad-closed") {
          onClose();
        }
      },
    };

    (window as any).initializeAndOpenPlayer(options);
  }, [open, onFinished, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
      {/* Load the AppLixir SDK */}
      <Script 
        src="https://cdn.applixir.com/applixir.app.v6.1.0.js" 
        strategy="afterInteractive" 
      />

      <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-3xl p-8 shadow-2xl relative">
        <h2 className="text-2xl font-black text-white text-center mb-2">Support Us</h2>
        <p className="text-zinc-400 text-center text-sm mb-6">
          Thank you for supporting our creators by viewing this message.
        </p>
        
        {/* AppLixir container where the ad will render */}
        <div id="applixir_vanishing_ad" className="min-h-[250px] w-full flex items-center justify-center rounded-2xl bg-black border border-zinc-800 mb-6">
        </div>

        <button
          onClick={onClose}
          className="w-full py-4 rounded-2xl font-bold bg-zinc-800 hover:bg-zinc-700 text-white transition-all"
        >
          Close
        </button>
      </div>
    </div>
  );
}