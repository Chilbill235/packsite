import { Metadata, Viewport } from "next";
import Script from "next/script"; // <-- Import Next.js Script component
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
  const oneSignalAppId = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID || "";
  const oneSignalSafariWebId = process.env.NEXT_PUBLIC_ONESIGNAL_SAFARI_WEB_ID || "";

  return (
    <html lang="en" style={{ backgroundColor: '#000000' }}>
      <head>
        <meta name="google-adsense-account" content="ca-pub-1167000799645777" />
        <meta name="monetag" content="ed7820a28006a4e3879c0bc5afd4410c" />
        
        <link
          rel="apple-touch-startup-image"
          href="/splash/apple-splash-2048-2732.jpg"
          media="(device-width: 1024px) and (device-height: 1366px) and (-webkit-device-pixel-ratio: 2)"
        />
      </head>
      <body className="bg-black text-zinc-100 antialiased min-h-screen flex flex-col">
        
        {/* Next.js Script Component handles downloading the OneSignal SDK cleanly */}
        <Script 
          src="https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js" 
          strategy="afterInteractive" 
        />
        
        {/* Next.js Script Component handles your initialization and injects the variables correctly */}
        <Script id="onesignal-init" strategy="afterInteractive">
          {`
            window.OneSignal = window.OneSignal || [];
            OneSignal.push(function() {
              OneSignal.init({
                appId: "${oneSignalAppId}",
                safari_web_id: "${oneSignalSafariWebId}",
                allowLocalhostAsSecureOrigin: true,
                welcomeNotification: { disable: true, message: "" }
              });
            });
          `}
        </Script>

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