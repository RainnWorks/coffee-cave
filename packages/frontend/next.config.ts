import { dmnoNextConfigPlugin } from "@dmno/nextjs-integration";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  logging: {
    fetches: {
      
    }
  }
};

export default dmnoNextConfigPlugin()(nextConfig);
