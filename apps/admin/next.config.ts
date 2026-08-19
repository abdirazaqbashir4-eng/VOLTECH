import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@voltech/core", "@voltech/database"],
  serverExternalPackages: ["pg", "@prisma/adapter-pg"],
  images: {
    remotePatterns: [{ protocol: "https", hostname: "**" }],
  },
};

export default nextConfig;
