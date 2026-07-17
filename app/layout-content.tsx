"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import Navbar from "@/components/Navbar";
import { Analytics } from "@vercel/analytics/next";
import InstallPrompt from "@/components/InstallPrompt";
import Script from "next/script";
import OneSignal from "react-onesignal";

export default function LayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [loading, setLoading] = useState(pathname === "/");
  const [showNotifBanner, setShowNotifBanner] = useState(false);
  const router = useRouter();
  const { data: session, status } = useSession();
  
  // Use a ref to track if we have already triggered the init process
  const isInitializing = useRef(false);

  // --- 1. Sequential & Safe OneSignal Lifecycle ---
  useEffect(() => {
    if (typeof window === "undefined" || isInitializing.current) return;
    isInitializing.current = true;

    const initAndSyncOneSignal = async () => {
      try {
        // Initialize OneSignal with your specific configuration
        await OneSignal.init({
          appId: "7ae5defc-0bad-40c9-9af7-871b24bae250",
          safari_web_id: "web.onesignal.auto.5dcf04a7-d9b5-4793-8717-b5ec1870e3bb",
          notifyButton: {
            enable: true,
          },
          allowLocalhostAsSecureOrigin: true,
          serviceWorkerPath: 'OneSignalSDKWorker.js',
        });

        // Identity Sync & Check Notification Status (Only when Authenticated)
        if (status === "authenticated" && session?.user?.id) {
          await OneSignal.login(session.user.id);

          // Show prompt banner if notifications are supported and set to default (unprompted)
          if (
            "Notification" in window &&
            Notification.permission === "default"
          ) {
            setShowNotifBanner(true);
          }
        }
      } catch (error) {
        console.error("OneSignal lifecycle error:", error);
        isInitializing.current = false; // Allow retry on failure
      }
    };

    initAndSyncOneSignal();
  }, [status, session]);

  // --- 2. iOS-Compliant Click Handler ---
  const handleEnableNotifications = async () => {
    try {
      if (OneSignal.Notifications) {
        await OneSignal.Notifications.requestPermission();
      }
      setShowNotifBanner(false);
    } catch (error) {
      console.error("Failed to request notification permission:", error);
    }
  };

  // --- 3. Splash Screen & Force Redirect Logic ---
  useEffect(() => {
    if (pathname !== "/") {
      setLoading(false);
      return;
    }

    if (status === "loading") {
      setLoading(true);
      return;
    }

    if (status === "authenticated") {
      router.replace("/shop");
    } else {
      setLoading(false);
    }
  }, [pathname, status, router]);

  // --- 4. Handle Browser Back-Forward Cache (BFcache) ---
  useEffect(() => {
    const handlePageShow = (event: PageTransitionEvent) => {
      if (pathname === "/") {
        setLoading(true);
      }
    };

    window.addEventListener("pageshow", handlePageShow);
    return () => {
      window.removeEventListener("pageshow", handlePageShow);
    };
  }, [pathname]);

  return (
    <>
      {loading ? (
        <div className="fixed inset-0 z-[9999] w-screen h-screen bg-[#000000] flex items-center justify-center p-4">
          <img 
            src="/splash/apple-splash-2048-2732.jpg" 
            alt="Loading" 
            className="w-auto h-auto max-w-[70%] max-h-[70%] animate-pulse object-contain" 
          />
        </div>
      ) : (
        <div className="animate-in fade-in duration-500 min-h-screen flex flex-col">
          <InstallPrompt />
          
          {/* Custom Notification Opt-in Banner */}
          {showNotifBanner && (
            <div className="bg-blue-600 text-white text-sm py-2 px-4 flex justify-between items-center z-50">
              <span>Want to get notified when new packs drop?</span>
              <div className="flex gap-2">
                <button 
                  onClick={handleEnableNotifications}
                  className="bg-white text-blue-600 px-3 py-1 rounded font-semibold text-xs hover:bg-blue-50 transition"
                >
                  Enable
                </button>
                <button 
                  onClick={() => setShowNotifBanner(false)}
                  className="text-white opacity-80 hover:opacity-100 text-xs px-2"
                >
                  Dismiss
                </button>
              </div>
            </div>
          )}

          <Navbar />
          <main className="flex-grow">{children}</main>
          
          <Analytics />
          
          <Script 
            src="https://quge5.com/88/tag.min.js" 
            strategy="afterInteractive" 
            data-zone="258926" 
            data-cfasync="false" 
          />

          <Script
            src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-1167000799645777"
            strategy="afterInteractive"
            crossOrigin="anonymous"
          />
        </div>
      )}
    </>
  );
}