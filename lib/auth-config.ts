// lib/auth-config.ts

import { AuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";

export const authConfig: AuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: "/login",
  },
  callbacks: {
    //사용자가 /vote, /admin에서 로그인했으면 → 그대로 돌아감
    //그 외의 경우 → /로 이동
    async redirect({ url, baseUrl }) {
      // console.log("🔁 redirect to", url);
       // 외부 도메인 방지 (보안)
    if (url.startsWith(baseUrl)) return url;
    return baseUrl;
    },

    // ✅ 여기 추가! 로그인할 때 사용자 정보를 Supabase users 테이블에 저장
    async signIn({ user }) {
      console.log('✅ signIn 콜백 실행');
      
      if (!user?.email) {
        console.log('❌ 이메일 없음');
        return true; // 이메일 없으면 그냥 진행
      }
      
      console.log(`👤 사용자 로그인: ${user.email}`);
      
      // 사용자 정보 저장은 로그인 후 페이지에서 처리하도록 변경
      // 이것은 NextAuth의 signIn 콜백에서 fetch API를 사용할 때 발생하는 문제를 피하기 위함
      
      return true;
    },
  },
};

/*

예시 흐름 (로그인 후 원래 페이지로 돌아가기)
1. /vote에서 signIn("google")
2. 로그인 → NextAuth가 callbackUrl=/vote을 포함한 redirect 실행
3. redirect() 콜백에서 url.startsWith(baseUrl) 체크 
4. /vote로 리턴되면 → 자동 이동 완료
*/