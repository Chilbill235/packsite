import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['@prisma/client', 'pg'],
  // Disabling swcMinify bypasses the requirement for native lightningcss bindings
  swcMinify: false, 
};

export default nextConfig;