"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation"; // 1. Import Next.js pathname hook

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: Array<string>;
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export default function InstallPrompt() {
  const pathname = usePathname(); // 2. Get current path
  const [isIOS, setIsIOS] = useState(false);
  const [show, setShow] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    // 3. ONLY run this logic on the shop page
    if (pathname !== "/shop") {
      setShow(false);
      return;
    }

    // Check if already installed
    const isStandalone = 
      window.matchMedia('(display-mode: standalone)').matches || 
      (window.navigator as any).standalone === true;
    
    if (isStandalone) return;

    // Check snooze
    const dismissedUntil = localStorage.getItem("install_prompt_dismissed");
    if (dismissedUntil && Date.now() < parseInt(dismissedUntil)) return;

    // Set Device
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(iOS);

    // Capture event (for Android/Chrome)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault(); // Prevents default browser banner so we can use ours
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt as any);

    // Show modal after 1 second
    const timer = setTimeout(() => setShow(true), 1000);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt as any);
      clearTimeout(timer);
    };
  }, [pathname]); // 4. Run hook again if path changes

  // If we aren't on the shop page, or the state is set to hide, render absolutely nothing
  if (pathname !== "/shop" || !show) return null;

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setShow(false);
      }
    } else {
      alert('To install, tap the Share button 📤 and select "Add to Home Screen"');
    }
  };

  const handleDismiss = () => {
    const snoozeTime = Date.now() + 10 * 60 * 1000; // 10 minutes
    localStorage.setItem("install_prompt_dismissed", snoozeTime.toString());
    setShow(false);
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="w-full max-w-sm bg-white border border-zinc-200 rounded-3xl p-6 shadow-2xl animate-in slide-in-from-bottom-10">
        <div className="flex flex-col items-center gap-4">
          <div className="w-20 h-20 bg-white rounded-3xl overflow-hidden shadow-md border border-zinc-100">
            <img src="/images/cup.png" alt="Icon" className="w-full h-full object-cover" />
          </div>

          <div className="text-center space-y-1">
            <h2 className="text-2xl font-bold text-black">Add PackSite to Home</h2>
            <p className="text-zinc-600 text-sm">
              {isIOS 
                ? 'Get the best experience. Tap "Share" 📤 and then "Add to Home Screen".' 
                : 'Install our app for faster access and offline play.'}
            </p>
          </div>

          <div className="w-full flex flex-col gap-2 mt-2">
            <button 
              onClick={handleInstallClick}
              className="w-full bg-black text-white font-bold py-3 rounded-xl active:scale-95 transition"
            >
              Install App
            </button>
            
            <button 
              onClick={handleDismiss} 
              className="w-full bg-zinc-100 text-zinc-600 font-medium py-3 rounded-xl active:scale-95 transition"
            >
              Maybe Later
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}