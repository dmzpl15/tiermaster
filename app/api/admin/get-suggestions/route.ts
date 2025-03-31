// app/api/admin/get-suggestions/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getServerSession } from 'next-auth';
import { authConfig } from '@/lib/auth-config';

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
    
    // 제안된 항목 목록 조회
    const { data: suggestions, error } = await supabase
      .from('item_suggestions')
      .select(`
        *,
        categories:category_id (
          id,
          name,
          group_id
        )
      `)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('제안된 항목 조회 실패:', error);
      return NextResponse.json({ 
        success: false, 
        message: '제안된 항목 목록을 조회하는 중 오류가 발생했습니다.',
        error: error.message
      }, { status: 500 });
    }
    
    return NextResponse.json({ 
      success: true, 
      suggestions
    });
  } catch (e) {
    console.error('제안된 항목 조회 중 예외 발생:', e);
    return NextResponse.json({ 
      success: false, 
      message: '서버 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.' 
    }, { status: 500 });
  }
}
