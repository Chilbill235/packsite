import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";

// 1. Configure the PWA plugin
const withPWA = withPWAInit({
  dest: "public",
  // Disable PWA generation during development
  disable: process.env.NODE_ENV === "development",
  register: true,
  // Move skipWaiting into workboxOptions
  workboxOptions: {
    skipWaiting: true,
  },
});

// 2. Define your base Next.js configuration
const nextConfig: NextConfig = {
  serverExternalPackages: ["@prisma/client", "pg"],
  allowedDevOrigins: ["192.168.12.237"],
  
  turbopack: {},
};

// 3. Export the combined configuration
export default withPWA(nextConfig);