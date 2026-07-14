"use client";
import { useEffect, useState } from "react";

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showButton, setShowButton] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Check if device is iOS
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(isIOSDevice);

    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowButton(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    return () => window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setShowButton(false);
    }
  };

  // Show manual instructions for iOS
  if (isIOS) {
    return (
      <div className="fixed bottom-20 left-4 right-4 bg-zinc-800 text-white p-4 rounded-xl text-center z-50 shadow-lg">
        Tap the <b>Share</b> button 📤 and select <b>"Add to Home Screen"</b> to install!
      </div>
    );
  }

  // Show install button for Android/Desktop
  if (!showButton) return null;

  return (
    <button 
      onClick={handleInstallClick}
      className="fixed bottom-20 left-4 right-4 bg-orange-500 text-white p-4 rounded-xl font-bold shadow-lg z-50"
    >
      Install PackSite App
    </button>
  );
}