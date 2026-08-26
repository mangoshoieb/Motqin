import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Pin the Turbopack root to this folder. Without it, Turbopack can infer a
  // parent directory as the root and then fail to resolve the `next` package
  // ("Next.js package not found"), which panics the dev server.
  turbopack: {
    root: path.join(__dirname),
  },
};

export default nextConfig;
