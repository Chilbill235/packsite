"use client";
import { useEffect, useState } from "react";

export default function InstallPrompt() {
  const [isIOS, setIsIOS] = useState(false);
  const [show, setShow] = useState(false);

  useEffect(() => {
    setIsIOS(/iPad|iPhone|iPod/.test(navigator.userAgent));
    // Small delay to make the popup feel "native" rather than jarring
    const timer = setTimeout(() => setShow(true), 2000);
    return () => clearTimeout(timer);
  }, []);

  if (!show) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 p-6 bg-zinc-900/90 backdrop-blur-xl border-t border-zinc-800 rounded-t-3xl z-[9999] shadow-2xl animate-in slide-in-from-bottom">
      <div className="flex flex-col items-center gap-3">
        <div className="w-12 h-12 bg-zinc-800 rounded-2xl flex items-center justify-center font-bold text-xl">PS</div>
        <div className="text-center">
          <h3 className="font-bold text-lg">Install PackSite</h3>
          <p className="text-zinc-400 text-sm">
            {isIOS 
              ? 'Tap "Share" 📤 and "Add to Home Screen"' 
              : 'Add to your home screen for instant access'}
          </p>
        </div>
        <button onClick={() => setShow(false)} className="text-zinc-500 text-xs mt-2">Dismiss</button>
      </div>
    </div>
  );
}