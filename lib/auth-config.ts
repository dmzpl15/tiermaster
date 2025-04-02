// lib/auth-config.ts
/*
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
    async signIn({ user, account }) {
      console.log('✅ signIn 콜백 실행');
      
      if (!user?.email) {
        console.log('❌ 이메일 없음');
        return true; // 이메일 없으면 그냥 진행
      }
      
      console.log(`👤 사용자 로그인: ${user.email}`);
      
      // 사용자 정보를 API 라우트를 통해 저장
      // NextAuth의 signIn 콜백에서 직접 Supabase를 호출하는 대신 API 라우트 사용
      try {
        // 로그인 성공 후 클라이언트 측에서 API 호출을 위해 user와 account 정보를 세션에 포함
        // account 객체가 있으면 provider_id와 provider_type 저장
        if (account) {
          console.log(`🔑 Provider ID: ${account.providerAccountId}, Type: ${account.provider}`);
          // 여기서는 정보만 로깅하고, 실제 저장은 클라이언트에서 API 호출로 처리
        }
      } catch (error) {
        console.error('사용자 정보 저장 중 오류:', error);
        // 오류가 발생해도 로그인은 진행
      }
      
      return true;
    },
  },
}; */

/*

예시 흐름 (로그인 후 원래 페이지로 돌아가기)
1. /vote에서 signIn("google")
2. 로그인 → NextAuth가 callbackUrl=/vote을 포함한 redirect 실행
3. redirect() 콜백에서 url.startsWith(baseUrl) 체크 
4. /vote로 리턴되면 → 자동 이동 완료
*/

// lib/auth-config.ts
import { AuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";


export const authConfig: AuthOptions = {
  session: {
    strategy: "jwt",
  },
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
    // JWT 콜백 추가 - 토큰에 ID 추가
    async jwt({ token, account, user }) {
      console.log('dmzpl jwt callback 🔍');
      console.log('dmzpl account:', account);
      console.log('dmzpl user:', user);
      console.log('dmzpl token before:', token);
      // 최초 로그인 시 (account와 user가 있을 때)
      if (account && user) {
        // Google의 sub 값을 ID로 사용
        token.id = account.providerAccountId;
        console.log('dmzpl ✅ 저장된 token.id:', token.id);
      }
      console.log('dmzpl token after:', token);
      return token;
    },
    ////
    // 세션 콜백 추가 - 토큰에서 세션으로 ID 복사
    async session({ session, token }) {
      console.log('dmzpl session callback 🧠');
      console.log('dmzpl token received in session:', token);
      if (session.user) {
        session.user.id = token.id as string;
      }
      console.log('dmzpl Session callback - session after:', session);
      return session;
    },
    /////////////////
    //사용자가 /vote, /admin에서 로그인했으면 → 그대로 돌아감
    //그 외의 경우 → /로 이동
    async redirect({ url, baseUrl }) {
      // console.log("🔁 redirect to", url);
      // 외부 도메인 방지 (보안)
      if (url.startsWith(baseUrl)) return url;
      return baseUrl;
    },

    // ✅ 여기 추가! 로그인할 때 사용자 정보를 Supabase users 테이블에 저장
    async signIn({ user, account }) {
      console.log('✅ signIn 콜백 실행');
      
      if (!user?.email) {
        console.log('❌ 이메일 없음');
        return true; // 이메일 없으면 그냥 진행
      }
      
      console.log(`👤 사용자 로그인: ${user.email}`);
      
      // 사용자 정보를 API 라우트를 통해 저장
      // NextAuth의 signIn 콜백에서 직접 Supabase를 호출하는 대신 API 라우트 사용
      try {
        // 로그인 성공 후 클라이언트 측에서 API 호출을 위해 user와 account 정보를 세션에 포함
        // account 객체가 있으면 provider_id와 provider_type 저장
        if (account) {
          console.log(`🔑 Provider ID: ${account.providerAccountId}, Type: ${account.provider}`);
          // 여기서는 정보만 로깅하고, 실제 저장은 클라이언트에서 API 호출로 처리
        }
      } catch (error) {
        console.error('사용자 정보 저장 중 오류:', error);
        // 오류가 발생해도 로그인은 진행
      }
      
      return true;
    },
  },
};