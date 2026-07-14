import { Metadata, Viewport } from "next";
import "./globals.css";
import LayoutContent from "./layout-content";

export const metadata: Metadata = {
  title: "PackSite",
  description: "Pick and open your packs!",
  appleWebApp: {
    capable: true,
    title: "PackSite",
    statusBarStyle: "black-translucent",
  },
  icons: { apple: "/splash/apple-icon-180.png" },
};

export const viewport: Viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" style={{ backgroundColor: '#000000' }}>
      <head>
        {/* iOS Splash Screens */}
        <link rel="apple-touch-icon" href="/splash/apple-icon-180.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        
        {/* Add the full list of generated <link rel="apple-touch-startup-image" ... /> tags here */}
        
        <meta name="google-adsense-account" content="ca-pub-1167000799645777" />
        <meta name="monetag" content="ed7820a28006a4e3879c0bc5afd4410c" />
      </head>
      <body className="bg-black text-zinc-100 antialiased min-h-screen flex flex-col">
        <LayoutContent>{children}</LayoutContent>
      </body>
    </html>
  );
}