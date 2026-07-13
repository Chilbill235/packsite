import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['@prisma/client', 'pg'],
  // Remove the swcMinify: false line entirely
};

export default nextConfig;