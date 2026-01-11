import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  typescript: {
    ignoreBuildErrors: true, // ยังใช้ได้อยู่
  },
  // ลบส่วน eslint ออกไปเลยครับ เพราะ Next.js 16 ไม่รองรับคีย์นี้ในไฟล์นี้แล้ว
};

export default nextConfig;