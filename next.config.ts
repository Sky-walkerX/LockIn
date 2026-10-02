import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // A self-contained server in .next/standalone for the Docker image (see
  // Dockerfile). Vercel builds its own output and ignores this.
  output: "standalone",
};

export default nextConfig;
