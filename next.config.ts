import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['@prisma/client', 'pg'],
  // Entire 'experimental' block removed to bypass the type error
};

export default nextConfig;