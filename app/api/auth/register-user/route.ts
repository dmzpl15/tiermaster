// app/api/auth/register-user/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';

export async function POST(req: Request) {
  try {
    const { email, name, image } = await req.json();
    
    if (!email) {
      return NextResponse.json(
        { error: '이메일은 필수 항목입니다.' },
        { status: 400 }
      );
    }

    // Supabase 클라이언트 생성 (Route Handler에서는 createRouteHandlerClient 사용)
    const supabase = createRouteHandlerClient({
      cookies: () => cookies(),
    });
    
    // 또는 다음과 같이 사용해도 됩니다:
    // const supabase = createClient(
    //   process.env.NEXT_PUBLIC_SUPABASE_URL!,
    //   process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    // );

    console.log(`사용자 등록 API 호출: ${email}`);

    // 기존 사용자 확인
    const { data: existingUser, error: selectError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .maybeSingle();

    if (selectError) {
      console.error('사용자 조회 오류:', selectError);
      return NextResponse.json(
        { error: '사용자 조회 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

    // 사용자가 존재하지 않으면 새로 추가
    if (!existingUser) {
      const { error: insertError } = await supabase.from('users').insert({
        email,
        name,
        profile_image: image,
      });

      if (insertError) {
        console.error('사용자 등록 오류:', insertError);
        return NextResponse.json(
          { error: '사용자 등록 중 오류가 발생했습니다.' },
          { status: 500 }
        );
      }

      console.log(`신규 사용자 등록 완료: ${email}`);
      return NextResponse.json({ success: true, message: '사용자 등록 완료' });
    }

    // 기존 사용자면 성공 응답
    console.log(`기존 사용자 확인: ${email}`);
    return NextResponse.json({ success: true, message: '기존 사용자 확인' });
  } catch (error) {
    console.error('사용자 등록 처리 중 예외 발생:', error);
    return NextResponse.json(
      { error: '사용자 등록 처리 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
