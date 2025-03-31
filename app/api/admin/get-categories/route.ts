// app/api/admin/get-categories/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  try {
    // Supabase 클라이언트 생성
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    
    // 그룹 데이터 가져오기
    const { data: groups, error: groupsError } = await supabase
      .from('groups')
      .select('*')
      .order('name');
    
    if (groupsError) {
      console.error('그룹 데이터 조회 실패:', groupsError);
      return NextResponse.json({ 
        success: false, 
        message: '그룹 데이터 조회 중 오류가 발생했습니다.',
        error: groupsError.message
      }, { status: 500 });
    }
    
    // 카테고리 데이터 가져오기
    const { data: categories, error: categoriesError } = await supabase
      .from('categories')
      .select('*')
      .order('name');
    
    if (categoriesError) {
      console.error('카테고리 데이터 조회 실패:', categoriesError);
      return NextResponse.json({ 
        success: false, 
        message: '카테고리 데이터 조회 중 오류가 발생했습니다.',
        error: categoriesError.message
      }, { status: 500 });
    }
    
    return NextResponse.json({ 
      success: true, 
      groups,
      categories
    });
  } catch (e) {
    console.error('데이터 조회 처리 중 예외 발생:', e);
    return NextResponse.json({ 
      success: false, 
      message: '데이터 조회 처리 중 오류가 발생했습니다.',
      error: e instanceof Error ? e.message : String(e)
    }, { status: 500 });
  }
}
