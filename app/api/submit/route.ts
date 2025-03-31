// app/api/submit/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getServerSession } from 'next-auth';
import { authConfig } from '@/lib/auth-config';

export async function POST(request: Request) {
  try {
    // 세션 확인 (로그인 상태 확인)
    const session = await getServerSession(authConfig);
    
    if (!session || !session.user) {
      return NextResponse.json({ 
        success: false, 
        message: '로그인이 필요한 기능입니다.' 
      }, { status: 401 });
    }
    
    // 요청 데이터 파싱
    const { name, categoryId, description } = await request.json();
    
    // 필수 데이터 검증
    if (!name || !categoryId) {
      return NextResponse.json({ 
        success: false, 
        message: '항목 이름과 카테고리는 필수 입력 항목입니다.' 
      }, { status: 400 });
    }
    
    // Supabase 클라이언트 생성
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    
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
    
    // 기본 사용자는 월 2회까지 제안 가능 (추후 등급별로 차등 적용 예정)
    const maxSubmissions = 2;
    if (count && count >= maxSubmissions) {
      return NextResponse.json({ 
        success: false, 
        message: `이번 달 제안 가능 횟수(${maxSubmissions}회)를 모두 사용하셨습니다.` 
      }, { status: 403 });
    }
    
    // 항목 제안 데이터 저장
    const { data, error } = await supabase
      .from('item_suggestions')
      .insert([
        { 
          name,
          category_id: categoryId,
          description: description || null,
          user_email: session.user.email,
          user_name: session.user.name || '익명',
          status: 'pending' // 'pending', 'approved', 'rejected'
        }
      ])
      .select();
    
    if (error) {
      console.error('항목 제안 저장 실패:', error);
      return NextResponse.json({ 
        success: false, 
        message: '항목 제안 저장 중 오류가 발생했습니다.',
        error: error.message
      }, { status: 500 });
    }
    
    return NextResponse.json({ 
      success: true, 
      message: '항목 제안이 성공적으로 접수되었습니다. 검토 후 반영됩니다.',
      data
    });
  } catch (e) {
    console.error('항목 제안 처리 중 예외 발생:', e);
    return NextResponse.json({ 
      success: false, 
      message: '서버 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.' 
    }, { status: 500 });
  }
}
