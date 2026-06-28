import type { NextConfig } from "next";

const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
const appHost = appUrl.replace(/^https?:\/\//, "");

const nextConfig: NextConfig = {
  experimental: {
    serverActions: { allowedOrigins: [appHost] },
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "*.supabase.co" },
    ],
  },
};

export default nextConfig;
