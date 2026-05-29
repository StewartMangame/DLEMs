import type { NextConfig } from "next";

const USER_API = process.env.NEXT_PUBLIC_USER_API_URL || process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:3001";
const ADMIN_API = process.env.NEXT_PUBLIC_ADMIN_API_URL || process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:3001"; // same server, admin-panel prefix

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/admin-panel/:path*",
        destination: `${ADMIN_API}/api/admin-panel/:path*`,
      },
      {
        source: "/api/admin/:path*",
        destination: `${ADMIN_API}/api/admin/:path*`,
      },
      {
        source: "/api/:path*",
        destination: `${USER_API}/api/:path*`,
      },
      {
        source: "/uploads/:path*",
        destination: `${USER_API}/uploads/:path*`,
      },
    ];
  },
};

export default nextConfig;
