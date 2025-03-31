// app/api/submit/remaining/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getServerSession } from 'next-auth';
import { authConfig } from '@/lib/auth-config';
import { MONTHLY_SUBMISSION_LIMITS, USER_TIERS } from '@/lib/constants';

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
    
    // 사용자 정보 조회 (등급 확인)
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('tier')
      .eq('email', session.user.email)
      .single();
    
    if (userError) {
      console.error('사용자 정보 조회 실패:', userError);
      return NextResponse.json({ 
        success: false, 
        message: '사용자 정보 확인 중 오류가 발생했습니다.' 
      }, { status: 500 });
    }
    
    // 사용자 등급 확인 (기본값은 free)
    const userTier = userData?.tier || USER_TIERS.FREE;
    
    // 사용자 제안 횟수 확인 (월별)
    const currentDate = new Date();
    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    
    const { count, error: countError } = await supabase
      .from('item_suggestions')
      .select('*', { count: 'exact', head: true })
      .eq('user_email', session.user.email)
      .gte('created_at', firstDayOfMonth.toISOString())
      .lte('created_at', lastDayOfMonth.toISOString());
    
    if (countError) {
      console.error('제안 횟수 조회 실패:', countError);
      return NextResponse.json({ 
        success: false, 
        message: '제안 횟수 확인 중 오류가 발생했습니다.' 
      }, { status: 500 });
    }
    
    // 등급별 제안 가능 횟수 적용
    const maxSubmissions = MONTHLY_SUBMISSION_LIMITS[userTier] || MONTHLY_SUBMISSION_LIMITS[USER_TIERS.FREE];
    const remaining = Math.max(0, maxSubmissions - (count || 0));
    
    return NextResponse.json({ 
      success: true, 
      remaining,
      tier: userTier,
      maxSubmissions,
      max: maxSubmissions
    });
  } catch (e) {
    console.error('남은 제안 횟수 조회 중 예외 발생:', e);
    return NextResponse.json({ 
      success: false, 
      message: '서버 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.' 
    }, { status: 500 });
  }
}
