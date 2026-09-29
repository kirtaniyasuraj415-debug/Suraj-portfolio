import type { NextConfig } from "next";

const noIndexHeaders = [
  { key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" },
];

const nextConfig: NextConfig = {
  async headers() {
    return [
      { source: "/admin/:path*", headers: noIndexHeaders },
      { source: "/api/:path*", headers: noIndexHeaders },
      { source: "/ceebee/:path*", headers: noIndexHeaders },
      { source: "/lifestyle-interior/:path*", headers: noIndexHeaders },
      { source: "/noor-interior/:path*", headers: noIndexHeaders },
    ];
  },
};

export default nextConfig;
