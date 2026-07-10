import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Ensure images from Google AdSense can be rendered
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "pagead2.googlesyndication.com",
      },
    ],
  },

  // Configure Security Headers to allow AdSense
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
              "frame-src 'self' https://googleads.g.doubleclick.net https://tpc.googlesyndication.com;",
          },
        ],
      },
    ];
  },
};

export default nextConfig;