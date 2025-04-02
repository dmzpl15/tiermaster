import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getServerSession } from 'next-auth';
import { authConfig } from '@/lib/auth-config'; // next-auth 세팅

export async function POST(req: Request) {
  // createClient를 사용하여 직접 Supabase 클라이언트 생성
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const session = await getServerSession(authConfig);
  const { itemId } = await req.json();

  const user = session?.user;

  if (!user?.email) {
    return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
  }

 /**** 기존 구현
  // ✅ 사용자 ID 조회 (이메일로 UUID 가져오기)
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('id')
    .eq('email', user.email)
    .maybeSingle();

  if (userError || !userData) {
    return NextResponse.json({ error: '사용자 정보 없음' }, { status: 400 });
  }

  // ✅ 1. item 정보 가져오기 (category_id)
  const { data: itemInfo,  error: itemError } = await supabase
    .from('items')
    .select('category_id')
    .eq('id', itemId)
    .maybeSingle();
    
    if (itemError || !itemInfo) {
      return NextResponse.json({ error: '아이템 정보 없음' }, { status: 400 });
    }
    ******/


   // 사용자 ID와 항목 정보를 병렬로 조회
    const [userResponse, itemResponse] = await Promise.all([
      supabase
        .from('users')
        .select('id')
        .eq('email', user.email)
        .maybeSingle(),
      
      supabase
        .from('items')
        .select('category_id')
        .eq('id', itemId)
        .maybeSingle()
    ]);

    // 에러 처리
    if (userResponse.error || !userResponse.data) {
      return NextResponse.json({ error: '사용자 정보 없음' }, { status: 400 });
    }

    if (itemResponse.error || !itemResponse.data) {
      return NextResponse.json({ error: '아이템 정보 없음' }, { status: 400 });
    }

    const userData = userResponse.data;
    const itemInfo = itemResponse.data;
      
  // ✅ 2. 중복 추천 확인 (해당 category_id에 이미 투표한 user가 있는지)
  const { data: existing , error: existingError} = await supabase
    .from('votes')
    //.select('*')
    .select('id') // 전체 데이터가 아닌 id만 필요
    .eq('user_id', userData.id) // 이메일 대신 UUID 사용
    .eq('category_id', itemInfo.category_id)
    .maybeSingle();

    if (existingError) {
      return NextResponse.json({ error: '기존 추천 확인 실패' }, { status: 500 });
    }
  
    if (existing) {
      return NextResponse.json({ error: '이미 이 카테고리에 추천함' }, { status: 409 });
    }

  /*******  기존 구현 
    // ✅ 3. 추천 삽입
    const { error: insertError } = await supabase.from('votes').insert({
      user_id: userData.id, // 이메일 대신 UUID 사용
      item_id: itemId,
      category_id: itemInfo.category_id,
    });

    
   if (insertError) {
     return NextResponse.json({ error: '추천 저장 실패' }, { status: 500 });
    }

  
    // ✅ 4. RPC로 캐시 증가
    const { error: rpcError } = await supabase.rpc('increment_votes', {
      item_id_input: Number(itemId),
    });

    if (rpcError) {
      return NextResponse.json({ error: '추천 수 증가 실패' }, { status: 500 });
    } ****/

      // 트랜잭션 RPC 호출
    // 오류 메시지를 통해 items 테이블의 id가 숫자 타입임을 확인
    const { error: rpcError } = await supabase.rpc('increment_votes_and_insert_vote', {
      user_id_input: userData.id,
      item_id_input: Number(itemId),  // 숫자로 변환
      category_id_input: itemInfo.category_id,
    });

    if (rpcError) {
      console.error('RPC 오류:', rpcError);  // 오류 세부 정보 로깅
      return NextResponse.json({ error: '추천 저장 + 증가 실패' }, { status: 500 });
    }

   // 성공 응답 (프론트에서 itemName은 이미 알고 있음)
  return NextResponse.json({ success: true, itemId });
}


export async function DELETE(req: Request) {
  // createClient를 사용하여 직접 Supabase 클라이언트 생성
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const session = await getServerSession(authConfig);
  const { itemId } = await req.json();

  const user = session?.user;

  if (!user?.email) {
    return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
  }

  // ✅ 사용자 ID 조회 (이메일로 UUID 가져오기)
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('id')
    .eq('email', user.email)
    .maybeSingle();

  if (userError || !userData) {
    return NextResponse.json({ error: '사용자 정보 없음' }, { status: 400 });
  }

    // ✅ 1. 추천 기록 존재 확인
  const { data: existing, error: checkError } = await supabase
    .from('votes')
    .select('*')
    .eq('user_id', userData.id) // 이메일 대신 UUID 사용
    .eq('item_id', Number(itemId)) // 숫자로 변환
    .maybeSingle();

    if (checkError) {
      return NextResponse.json({ error: '추천 기록 조회 실패' }, { status: 500 });
    }
  
    if (!existing) {
      return NextResponse.json({ error: '추천 기록이 없습니다.' }, { status: 404 });
    }

    // ✅ 2. 추천 삭제
  const { error: deleteError } = await supabase
    .from('votes')
    .delete()
    .eq('user_id', userData.id) // 이메일 대신 UUID 사용
    .eq('item_id', Number(itemId)); // 숫자로 변환

  if (deleteError) {
    return NextResponse.json({ error: '추천 취소 실패' }, { status: 500 });
  }


  // ✅ 3. 캐시 감소 RPC
  const { error: rpcError } = await supabase.rpc('decrement_votes', {
    item_id_input: Number(itemId),
  });

  if (rpcError) {
    return NextResponse.json({ error: '추천 수 감소 실패' }, { status: 500 });
  }

  return NextResponse.json({ success: true, itemId });
}