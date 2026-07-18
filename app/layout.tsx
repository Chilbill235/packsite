import { Metadata, Viewport } from "next";
import Script from "next/script";
import "./globals.css";
import LayoutContent from "./layout-content";
import Providers from "@/app/providers";
import InstallPrompt from "@/components/InstallPrompt";

export const metadata: Metadata = {
  title: "PackSite",
  description: "Pick and open your packs!",
  appleWebApp: {
    capable: true,
    title: "PackSite",
    statusBarStyle: "black-translucent",
  },
  icons: { 
    apple: "/splash/apple-icon-180.png",
    icon: "/favicon.ico" 
  },
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  // Note: We can't use React hooks here, so we'll use a different approach for detection
  // The detection will happen client-side in the script
  return (
    <html lang="en" style={{ backgroundColor: '#000000' }}>
      <head>
        <meta name="google-adsense-account" content="ca-pub-1167000799645777" />
        <meta name="monetag" content="ed7820a28006a4e3879c0bc5afd4410c" />
        {/*
          We'll conditionally load the OneSignal script based on user agent
          This is done via inline script that checks if it's iOS standalone
        */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Check if running in browser
              if (typeof window !== 'undefined') {
                // Detect iOS standalone web app (Safari web clip)
                const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !("MSStream" in window);
                const isStandalone = window.matchMedia("(display-mode: standalone)").matches ||
                                   navigator['standalone'] === true;

                // Log detection for debugging
                console.log('OneSignal Detection:', { isIOS, isStandalone, userAgent: navigator.userAgent });

                if (isIOS && isStandalone) {
                  // iOS Safari Web Clip - use the specific configuration they requested
                  const script = document.createElement('script');
                  script.src = 'https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js';
                  script.defer = true;
                  script.onload = () => {
                    window.OneSignalDeferred = window.OneSignalDeferred || [];
                    window.OneSignalDeferred.push(async function(OneSignal) {
                      try {
                        await OneSignal.init({
                          appId: "7ae5defc-0bad-40c9-9af7-871b24bae250",
                          safari_web_id: "web.onesignal.auto.5dcf04a7-d9b5-4793-8717-b5ec1870e3bb",
                          serviceWorkerPath: "/OneSignalSDKWorker.js",
                          serviceWorkerParam: { scope: "/" },
                          allowLocalhostAsSecureOrigin: true,
                          welcomeNotification: { disable: true, message: "" },
                          notifyButton: {
                            enable: true,
                          },
                          // Explicitly set autoregister to true (default is true)
                          autoregister: true,
                        });
                      } catch (error) {
                        if (!error || !String(error.message || error).toLowerCase().includes("already initialized")) {
                          console.error("OneSignal init error:", error);
                        }
                      }
                    });
                  };
                  document.head.appendChild(script);
                } else {
                  // Other browsers (Chrome, Firefox, etc.) - use standard approach with env vars
                  const script = document.createElement('script');
                  script.src = 'https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js';
                  script.setAttribute('strategy', 'afterInteractive');
                  script.onload = () => {
                    window.OneSignalDeferred = window.OneSignalDeferred || [];
                    const isAllowedHost = window.location.hostname === "packsite.vercel.app" || window.location.hostname === "localhost";

                    if (isAllowedHost && !window.__packsiteOneSignalInitQueued) {
                      window.__packsiteOneSignalInitQueued = true;
                      window.OneSignalDeferred.push(async function(OneSignal) {
                        try {
                          await OneSignal.init({
                            appId: "${process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID || ""}",
                            safari_web_id: "${process.env.NEXT_PUBLIC_ONESIGNAL_SAFARI_WEB_ID || ""}",
                            serviceWorkerPath: "/OneSignalSDKWorker.js",
                            serviceWorkerParam: { scope: "/" },
                            allowLocalhostAsSecureOrigin: true,
                            welcomeNotification: { disable: true, message: "" },
                            notifyButton: {
                              enable: true,
                            },
                            // Explicitly set autoregister to true (default is true)
                            autoregister: true,
                          });
                        } catch (error) {
                          if (!error || !String(error.message || error).toLowerCase().includes("already initialized")) {
                            console.error("OneSignal init error:", error);
                          }
                        }
                      });
                    }
                  };
                  document.head.appendChild(script);
                }
              }
            `
          }}
        />
        <link
          rel="apple-touch-startup-image"
          href="/splash/apple-splash-2048-2732.jpg"
          media="(device-width: 1024px) and (device-height: 1366px) and (-webkit-device-pixel-ratio: 2)"
        />
      </head>
      <body className="bg-black text-zinc-100 antialiased min-h-screen flex flex-col">
        <Providers>
          <InstallPrompt />
          <LayoutContent>
            {children}
          </LayoutContent>
        </Providers>
      </body>
    </html>
  );
}