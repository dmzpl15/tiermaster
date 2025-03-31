import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Supabase 클라이언트 생성
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET(req: Request) {
  try {
    // URL에서 카테고리 ID 파라미터 추출
    const url = new URL(req.url);
    const categoryId = url.searchParams.get('categoryId');
    
    if (!categoryId) {
      return NextResponse.json({ error: '카테고리 ID가 필요합니다.' }, { status: 400 });
    }

    // 카테고리 정보 가져오기
    const { data: categoryData, error: categoryError } = await supabase
      .from('categories')
      .select('*')
      .eq('id', categoryId)
      .single();

    if (categoryError) {
      console.error('카테고리 조회 오류:', categoryError);
      return NextResponse.json({ error: '카테고리를 찾을 수 없습니다.' }, { status: 404 });
    }

    // 해당 카테고리의 항목들 가져오기 (추천수 내림차순 정렬)
    const { data: items, error: itemsError } = await supabase
      .from('items')
      .select('*')
      .eq('category_id', categoryId)
      .order('votes', { ascending: false });

    if (itemsError) {
      console.error('항목 조회 오류:', itemsError);
      return NextResponse.json({ error: '항목을 가져오는 중 오류가 발생했습니다.' }, { status: 500 });
    }

    // 티어 계산 로직
    let tieredItems = {
      S: [] as any[],
      A: [] as any[],
      B: [] as any[],
      C: [] as any[],
      D: [] as any[]
    };

    // 항목이 있는 경우에만 티어 계산
    if (items && items.length > 0) {
      const maxVotes = Math.max(...items.map(item => item.votes));
      const minVotes = Math.min(...items.map(item => item.votes));
      const range = maxVotes - minVotes || 1; // 0으로 나누는 것 방지
      
      // 각 항목을 티어에 할당
      items.forEach(item => {
        const normalizedScore = (item.votes - minVotes) / range;
        
        if (normalizedScore >= 0.8) {
          tieredItems.S.push(item);
        } else if (normalizedScore >= 0.6) {
          tieredItems.A.push(item);
        } else if (normalizedScore >= 0.4) {
          tieredItems.B.push(item);
        } else if (normalizedScore >= 0.2) {
          tieredItems.C.push(item);
        } else {
          tieredItems.D.push(item);
        }
      });
    }

    return NextResponse.json({ 
      category: categoryData,
      items: items,
      tieredItems: tieredItems
    });
    
  } catch (error) {
    console.error('서버 오류:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}
