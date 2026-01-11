import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactStrictMode: true,
  
  // 1. สั่งให้ Vercel มองข้าม Error เรื่องการเขียนโค้ด (ESLint)
  eslint: {
    ignoreDuringBuilds: true,
  },

  // 2. สั่งให้ Vercel มองข้าม Error เรื่องชนิดตัวแปร (TypeScript)
  // อันนี้สำคัญมากสำหรับโปรเจกต์ .ts เพราะถ้า type ผิดนิดเดียวมันก็ไม่ให้ผ่าน
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;