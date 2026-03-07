import type { NextConfig } from "next";

if (process.env.NEXT_DEV_WRANGLER_ENV) {
  void import("@opennextjs/cloudflare").then((m) => m.initOpenNextCloudflareForDev());
}

const nextConfig: NextConfig = {
  /* config options here */
};

export default nextConfig;
