import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    domains: [
      "developers.google.com",           // 구글 로그인 버튼 아이콘
      "lh3.googleusercontent.com",       // 구글 프로필 사진 도메인 ✅
    ],
  },
};

export default nextConfig;
