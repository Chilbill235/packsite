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

  // Use refs to track OneSignal initialization state
  const oneSignalInitialized = useRef(false);
  const initRetries = useRef(0);
  const MAX_INIT_RETRIES = 3;

  // --- 1. OneSignal Initialization (with retry mechanism) ---
  useEffect(() => {
    if (typeof window === "undefined") return;

    const initializeOneSignal = async () => {
      // Don't initialize if already successful
      if (oneSignalInitialized.current) return;

      try {
        // Initialize OneSignal
        // notifyButton configuration removed to resolve TypeScript build errors
        await OneSignal.init({
          appId: "7ae5defc-0bad-40c9-9af7-871b24bae250",
          safari_web_id: "web.onesignal.auto.5dcf04a7-d9b5-4793-8717-b5ec1870e3bb",
          allowLocalhostAsSecureOrigin: true,
          serviceWorkerPath: 'OneSignalSDKWorker.js',
        });

        // Mark as initialized
        oneSignalInitialized.current = true;
        console.log("OneSignal initialized successfully");
      } catch (error) {
        console.error("OneSignal initialization failed:", error);
        // Retry after delay if not already initialized
        if (!oneSignalInitialized.current) {
          // Exponential backoff: 1s, 2s, 4s, 8s, max 5 attempts
          const delay = Math.min(1000 * Math.pow(2, initRetries.current), 8000);
          if (initRetries.current < 5) {
            console.log(`Retrying OneSignal initialization in ${delay}ms... (attempt ${initRetries.current + 1}/5)`);
            initRetries.current++;
            setTimeout(initializeOneSignal, delay);
          } else {
            console.error("OneSignal failed to initialize after 5 attempts");
          }
        }
      }
    };

    // Start the initialization process
    initializeOneSignal();
  }, []); // Empty deps - run once on mount

  // --- 2. OneSignal Login/Logout (Run on auth changes) ---
  useEffect(() => {
    // Only attempt login if OneSignal is initialized
    if (!oneSignalInitialized.current || typeof window === "undefined") return;

    // Identity Sync & Check Notification Status (Only when Authenticated)
    if (status === "authenticated" && session?.user?.id) {
      // Validate user ID is a non-empty string
      const userId = session.user.id;
      if (typeof userId === 'string' && userId.length > 0) {
        // Attempt login with retries
        const attemptLogin = async (retryCount = 0) => {
          try {
            await OneSignal.login(userId);
            console.log("OneSignal login successful");
          } catch (loginError) {
            console.warn(`Login attempt ${retryCount + 1} failed:`, loginError);
            // Retry up to 3 times with exponential backoff
            if (retryCount < 3) {
              setTimeout(() => attemptLogin(retryCount + 1), 1000 * Math.pow(2, retryCount));
            } else {
              console.error("Login failed after 3 attempts");
            }
          }
        };

        attemptLogin();
      } else {
        console.warn("OneLogin skipped: invalid or empty user ID:", userId);
      }
    } else if (status !== "authenticated") {
      // Logout from OneSignal when user signs out
      const handleLogout = async () => {
        try {
          await OneSignal.logout();
          console.log("User logged out of OneSignal");
        } catch (logoutError) {
          console.warn("OneLogout failed:", logoutError);
        }
      };

      handleLogout();
    }
  }, [status, session]);

  // --- 3. Notification Permission Banner ---
  useEffect(() => {
    if (typeof window === "undefined") return;

    const shouldShowBanner =
      "Notification" in window && Notification.permission === "default";

    // Only update state if it actually needs to change
    if (shouldShowBanner !== showNotifBanner) {
      setShowNotifBanner(shouldShowBanner);
    }
  }); // Runs on every render to keep state in sync with permission changes

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
          
          {/* Vercel Analytics added back here */}
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