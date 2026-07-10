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
              "default-src 'self' https://*.google.com https://*.gstatic.com https://*.googlesyndication.com; " +
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.google.com https://*.gstatic.com https://*.googlesyndication.com https://*.google-analytics.com; " +
              "connect-src 'self' https://*.google.com https://*.gstatic.com https://*.googlesyndication.com https://*.google-analytics.com https://*.doubleclick.net; " +
              "frame-src 'self' https://*.google.com https://*.googlesyndication.com https://*.doubleclick.net; " +
              "img-src 'self' data: https://*.google.com https://*.gstatic.com https://*.googlesyndication.com https://*.doubleclick.net; " +
              "style-src 'self' 'unsafe-inline' https://*.google.com https://*.gstatic.com https://*.googlesyndication.com;",
          },
        ],
      },
    ];
  },
};

export default nextConfig;