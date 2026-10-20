import type { NextConfig } from "next";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

const nextConfig: NextConfig = {
  output: "standalone",
  poweredByHeader: false,
  // Relais vers l'API FastAPI (même origine : pas de CORS). Sans IMMOBELL_API_URL, le site fonctionne seul, en mode démonstration.
  async rewrites() {
    const api = process.env.IMMOBELL_API_URL;
    return api ? [{ source: "/api/v1/:path*", destination: `${api}/api/v1/:path*` }] : [];
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
