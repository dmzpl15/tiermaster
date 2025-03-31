✅ 1. 추천(vote) 기능을 Supabase에 연동
지금은 useState 로컬 상태에서 추천 수를 관리 중이죠?

작업 내용:
Supabase에 items 및 votes 테이블 구성

사용자가 추천 시 votes 테이블에 기록 저장

items 테이블의 votes 숫자 동기화

로그인한 유저가 한 항목에 중복 추천을 못하도록 처리

🔧 추천 API는 /app/api/vote/route.ts 같은 경로에 만들면 좋습니다.

✅ 2. /submit 페이지 기능 구현
항목 제안을 진짜로 DB에 반영하도록 하려면?

작업 내용:
텍스트 입력창 + 카테고리 드롭다운 구성

제출 시 Supabase items 테이블에 insert

등록된 항목은 자동으로 /vote 페이지에 노출

추가로 "제안 완료" alert 표시 or redirect

✅ 3. /ranking/[category] 페이지 연결
특정 카테고리의 랭킹 페이지 구현

작업 내용:
/ranking/[category]/page.tsx 내에서 params.category 기반 filtering

/vote에서 각 카테고리 항목에 "랭킹 보기" 버튼 추가하면 UX 향상

필터된 랭킹 데이터를 서버 또는 클라이언트에서 fetch

✅ 4. 로그인 인증 제한 적용
투표, 제안 등 민감한 기능에 로그인 보호가 필요합니다.

작업 내용:
/submit 과 추천 버튼에 session ? ... : redirect 또는 disabled 처리

미들웨어 활용하여 로그인 보호

ts
복사
편집
// middleware.ts
import { withAuth } from 'next-auth/middleware';

export default withAuth({
pages: {
signIn: '/login',
},
});

export const config = {
matcher: ['/submit', '/vote'],
};

✅ 5. 관리자 기능 (선택 사항)
악성 제안이나 유해한 내용 방지

작업 예시:
isApproved 필드를 추가하고 관리자만 승인 가능

/admin/review 페이지에 대기 항목 표시

✅ 6. 디자인 및 다크모드 최종 정리
tailwind.config.ts에 다크모드 설정 class로 설정 완료됐는지 체크

카테고리별 색상, 폰트 다양화도 검토 가능

💡 추천 작업 순서

[1] Supabase 연동: items + votes 테이블
[2] /submit → Supabase insert
[3] /ranking/[category] 연결
[4] 로그인 보호 강화
[5] 관리자 승인 시스템 (옵션)
💬 원하는 우선순위가 있다면 말해줘요.
예를 들어 Supabase 연동부터 시작하고 싶다면 테이블 스키마부터 같이 잡아줄게요!

=================

✅ 현재 완료된 작업
항목 내용
인증 Google 로그인 기반, NextAuth.js 사용, 별도 유저 테이블 없이 진행 중
추천 API /api/vote 에서 Supabase votes 테이블 insert + increment_votes RPC 호출
프론트 /vote 페이지에서 카테고리 탭 및 아코디언 UI 구현 완료
DB 구성 items, votes 테이블 + increment_votes RPC 함수 생성 완료
중복 투표 방지 votes 테이블에서 user_id, item_id 기준으로 체크하여 막음

===========================

🔧 이제 다음으로 해야 할 작업 제안

1. ✅ 추천 결과를 Supabase에서 가져오도록 변경 (SSR 또는 SWR로)
   현재는 initialItems를 하드코딩 상태입니다.
   → Supabase에서 실시간 데이터를 가져와야 최신 랭킹 반영됩니다.

대안:

서버 컴포넌트 또는 SWR/React Query를 이용해 Supabase에서 fetch

예: useEffect + fetch('/api/items') → SSR 미사용 시

2. 📤 제안 페이지(/submit) 구현
   사용자가 새로운 항목을 등록할 수 있도록 form 작성

로그인 상태에서만 등록 가능하게 처리

등록 시 items 테이블에 insert

예: 항목 이름 + 카테고리 선택 폼

3. 📊 카테고리별 랭킹 페이지(/ranking/[category])
   /ranking/라면 형식으로 접근 가능

params.category에 따라 필터링된 items만 보여주기

SSR 또는 클라이언트 fetch 방식 사용 가능

4. 🧪 Supabase 데이터 연결 테스트 페이지 만들기 (개발용)
   로그인한 유저가 추천한 목록 보여주기

votes 테이블 조인 + 현재 유저 기반 filter

5. 🧩 관리자 기능 고려 (선택)
   관리자 전용 페이지 /admin

항목 삭제, 추천 수 초기화 등의 기능

Supabase RLS 설정 또는 role === admin 확인 필요

💡 추가 참고
NextAuth.js만으로 유저의 이름, 이메일, 이미지는 session 객체에서 접근 가능함
→ useSession() 훅으로 session.user.email 등 사용 가능

Supabase 유료는 저장 용량이나 요청 수가 커졌을 때에만 해당됩니다

❓당장 추천하는 다음 작업
✅ 하드코딩된 initialItems → Supabase 실시간 fetch로 교체

원한다면 SWR 또는 getServerSideProps 기반으로 예제 바로 드릴게요.
그다음은 /submit 페이지 만드는 흐름으로 가면 깔끔합니다.

어떤 방향부터 이어갈까요?
예: "실시간 fetch부터 하자" / "제안 페이지 먼저 만들자" 등!
