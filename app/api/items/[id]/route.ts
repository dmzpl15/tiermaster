import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getServerSession } from 'next-auth';
import { authConfig } from '@/lib/auth-config';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // params를 await해야 함
    const resolvedParams = await Promise.resolve(params);
    console.log('항목 상세 API 호출:', resolvedParams);
    const itemId = resolvedParams.id;
    if (!itemId) {
      return NextResponse.json(
        { error: '항목 ID가 필요합니다.' },
        { status: 400 }
      );
    }

    // Supabase 클라이언트는 이미 생성되어 있음

    // 사용자 세션 가져오기 (로그인 여부 확인)
    const session = await getServerSession(authConfig);
    const userId = session?.user?.email;

    // 항목 정보 가져오기 - 테이블 구조에 맞게 수정
    const { data: item, error: itemError } = await supabase
      .from('items')
      .select(`
        id,
        name,
        category_id,
        categories (
          id,
          name,
          group_id,
          groups (
            name
          )
        )
      `)
      .eq('id', itemId)
      .single();

    console.log('항목 조회 결과:', { item, error: itemError });

    if (itemError || !item) {
      console.error('항목 조회 오류:', itemError);
      return NextResponse.json(
        { error: '항목을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 해당 항목의 투표 수 가져오기
    const { data: votesData, error: votesError } = await supabase
      .from('votes')
      .select('id')
      .eq('item_id', itemId);

    if (votesError) {
      console.error('투표 조회 오류:', votesError);
      return NextResponse.json(
        { error: '투표 정보를 가져오는데 실패했습니다.' },
        { status: 500 }
      );
    }

    // 사용자가 이 항목에 투표했는지 확인
    let hasVoted = false;
    if (userId) {
      const { data: userVote, error: userVoteError } = await supabase
        .from('votes')
        .select('id')
        .eq('item_id', itemId)
        .eq('user_id', userId);

      if (!userVoteError && userVote && userVote.length > 0) {
        hasVoted = true;
      }
    }

    // 같은 카테고리의 다른 항목들 가져오기 (최대 6개)
    const { data: relatedItems, error: relatedError } = await supabase
      .from('items')
      .select(`
        id,
        name
      `)
      .eq('category_id', item.category_id)
      .neq('id', itemId)
      .limit(6);

    if (relatedError) {
      console.error('관련 항목 조회 오류:', relatedError);
      // 관련 항목 오류는 치명적이지 않으므로 계속 진행
    }

    // 관련 항목들의 투표 수 가져오기
    const relatedItemsWithVotes = await Promise.all(
      (relatedItems || []).map(async (relatedItem: { id: string; name: string }) => {
        const { data: relatedVotes, error: relatedVotesError } = await supabase
          .from('votes')
          .select('id')
          .eq('item_id', relatedItem.id);

        if (relatedVotesError) {
          console.error(`항목 ${relatedItem.id}의 투표 조회 오류:`, relatedVotesError);
          return {
            ...relatedItem,
            votes: 0,
            tier: 'D' as const
          };
        }

        // 티어 계산
        const votes = relatedVotes?.length || 0;
        let tier: 'S' | 'A' | 'B' | 'C' | 'D' = 'D';
        
        if (votes >= 100) tier = 'S';
        else if (votes >= 50) tier = 'A';
        else if (votes >= 20) tier = 'B';
        else if (votes >= 5) tier = 'C';
        
        return {
          ...relatedItem,
          votes,
          tier
        };
      })
    );

    // 항목의 티어 계산
    const votes = votesData?.length || 0;
    let tier: 'S' | 'A' | 'B' | 'C' | 'D' = 'D';
    
    if (votes >= 100) tier = 'S';
    else if (votes >= 50) tier = 'A';
    else if (votes >= 20) tier = 'B';
    else if (votes >= 5) tier = 'C';

    // 응답 데이터 구성
    const responseData = {
      item: {
        ...item,
        votes,
        tier,
        category: item.categories
      },
      relatedItems: relatedItemsWithVotes,
      hasVoted
    };

    return NextResponse.json(responseData);
  } catch (error) {
    console.error('API 오류:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
