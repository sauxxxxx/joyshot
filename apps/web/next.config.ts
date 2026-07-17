import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["10.10.12.23"],
  transpilePackages: ["@photobooth/shared"],
};

export default nextConfig;
