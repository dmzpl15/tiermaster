import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// 타입 정의
type Item = {
  id: string;
  name: string;
  votes: number;
  category_id: string;
};

// Supabase 클라이언트 생성
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET() {
  try {
    // 1. 가장 인기 있는 카테고리 찾기 (투표가 많은 순)
    const { data: popularCategories, error: categoriesError } = await supabase
      .from('categories')
      .select(`
        id,
        name,
        group_id,
        groups(name)
      `)
      .order('id', { ascending: true })
      .limit(3);

    if (categoriesError) {
      console.error('인기 카테고리 조회 오류:', categoriesError);
      return NextResponse.json({ error: '카테고리 데이터를 가져오는 중 오류가 발생했습니다.' }, { status: 500 });
    }

    // 2. 각 카테고리별 인기 항목 가져오기
    const popularTiers = await Promise.all(
      popularCategories.map(async (category) => {
        const { data: items, error: itemsError } = await supabase
          .from('items')
          .select('*')
          .eq('category_id', category.id)
          .order('votes', { ascending: false })
          .limit(5);

        if (itemsError) {
          console.error(`카테고리 ${category.id} 항목 조회 오류:`, itemsError);
          return {
            category,
            items: []
          };
        }

        // 티어 계산 로직
        const tieredItems = {
          S: [] as Item[],
          A: [] as Item[],
          B: [] as Item[],
          C: [] as Item[],
          D: [] as Item[]
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

        return {
          category,
          items,
          tieredItems
        };
      })
    );

    return NextResponse.json({ popularTiers });
  } catch (error) {
    console.error('서버 오류:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}
