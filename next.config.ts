import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  async redirects() {
    return [
      { source: "/browse", destination: "/market/browse", permanent: true },
      { source: "/shop/:producerId", destination: "/market/shop/:producerId", permanent: true },
    ];
  },
};

export default nextConfig;
