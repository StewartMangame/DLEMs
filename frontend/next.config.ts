import type { NextConfig } from "next";

const USER_API  = process.env.NEXT_PUBLIC_USER_API_URL  || "http://localhost:3001";
const ADMIN_API = process.env.NEXT_PUBLIC_ADMIN_API_URL || "http://localhost:3001"; // same server, admin-panel prefix

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      // ── Admin API calls → admin backend ──────────────────────────────────
      {
        source: "/api/admin/:path*",
        destination: `${ADMIN_API}/api/admin/:path*`,
      },
      // ── Admin-panel API calls (legacy prefix kept for compatibility) ──────
      {
        source: "/api/admin-panel/:path*",
        destination: `${ADMIN_API}/api/admin-panel/:path*`,
      },
      // ── User API calls → user backend ────────────────────────────────────
      {
        source: "/api/:path*",
        destination: `${USER_API}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
