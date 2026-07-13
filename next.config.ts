import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['@prisma/client', 'pg'],
  // Add this line to allow connections from your specific IP
  allowedDevOrigins: ['192.168.12.237'],
};

export default nextConfig;