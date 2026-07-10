import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value: 
              "default-src 'self'; " +
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://pagead2.googlesyndication.com https://tpc.googlesyndication.com; " +
              "style-src 'self' 'unsafe-inline' https://googleads.g.doubleclick.net; " +
              "img-src 'self' https://pagead2.googlesyndication.com https://adservice.google.com https://googleads.g.doubleclick.net data:; " +
              "connect-src 'self' https://pagead2.googlesyndication.com https://ep1.adtrafficquality.google.com https://googleads.g.doubleclick.net; " +
              "frame-src 'self' https://googleads.g.doubleclick.net https://tpc.googlesyndication.com;",
          },
        ],
      },
    ];
  },
};

export default nextConfig;