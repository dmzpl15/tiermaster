import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    domains: [
      "developers.google.com",           // 구글 로그인 버튼 아이콘
      "lh3.googleusercontent.com",       // 구글 프로필 사진 도메인 ✅
    ],
  },
  // 빌드 시 ESLint 검사 비활성화
  eslint: {
    ignoreDuringBuilds: true,
  },
  // 타입 검사 비활성화
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
