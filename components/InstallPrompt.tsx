"use client";
import { useEffect, useState } from "react";

export default function InstallPrompt() {
  const [isIOS, setIsIOS] = useState(false);
  const [show, setShow] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    // 1. Check if already installed
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                         (window.navigator as any).standalone === true;
    if (isStandalone) return;

    // 2. Check snooze
    const dismissedUntil = localStorage.getItem("install_prompt_dismissed");
    if (dismissedUntil && Date.now() < parseInt(dismissedUntil)) return;

    // 3. Set Device
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(iOS);

    // 4. Capture event (for Android/Chrome)
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    // 5. FORCE SHOW: We show the modal after 1 second regardless of the event
    // This ensures iOS users see the "Share" instructions
    const timer = setTimeout(() => setShow(true), 1000);

    return () => window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') setShow(false);
    } else {
      // If no prompt event, just explain the manual way
      alert('To install, tap the Share button 📤 and select "Add to Home Screen"');
    }
  };

  const handleDismiss = () => {
    const snoozeTime = Date.now() + 10 * 60 * 1000;
    localStorage.setItem("install_prompt_dismissed", snoozeTime.toString());
    setShow(false);
  };

  if (!show) return null;

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