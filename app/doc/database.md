✅ 1단계: Supabase 테이블 구조 만들기
📦 items 테이블
필드명 타입 설명
id UUID or TEXT (PK) 항목 고유 ID
name TEXT 항목 이름
category TEXT 카테고리 이름
votes INT 추천 수 (캐싱용)
created_at TIMESTAMP 생성일시

📦 votes 테이블
필드명 타입 설명
id UUID (PK) 추천 레코드 ID
user_id TEXT 유저 ID (Google UID 등)
item_id TEXT 추천한 항목의 ID (items.id)
created_at TIMESTAMP 추천 시각
⚠️ user_id + item_id 조합을 Unique로 설정하면 중복 추천 방지 가능!

✅ 2단계: API 라우트 생성 (추천 기능)
/app/api/vote/route.ts
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
const supabase = createRouteHandlerClient({ cookies });
const { itemId } = await req.json();

const { data: { user } } = await supabase.auth.getUser();

if (!user) {
return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

const { data: existingVote, error: voteError } = await supabase
.from('votes')
.select('\*')
.eq('user_id', user.id)
.eq('item_id', itemId)
.maybeSingle();

if (existingVote) {
return NextResponse.json({ error: 'Already voted' }, { status: 409 });
}

const { error: insertError } = await supabase
.from('votes')
.insert({ user_id: user.id, item_id: itemId });

if (insertError) {
return NextResponse.json({ error: 'Failed to vote' }, { status: 500 });
}

await supabase.rpc('increment_votes', { item_id_input: itemId }); // RPC 추천수 증가 함수

return NextResponse.json({ success: true });
}

✅ 3단계: Supabase RPC로 items.votes 증가 함수
create or replace function increment_votes(item_id_input text)
returns void as $$
begin
update items
set votes = votes + 1
where id = item_id_input;
end;

$$
language plpgsql;

const handleVote = async (id: string) => {
  const res = await fetch('/api/vote', {
    method: 'POST',
    body: JSON.stringify({ itemId: id }),
  });

  if (res.ok) {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, votes: item.votes + 1 } : item
      )
    );
  } else {
    const error = await res.json();
    alert(error.error || '추천 실패');
  }
};




==================



✅ 3. 추천 수 증가 함수 (RPC)
RPC의 개념:
데이터베이스에서 미리 정의한 **로직 블록(함수)**을
서버리스 함수처럼 호출할 수 있도록 하는 기능입니다.
Supabase에서는 .rpc() 메서드로 호출합니다.

create or replace function public.increment_votes(item_id_input text)
returns void as
$$

begin
update public.items
set votes = votes + 1
where id = item_id_input;
end;

$$
language plpgsql;


await supabase.rpc('increment_votes', { item_id_input: itemId });

방식	설명
클라이언트에서 직접 update 쿼리	보안/정합성 문제 있음 (중복 요청 시 문제가 생김)
RPC 함수 호출	서버에서 동작하므로 빠르고 안전함, 트랜잭션 처리도 가능

✅ RPC의 이점
장점	설명
🔒 안전성	Supabase client가 직접 DB 테이블을 수정하지 않음
⚡ 속도	서버 내에서 바로 처리되므로 네트워크 오버헤드 적음
♻️ 재사용	여러 곳에서 동일한 로직을 호출 가능
✅ 권한 제어	RLS 정책과 함께 활용 가능 (예: 로그인한 유저만 호출 허용 등)




🔐 권한 제안 (선택)
만약 인증된 유저만 추천할 수 있게 하려면, RLS(Row Level Security) 정책도 설정해야 합니다. 필요하면 그것도 바로 작성해줄게요.



=== 그룹 테이블 =======
-- ✅ 1. Supabase SQL: DB 구조 변경 및 중복 방지
-- (1) votes 테이블에 category_id 추가 및 유저당 카테고리 1개 제한
-- (2) 기존 테이블 제거 후 재생성 (주의: 데이터 초기화됨)

-- DROP TABLES (주의: 순서 중요)
drop table if exists votes;
drop table if exists items;
drop table if exists categories;
drop table if exists groups;

-- 그룹 테이블 생성 , 그룹을 관리
--   id: 그룹의 고유 ID
-- name: 그룹 이름 (예: 음식, 콘텐츠 등)
-- created_at: 생성일시

create table public.groups (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  created_at timestamp with time zone default now()
);



==== 카테고리 테이블 ==========
-- 카테고리 테이블 생성
   id: 카테고리 고유 ID
   name: 카테고리 이름 (예: 라면, 영화 명작 등)
   group_id: groups 테이블의 id와 연결 (foreign key)
   created_at: 생성일시

create table public.categories (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  group_id uuid references public.groups(id) on delete cascade,
  created_at timestamp with time zone default now()
);




====== item 테이블 ===========
-- 아이템 테이블 생성

3. items 테이블 - 아이템을 관리
   id: 아이템 고유 ID
   name: 아이템 이름 (예: 진라면, 킹덤 등)
   category_id: categories 테이블의 id와 연결 (foreign key)
   votes: 추천 수 (초기값: 0)
   created_at: 생성일시
   
create table public.items (
  id bigint generated by default as identity primary key,
  name text not null,
  category_id uuid references public.categories(id) on delete cascade,
  votes integer default 0,
  created_at timestamp with time zone default now()
);




========== vote 테이블 ==========
-- 추천 테이블 생성
create table public.votes (
  id uuid primary key default uuid_generate_v4(),
  user_id text not null,
  item_id text references public.items(id) on delete cascade,
  created_at timestamp with time zone default now(),
  unique (user_id, item_id)
);

-- VOTES (✅ category_id 추가 + user_id + category_id 유니크)
create table public.votes (
  id uuid primary key default uuid_generate_v4(),
  user_id text not null,
  item_id bigint references public.items(id) on delete cascade,
  category_id uuid references public.categories(id) on delete cascade,
  created_at timestamp with time zone default now(),
  unique (user_id, category_id) -- ✅ 한 유저가 한 카테고리당 하나만 추천
);

4. votes 테이블 - 추천(투표)을 관리
   id: 추천 고유 ID
   user_id: 유저 ID (예: Google UID 등)
   item_id: items 테이블의 id와 연결 (foreign key)
   created_at: 추천일시

user_id + item_id 조합에 UNIQUE 설정 → 중복 추천 방지
item_id는 items 테이블의 id와 연결
on delete cascade: 항목 삭제 시 해당 votes도 삭제됨



각 테이블의 관계:
groups와 categories: 그룹은 여러 카테고리를 가질 수 있습니다. 카테고리는 하나의 그룹에만 속합니다.
categories와 items: 카테고리는 여러 아이템을 가질 수 있으며, 아이템은 하나의 카테고리에만 속합니다.
items와 votes: 아이템은 여러 추천을 받을 수 있으며, 추천은 각 아이템에 대해 유일합니다 (유저당 하나의 추천만 가능).
$$

//중요
votes 테이블은 추천 여부 기록만 저장합니다.
추천 수(votes 숫자)는 items.votes 필드를 사용합니다.

즉, user_id로 필터한 votes는:
내가 추천한 항목 목록 확인용
items.votes는 모든 유저들의 추천 수의 총합을 캐싱한 값입니다.

✅ 따라서:
나만의 추천 여부는 votes.user_id
전체 추천 수는 items.votes
