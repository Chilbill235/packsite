"use client";

import { useEffect, useState, useCallback } from "react";
import { usePathname } from "next/navigation";

// --- Types ---
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: Array<string>;
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
  prompt(): Promise<void>;
}

// --- Custom Hook for Clean Logic ---
function usePWAInstall() {
  const pathname = usePathname();
  const [isIOS, setIsIOS] = useState(false);
  const [show, setShow] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  const checkSnooze = useCallback(() => {
    try {
      const dismissedUntil = localStorage.getItem("install_prompt_dismissed");
      if (dismissedUntil && Date.now() < parseInt(dismissedUntil, 10)) return true;
    } catch {
      return false; // Failsafe if localStorage is corrupted
    }
    return false;
  }, []);

  useEffect(() => {
    // 1. Only run on /shop
    if (pathname !== "/shop") {
      setShow(false);
      return;
    }

    // 2. Check if already installed
    const isStandalone = 
      window.matchMedia('(display-mode: standalone)').matches || 
      (window.navigator as any).standalone === true;
    
    if (isStandalone || checkSnooze()) return;

    // 3. Detect Device accurately
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIOSDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIOSDevice);

    // 4. Handle Android/Chrome Prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt as any);

    // 5. Delay showing to not overwhelm the user immediately
    const timer = setTimeout(() => setShow(true), 2500);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt as any);
      clearTimeout(timer);
    };
  }, [pathname, checkSnooze]);

  const dismiss = () => {
    const snoozeTime = Date.now() + 12 * 60 * 60 * 1000; // Snooze for 12 hours (better UX than 10 mins)
    localStorage.setItem("install_prompt_dismissed", snoozeTime.toString());
    setShow(false);
  };

  return { show, isIOS, deferredPrompt, dismiss, setShow };
}

// --- UI Component ---
export default function InstallPrompt() {
  const { show, isIOS, deferredPrompt, dismiss, setShow } = usePWAInstall();
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setShow(false);
      }
    } else if (isIOS) {
      // Instead of an alert, we flip the UI to show visual instructions
      setShowIOSInstructions(true);
    }
  };

  if (!show) return null;

  return (
    <div 
      className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-4 bg-black/40 backdrop-blur-md animate-in fade-in duration-300"
      role="dialog"
      aria-modal="true"
      aria-labelledby="install-title"
    >
      <div className="relative w-full max-w-sm bg-white border border-zinc-200/80 rounded-[2rem] p-6 shadow-2xl shadow-black/20 animate-in slide-in-from-bottom-10 sm:zoom-in-95">
        
        {/* Subtle Close Button */}
        <button 
          onClick={dismiss}
          className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 rounded-full transition-colors"
          aria-label="Close dialog"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 6L6 18M6 6l12 12"/>
          </svg>
        </button>

        <div className="flex flex-col items-center gap-5 mt-2">
          {/* App Icon with premium styling */}
          <div className="w-20 h-20 bg-white rounded-[1.5rem] overflow-hidden shadow-lg border border-zinc-100 ring-4 ring-zinc-50 flex-shrink-0">
            <img src="/images/cup.png" alt="PackSite App Icon" className="w-full h-full object-cover" />
          </div>

          {!showIOSInstructions ? (
            <>
              <div className="text-center space-y-1.5">
                <h2 id="install-title" className="text-2xl font-bold text-zinc-900 tracking-tight">
                  Add to Home Screen
                </h2>
                <p className="text-zinc-500 text-sm leading-relaxed px-2">
                  Install PackSite for lightning-fast access, full-screen mode, and a seamless native experience.
                </p>
              </div>

              <div className="w-full flex flex-col gap-2.5 mt-2">
                <button 
                  onClick={handleInstallClick}
                  className="w-full bg-zinc-900 hover:bg-black text-white font-semibold py-3.5 rounded-2xl active:scale-[0.98] transition-all shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:ring-offset-2"
                >
                  Install App
                </button>
                <button 
                  onClick={dismiss} 
                  className="w-full bg-zinc-100 hover:bg-zinc-200 text-zinc-600 font-semibold py-3.5 rounded-2xl active:scale-[0.98] transition-all focus:outline-none focus:ring-2 focus:ring-zinc-200 focus:ring-offset-2"
                >
                  Maybe Later
                </button>
              </div>
            </>
          ) : (
            // iOS Visual Instructions UI
            <div className="text-center space-y-4 w-full animate-in fade-in slide-in-from-right-4 duration-300">
              <h2 className="text-xl font-bold text-zinc-900 tracking-tight">
                Install on iPhone
              </h2>
              <div className="bg-zinc-50 rounded-2xl p-4 border border-zinc-100 text-left space-y-3">
                <div className="flex items-center gap-3">
                  <span className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 font-bold text-sm">1</span>
                  <p className="text-zinc-600 text-sm">Tap the <strong className="text-zinc-900">Share</strong> button at the bottom of your screen.</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 font-bold text-sm">2</span>
                  <p className="text-zinc-600 text-sm">Scroll down and tap <strong className="text-zinc-900">Add to Home Screen</strong>.</p>
                </div>
              </div>
              <button 
                onClick={dismiss}
                className="w-full bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-semibold py-3 rounded-2xl active:scale-[0.98] transition-all mt-4"
              >
                Got it
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}