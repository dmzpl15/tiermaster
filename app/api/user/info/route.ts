// app/api/user/info/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getServerSession } from 'next-auth';
import { authConfig } from '@/lib/auth-config';
import { USER_TIERS } from '@/lib/constants';

export async function GET() {
  try {
    // 세션 확인 (로그인 상태 확인)
    const session = await getServerSession(authConfig);
    
    if (!session || !session.user) {
      return NextResponse.json({ 
        success: false, 
        message: '로그인이 필요한 기능입니다.' 
      }, { status: 401 });
    }
    
    // Supabase 클라이언트 생성
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    
    // 사용자 정보 조회
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', session.user.email)
      .single();
    
    if (userError) {
      console.error('사용자 정보 조회 실패:', userError);
      return NextResponse.json({ 
        success: false, 
        message: '사용자 정보 확인 중 오류가 발생했습니다.' 
      }, { status: 500 });
    }
    
    // 사용자 정보 반환
    return NextResponse.json({ 
      success: true, 
      tier: userData?.tier || USER_TIERS.FREE,
      name: userData?.name || session.user.name,
      email: userData?.email || session.user.email,
      profile_image: userData?.profile_image || session.user.image,
      created_at: userData?.created_at
    });
  } catch (e) {
    console.error('사용자 정보 조회 중 오류 발생:', e);
    return NextResponse.json({ 
      success: false, 
      message: '서버 오류가 발생했습니다.' 
    }, { status: 500 });
  }
}
