import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 스크래핑 시 외부 이미지가 필요할 경우를 대비
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" },
    ],
  },
};

export default nextConfig;
