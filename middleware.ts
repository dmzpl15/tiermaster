
// ✅ next-auth의 인증 미들웨어를 가져옵니다 (default export)
import auth from 'next-auth/middleware';


// ✅ 인증된 요청 객체 타입 (Next.js 13+용)
import { NextRequestWithAuth } from 'next-auth/middleware';

// ✅ 리디렉션, 응답 제어를 위한 객체
import { NextResponse } from 'next/server';


/**
 * 🔒 로그인 보호 미들웨어
 * - 사용자가 특정 경로에 접근할 때 인증 상태를 확인합니다.
 * - 인증이 되어 있지 않으면 /login 페이지로 리디렉션합니다.
 */

export default auth((req: NextRequestWithAuth) => {
     // ✅ 로그인 여부는 nextauth.token 유무로 판단
     //Next.js App Router + NextAuth에서 auth() 미들웨어가 내부적으로 req.nextauth.token에 JWT payload를 넣어줍니다
  const isLoggedIn = !!req.nextauth?.token; //세션이 존재하면 true

  // ✅ 현재 요청 경로를 가져옵니다
  const pathname = req.nextUrl.pathname;

  // ✅ 로그인 보호가 필요한 경로 목록
  const protectedPaths = ['/vote', '/submit'];

   // ✅ 현재 요청 경로가 보호 대상인지 확인
  const isProtected = protectedPaths.some((path) =>
    pathname.startsWith(path)
  );

  // ✅ 보호 경로인데 로그인 안 되어 있다면 → 로그인 페이지로 리디렉션
  if (isProtected && !isLoggedIn) {
    return NextResponse.redirect(new URL('/login', req.url));
  } 


  // ✅ 그 외의 경우는 그냥 통과시킵니다
  return NextResponse.next();
});

/**
 * 🔧 이 설정은 어떤 경로에 대해 미들웨어를 적용할지를 정의합니다
 * - 여기서는 `/vote`, `/submit` 경로에만 적용됩니다
 * - `/vote/*`, `/submit/*` 하위 경로까지 포함합니다
 */
export const config = {
  matcher: ['/vote/:path*', '/submit/:path*', '/api/vote'],// ⬅️ API 보호도 포함
};
