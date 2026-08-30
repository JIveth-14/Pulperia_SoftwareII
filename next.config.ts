import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack: (config) => {
    config.ignoreWarnings = [
      { module: /node_modules\/react-native/ },
    ];
    return config;
  },
};

export default nextConfig;
