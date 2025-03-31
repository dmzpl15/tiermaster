import { supabase } from '@/lib/supabase';
import { NextResponse } from 'next/server';

export async function POST() {
  try {
    // 외래 키 참조 순서를 고려하여 테이블 순서 정의
    // 자식 테이블부터 삭제해야 외래 키 제약조건에 위배되지 않음
    const tables = ['votes', 'items', 'categories', 'groups'];
    
    // 각 테이블 비우기
    for (const table of tables) {
      const { error } = await supabase
        .from(table)
        .delete()
        .not('id', 'is', null); // UUID 필드에 더 안정적인 방식
      
      if (error) {
        console.error(`${table} 테이블 초기화 중 오류:`, error);
        return NextResponse.json({ 
          message: `${table} 테이블 초기화 중 오류가 발생했습니다.`, 
          error: error.message 
        }, { status: 500 });
      }
    }
    
    // users 테이블은 초기화하지 않음 (사용자 정보 유지)
    // 필요시 아래 주석을 해제하여 users 테이블도 초기화 가능
    /*
    const { error: usersError } = await supabase
      .from('users')
      .delete()
      .not('id', 'is', null);
      
    if (usersError) {
      console.error('users 테이블 초기화 중 오류:', usersError);
    }
    */
    
    return NextResponse.json({ message: '데이터베이스 초기화가 완료되었습니다.' });
  } catch (error) {
    console.error('초기화 중 예외 발생:', error);
    return NextResponse.json({ 
      message: '초기화 중 오류가 발생했습니다.', 
      error: error instanceof Error ? error.message : String(error) 
    }, { status: 500 });
  }
}