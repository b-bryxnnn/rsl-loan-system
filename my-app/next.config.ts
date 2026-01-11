import type { NextConfig } from "next";
import path from "path"; // 1. อย่าลืม import path

const nextConfig: NextConfig = {
  // 2. ใส่ config ส่วนนี้เพิ่มเข้าไปครับ
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      react: path.resolve(__dirname, 'node_modules/react'),
      'react-dom': path.resolve(__dirname, 'node_modules/react-dom'),
    };
    return config;
  },
};

export default nextConfig;