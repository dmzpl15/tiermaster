// app/api/admin/add-item/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: Request) {
  try {
    const { name, category_id, votes = 0 } = await req.json();
    
    // 필수 필드 확인
    if (!name || !category_id) {
      return NextResponse.json({ 
        success: false, 
        message: '항목 이름과 카테고리는 필수입니다.' 
      }, { status: 400 });
    }

    // Supabase 클라이언트 생성
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    
    // 항목 추가
    const { data, error } = await supabase
      .from('items')
      .insert({
        name,
        category_id,
        votes: parseInt(votes) || 0
      })
      .select()
      .single();
    
    if (error) {
      console.error('항목 추가 실패:', error);
      return NextResponse.json({ 
        success: false, 
        message: '항목 추가 중 오류가 발생했습니다.',
        error: error.message
      }, { status: 500 });
    }
    
    return NextResponse.json({ 
      success: true, 
      message: '항목이 성공적으로 추가되었습니다.',
      item: data
    });
  } catch (e) {
    console.error('항목 추가 처리 중 예외 발생:', e);
    return NextResponse.json({ 
      success: false, 
      message: '항목 추가 처리 중 오류가 발생했습니다.',
      error: e instanceof Error ? e.message : String(e)
    }, { status: 500 });
  }
}
