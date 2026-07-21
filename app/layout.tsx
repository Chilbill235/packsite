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
    icon: "/favicon.ico",
  },
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  themeColor: "#070707",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const oneSignalAppId = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID || "";
  const oneSignalSafariWebId = process.env.NEXT_PUBLIC_ONESIGNAL_SAFARI_WEB_ID || "";

  return (
    <html lang="en" style={{ backgroundColor: "#070707" }}>
      <head>
        <meta name="google-adsense-account" content="ca-pub-1167000799645777" />
        <meta name="monetag" content="ed7820a28006a4e3879c0bc5afd4410c" />

        <link
          rel="apple-touch-startup-image"
          href="/splash/apple-splash-2048-2732.jpg"
          media="(device-width: 1024px) and (device-height: 1366px) and (-webkit-device-pixel-ratio: 2)"
        />
      </head>
      <body className="bg-[#070707] text-zinc-100 antialiased min-h-screen flex flex-col">
        {/* Load and initialize OneSignal SDK only in production */}
        {oneSignalAppId && process.env.NODE_ENV !== "development" && (
          <>
            <Script
              src="https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js"
              strategy="afterInteractive"
            />

            <Script id="onesignal-init" strategy="afterInteractive">
              {`
                window.OneSignalDeferred = window.OneSignalDeferred || [];
                window.OneSignalDeferred.push(async function (OneSignal) {
                  try {
                    await OneSignal.init({
                      appId: "${oneSignalAppId}",
                      safari_web_id: "${oneSignalSafariWebId}",
                      allowLocalhostAsSecureOrigin: true,
                      welcomeNotification: { disable: false, message: "Test - You are Subscribed" },
                      notifyButton: {
                        enable: true,
                        showWhenNotGranted: true,
                        showWhenGranted: false,
                        position: "bottom-right",
                        size: "medium",
                        text: {
                          subscribe: "SUBSCRIBE",
                          unsubscribe: "UNSUBSCRIBE"
                        }
                      }
                    });
                    console.log("[OneSignal] initialized successfully:", "${oneSignalAppId}");
                  } catch (err) {
                    console.error("[OneSignal] init error:", err);
                  }
                });
              `}
            </Script>
          </>
        )}

        <Providers>
          <InstallPrompt />
          <LayoutContent>{children}</LayoutContent>
        </Providers>
      </body>
    </html>
  );
}