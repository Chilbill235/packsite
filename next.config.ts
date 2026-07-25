import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";

// 1. Configure the PWA plugin with explicit SW output name
const withPWA = withPWAInit({
  dest: "public",
  sw: "ServiceWorker.js", // <-- Tells next-pwa to output ServiceWorker.js instead of sw.js
  disable: process.env.NODE_ENV === "development",
  register: true,
  workboxOptions: {
    skipWaiting: true,
  },
});

// 2. Base Next.js config
const nextConfig: NextConfig = {
  serverExternalPackages: ["@prisma/client", "pg"],
  allowedDevOrigins: [
    "localhost", 
    "127.0.0.1", 
    "192.168.12.237", 
    "franklin-deputy-resolved-paso.trycloudflare.com"
  ],
  turbopack: {},
};

export default withPWA(nextConfig);