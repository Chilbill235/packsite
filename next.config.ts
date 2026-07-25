import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";

// 1. Configure the PWA plugin
const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  workboxOptions: {
    skipWaiting: true,
  },
});

// 2. Define your base Next.js configuration
const nextConfig: NextConfig = {
  serverExternalPackages: ["@prisma/client", "pg"],
  
  // Combined allowedDevOrigins
  allowedDevOrigins: [
    "localhost", 
    "127.0.0.1", 
    "192.168.12.237", 
    "franklin-deputy-resolved-paso.trycloudflare.com"
  ],
  
  turbopack: {},
};

// 3. Export the combined configuration
export default withPWA(nextConfig);