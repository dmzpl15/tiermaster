// app/api/admin/process-suggestion/route.ts
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
    const { id, action, reason } = await request.json();
    
    if (!id || !action || !['approve', 'reject'].includes(action)) {
      return NextResponse.json({ 
        success: false, 
        message: '유효하지 않은 요청입니다.' 
      }, { status: 400 });
    }
    
    // Supabase 클라이언트 생성
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    
    // 제안된 항목 정보 조회
    const { data: suggestion, error: fetchError } = await supabase
      .from('item_suggestions')
      .select('*')
      .eq('id', id)
      .single();
    
    if (fetchError || !suggestion) {
      console.error('제안된 항목 조회 실패:', fetchError);
      return NextResponse.json({ 
        success: false, 
        message: '제안된 항목을 찾을 수 없습니다.' 
      }, { status: 404 });
    }
    
    // 이미 처리된 항목인지 확인
    if (suggestion.status !== 'pending') {
      return NextResponse.json({ 
        success: false, 
        message: '이미 처리된 제안입니다.' 
      }, { status: 400 });
    }
    
    // 승인/거부 처리
    if (action === 'approve') {
      // 1. 항목 테이블에 추가
      const { data: newItem, error: addError } = await supabase
        .from('items')
        .insert([
          { 
            name: suggestion.name,
            category_id: suggestion.category_id,
            votes: 0 // 초기 추천 수는 0으로 설정
          }
        ])
        .select();
      
      if (addError) {
        console.error('항목 추가 실패:', addError);
        return NextResponse.json({ 
          success: false, 
          message: '항목 추가 중 오류가 발생했습니다.',
          error: addError.message
        }, { status: 500 });
      }
      
      // 2. 제안 상태 업데이트
      const { error: updateError } = await supabase
        .from('item_suggestions')
        .update({ 
          status: 'approved',
          processed_at: new Date().toISOString(),
          processed_by: session.user.email,
          item_id: newItem?.[0]?.id || null
        })
        .eq('id', id);
      
      if (updateError) {
        console.error('제안 상태 업데이트 실패:', updateError);
        return NextResponse.json({ 
          success: false, 
          message: '제안 상태 업데이트 중 오류가 발생했습니다.',
          error: updateError.message
        }, { status: 500 });
      }
      
      return NextResponse.json({ 
        success: true, 
        message: '제안이 승인되었습니다.',
        item: newItem?.[0] || null
      });
    } else {
      // 거부 처리
      const { error: updateError } = await supabase
        .from('item_suggestions')
        .update({ 
          status: 'rejected',
          processed_at: new Date().toISOString(),
          processed_by: session.user.email,
          rejection_reason: reason || '관리자에 의해 거부됨'
        })
        .eq('id', id);
      
      if (updateError) {
        console.error('제안 상태 업데이트 실패:', updateError);
        return NextResponse.json({ 
          success: false, 
          message: '제안 상태 업데이트 중 오류가 발생했습니다.',
          error: updateError.message
        }, { status: 500 });
      }
      
      return NextResponse.json({ 
        success: true, 
        message: '제안이 거부되었습니다.'
      });
    }
  } catch (e) {
    console.error('제안 처리 중 예외 발생:', e);
    return NextResponse.json({ 
      success: false, 
      message: '서버 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.' 
    }, { status: 500 });
  }
}
