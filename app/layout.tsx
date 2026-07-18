import { Metadata, Viewport } from "next";
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
  // Get environment variables for use in the client-side script
  const oneSignalAppId = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID || "";
  const oneSignalSafariWebId = process.env.NEXT_PUBLIC_ONESIGNAL_SAFARI_WEB_ID || "";

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
              // Simple test to see if script runs
              console.log('OneSignal script is running');

              // Check if running in browser
              if (typeof window !== 'undefined') {
                console.log('Browser detected');

                // Get OneSignal credentials from environment variables (already extracted on server)
                const appId = oneSignalAppId;
                const safariWebId = oneSignalSafariWebId;

                console.log('OneSignal App ID:', appId ? '[REDACTED]' : 'missing');
                console.log('OneSignal Safari Web ID:', safariWebId ? '[REDACTED]' : 'missing');

                // Simple script creation test
                const script = document.createElement('script');
                script.src = 'https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js';
                script.defer = true;
                script.onload = () => {
                  console.log('OneSignal script loaded');

                  // Initialize OneScript
                  window.OneSignal = window.OneSignal || [];
                  OneSignal.push(() => {
                    OneSignal.init({
                      appId: appId,
                      safari_web_id: safariWebId,
                      allowLocalhostAsSecureOrigin: true,
                      welcomeNotification: { disable: true, message: "" }
                    });
                  });
                };
                script.onerror = () => {
                  console.error('Failed to load OneSignal script');
                };
                document.head.appendChild(script);
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