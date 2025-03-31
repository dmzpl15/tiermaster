✅ 1. Google 로그인 후 받을 수 있는 사용자 정보
next-auth에서 GoogleProvider를 설정하면, 로그인 성공 시 session.user 안에 다음 정보가 포함됩니다:

{
  user: {
    name: '홍길동',
    email: 'gildong@gmail.com',     // ✅ 이게 가장 중요한 고유 식별자
    image: 'https://lh3.googleusercontent.com/xxx.jpg' // 프로필 사진
  },
  expires: '2025-04-30T12:00:00.000Z' // 세션 만료
}


이건 클라이언트(useSession()), 서버(getServerSession()) 둘 다에서 똑같이 접근 가능해요.


✅ 2. 이 정보 기반으로 사용자 테이블에 저장하는 방법
📍 테이블 설계 예시 (Supabase)

create table public.users (
  id uuid primary key default uuid_generate_v4(),
  email text unique not null,
  name text,
  profile_image text,
  created_at timestamp with time zone default now(),
  tier text default 'free' -- 예: free, premium, admin 등
);


✅ 3. 로그인 시점에 사용자 테이블에 등록하는 위치는?
👉 가장 일반적인 위치는 NextAuth의 callbacks 중 signIn 입니다.
// app/api/auth/[...nextauth]/route.ts (또는 authOptions.ts)

import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';

callbacks: {
  async signIn({ user }) {
    const supabase = createServerComponentClient({ cookies });

    // 사용자 존재 여부 확인
    const { data: existing } = await supabase
      .from('users')
      .select('*')
      .eq('email', user.email)
      .maybeSingle();

    if (!existing) {
      // 없으면 새로 insert
      await supabase.from('users').insert({
        email: user.email,
        name: user.name,
        profile_image: user.image,
      });
    }

    return true;
  }
}

✅ 즉, 처음 로그인한 순간에만 자동 등록
이후엔 users 테이블에 그대로 남아 있으므로
등급 관리, 활동 로그, 통계 집계 등에 활용 가능합니다.

✅ 4. 사용 예시 (투표할 때 유저 티어 확인)
const session = await getServerSession(authConfig);
const email = session?.user?.email;

const { data: userInfo } = await supabase
  .from('users')
  .select('tier')
  .eq('email', email)
  .maybeSingle();

if (userInfo?.tier === 'free') {
  // 무료 유저는 하루 3개까지만 투표 가능 등
}


✅ 4. 사용 예시 (투표할 때 유저 티어 확인)
ts
복사
편집
const session = await getServerSession(authConfig);
const email = session?.user?.email;

const { data: userInfo } = await supabase
  .from('users')
  .select('tier')
  .eq('email', email)
  .maybeSingle();

if (userInfo?.tier === 'free') {
  // 무료 유저는 하루 3개까지만 투표 가능 등
}


✨ 결론
목적	도구	역할
로그인	NextAuth + Google	사용자 인증
사용자 정보 저장	Supabase users 테이블	이름/이메일/사진/티어 등
저장 타이밍	signIn() 콜백에서 한 번만	
유저 식별	user.email (고정)	Supabase에서 기본 키로 사용해도 됨
확장성	자유롭게 tier, points, setting, nickname 등 추가 가능	
