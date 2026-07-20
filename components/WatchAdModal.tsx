"use client";

import { useEffect, useState, useRef } from "react";

type WatchAdModalProps = {
  open: boolean;
  onFinished: () => void;
  onClose: () => void;
};

export default function WatchAdModal({ open, onFinished, onClose }: WatchAdModalProps) {
  const [isSdkLoaded, setIsSdkLoaded] = useState(false);
  const sdkLoadingRef = useRef(false);
  const sdkLoadedRef = useRef(false);

  // Manually inject the SDK script so we control loading lifecycle,
  // and keep a global flag so re-opens don't re-trigger onLoad.
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
    };
    document.head.appendChild(script);

    return () => {
      // Note: we intentionally do NOT remove the script tag so subsequent opens work.
    };
  }, [open]);

  // Initialize and open player when modal is open AND SDK is ready
  useEffect(() => {
    if (!open || !isSdkLoaded) return;

    if (typeof (window as any).initializeAndOpenPlayer === "function") {
      const options = {
        apiKey: "6c5dc649-a3f2-4fd5-907f-9a9d7d6f5422",
        injectionElementId: "applixir_vanishing_ad",
        adStatusCallbackFn: (status: { type: string }) => {
          if (status.type === "complete") {
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
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
      <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-3xl p-8 shadow-2xl relative">
        <h2 className="text-2xl font-black text-white text-center mb-2">Support Us</h2>
        <p className="text-zinc-400 text-center text-sm mb-6">
          Thank you for supporting our creators by viewing this message.
        </p>

        <div
          id="applixir_vanishing_ad"
          className="min-h-[250px] w-full flex items-center justify-center rounded-2xl bg-black border border-zinc-800 mb-6"
        />

        <button
          onClick={onClose}
          className="w-full py-4 rounded-2xl font-bold bg-zinc-800 hover:bg-zinc-700 text-white transition-all"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
