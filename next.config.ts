import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["jobtrack.local", "localhost"],

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "avatars.githubusercontent.com",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
    ],
  },
};

export default nextConfig;