import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "aszypficshsjprtkqwoi.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
      {
        protocol: "https",
        hostname: "gsdztisptjdtexclsvnd.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
      // Cloudflare R2 public bucket URLs (pub-*.r2.dev)
      {
        protocol: "https",
        hostname: "*.r2.dev",
        pathname: "/**",
      },
      // Cloudflare R2 via custom domain (set R2_PUBLIC_URL to a custom domain)
      ...(process.env.R2_PUBLIC_URL
        ? (() => {
            try {
              const url = new URL(process.env.R2_PUBLIC_URL);
              return [{ protocol: "https" as const, hostname: url.hostname, pathname: "/**" }];
            } catch {
              return [];
            }
          })()
        : []),
    ],
  },
};

export default nextConfig;
