import type { NextConfig } from "next";
import path from "path";

const BACKEND_API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

const nextConfig: NextConfig = {
  turbopack: {
    root: path.resolve(__dirname, ".."),
  },
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${BACKEND_API}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
