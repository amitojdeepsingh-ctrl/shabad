import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: process.cwd(),
  },
  outputFileTracingIncludes: {
    "/*": ["./public/data/**/*", "./public/wasm/**/*"],
  },
};

export default nextConfig;
