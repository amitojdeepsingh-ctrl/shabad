import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: process.cwd(),
  },
  outputFileTracingIncludes: {
    "/ang/**": ["./public/data/**"],
    "/api/**": ["./public/data/**"],
  },
};

export default nextConfig;
