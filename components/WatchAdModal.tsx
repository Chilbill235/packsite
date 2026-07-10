"use client";

import { useEffect } from "react";
import Script from "next/script";

type WatchAdModalProps = {
  open: boolean;
  onFinished: () => void;
  onClose: () => void;
};

export default function WatchAdModal({ open, onFinished, onClose }: WatchAdModalProps) {
  // We use a passive timer just to grant the reward automatically after 15s
  useEffect(() => {
    if (!open) return;
    
    const timer = setTimeout(() => {
      onFinished();
    }, 15000);
    
    return () => clearTimeout(timer);
  }, [open, onFinished]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
      <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-3xl p-8 shadow-2xl relative">
        
        <h2 className="text-2xl font-black text-white text-center mb-2">
          Support Us
        </h2>
        <p className="text-zinc-400 text-center text-sm mb-6">
          Thank you for supporting our creators by viewing this message.
        </p>

        {/* Ad Container with explicit dimensions to stop console errors */}
        <div className="bg-black min-h-[250px] w-full flex items-center justify-center rounded-2xl overflow-hidden border border-zinc-800 mb-6">
          <ins
            className="adsbygoogle"
            style={{ display: "block", minHeight: "250px", width: "100%" }}
            data-ad-client="ca-pub-1167000799645777"
            data-ad-slot="9699378693"
            data-ad-format="auto"
            data-full-width-responsive="true"
          ></ins>
        </div>

        {/* Closing the modal is always allowed, no forced waiting */}
        <button
          onClick={onClose}
          className="w-full py-4 rounded-2xl font-bold bg-zinc-800 hover:bg-zinc-700 text-white transition-all"
        >
          Close
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