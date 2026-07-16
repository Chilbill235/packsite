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

    const checkInstallationAndDevice = async () => {
      // 2. Check if currently running in standalone (app) mode
      const isCurrentlyStandalone = 
        window.matchMedia('(display-mode: standalone)').matches || 
        (window.navigator as any).standalone === true;
      
      if (isCurrentlyStandalone || checkSnooze()) return;

      // 3. Check if app is already installed on device (supported Chromium browsers)
      if ('getInstalledRelatedApps' in navigator) {
        try {
          const relatedApps = await (navigator as any).getInstalledRelatedApps();
          // If the array contains elements, the app is already installed on the device!
          if (relatedApps && relatedApps.length > 0) {
            return; 
          }
        } catch (err) {
          console.warn("Could not check if PWA was already installed:", err);
        }
      }

      // 4. Detect Device accurately
      const userAgent = window.navigator.userAgent.toLowerCase();
      const isIOSDevice = /iphone|ipad|ipod/.test(userAgent);
      setIsIOS(isIOSDevice);

      // 5. Delay showing to not overwhelm the user immediately
      const timer = setTimeout(() => setShow(true), 2500);

      return () => clearTimeout(timer);
    };

    // 6. Handle Android/Chrome Prompt registration
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt as any);
    checkInstallationAndDevice();

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt as any);
    };
  }, [pathname, checkSnooze]);

  const dismiss = () => {
    // Snooze for 12 hours
    const snoozeTime = Date.now() + 12 * 60 * 60 * 1000; 
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
      setShowIOSInstructions(true);
    }
  };

  if (!show) return null;

  return (
    <div 
      className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-4 bg-black/85 backdrop-blur-md transition-all duration-300"
      role="dialog"
      aria-modal="true"
      aria-labelledby="install-title"
    >
      <div className="relative w-full max-w-md bg-zinc-950 border border-zinc-800/80 rounded-[2.5rem] p-8 text-center shadow-2xl ring-1 ring-amber-500/10 overflow-hidden">
        {/* Neon Gold Accent Glow background */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button 
          onClick={dismiss}
          className="absolute top-5 right-5 p-2 text-zinc-500 hover:text-zinc-200 hover:bg-zinc-900 rounded-full transition-all"
          aria-label="Close dialog"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 6L6 18M6 6l12 12"/>
          </svg>
        </button>

        <div className="flex flex-col items-center gap-6 mt-2">
          {/* App Icon with premium neon glow container */}
          <div className="w-24 h-24 bg-zinc-900 rounded-3xl overflow-hidden shadow-[0_0_30px_rgba(245,158,11,0.15)] border-2 border-amber-500/20 flex-shrink-0 flex items-center justify-center p-0.5">
            <img src="/images/cup.png" alt="PackSite App Icon" className="w-full h-full object-cover rounded-[1.35rem]" />
          </div>

          {!showIOSInstructions ? (
            <>
              <div className="text-center space-y-2">
                <h2 id="install-title" className="text-2xl font-black text-amber-400 tracking-tight">
                  Install PackSite
                </h2>
                <p className="text-zinc-400 text-sm leading-relaxed px-4">
                  Unlock lightning-fast performance, zero-clutter fullscreen gameplay, and background reward updates!
                </p>
              </div>

              <div className="w-full flex flex-col gap-3 mt-2">
                <button 
                  onClick={handleInstallClick}
                  className="w-full bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-400 hover:to-yellow-500 text-black font-extrabold py-4 rounded-2xl active:scale-[0.97] transition-all shadow-lg hover:shadow-amber-500/10"
                >
                  Install App
                </button>
                <button 
                  onClick={dismiss} 
                  className="w-full bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-bold py-4 rounded-2xl active:scale-[0.97] transition-all border border-zinc-800"
                >
                  Maybe Later
                </button>
              </div>
            </>
          ) : (
            // iOS Visual Instructions UI
            <div className="text-center space-y-5 w-full">
              <h2 className="text-xl font-black text-amber-400 tracking-tight">
                Install on Safari (iPhone)
              </h2>
              
              <div className="bg-zinc-900/50 rounded-2xl p-5 border border-zinc-800/80 text-left space-y-4">
                <div className="flex items-start gap-4">
                  <span className="flex items-center justify-center w-8 h-8 rounded-xl bg-amber-500/10 text-amber-400 font-extrabold text-sm border border-amber-500/20 shrink-0">
                    1
                  </span>
                  <p className="text-zinc-300 text-sm leading-relaxed pt-1">
                    Tap the <strong className="text-white font-bold">Share</strong> button on your browser toolbar.
                    <span className="inline-flex ml-2 align-middle text-zinc-400">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                        <polyline points="16 6 12 2 8 6" />
                        <line x1="12" y1="2" x2="12" y2="15" />
                      </svg>
                    </span>
                  </p>
                </div>
                
                <div className="flex items-start gap-4">
                  <span className="flex items-center justify-center w-8 h-8 rounded-xl bg-amber-500/10 text-amber-400 font-extrabold text-sm border border-amber-500/20 shrink-0">
                    2
                  </span>
                  <p className="text-zinc-300 text-sm leading-relaxed pt-1">
                    Scroll down and select <strong className="text-white font-bold">Add to Home Screen</strong>.
                    <span className="inline-flex ml-2 align-middle text-zinc-400">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                        <line x1="12" y1="8" x2="12" y2="16" />
                        <line x1="8" y1="12" x2="16" y2="12" />
                      </svg>
                    </span>
                  </p>
                </div>
              </div>

              <button 
                onClick={dismiss}
                className="w-full bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-400 hover:to-yellow-500 text-black font-extrabold py-4 rounded-2xl active:scale-[0.97] transition-all"
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