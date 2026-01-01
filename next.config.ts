import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Also configure API routes for large uploads
  experimental: {
    serverActions: {
      bodySizeLimit: '50mb',
    },
  },
};

export default nextConfig;
