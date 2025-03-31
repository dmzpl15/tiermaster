// app/providers.tsx
'use client';

import { SessionProvider } from 'next-auth/react';
import { ThemeProvider } from 'next-themes';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';


// SessionProvider 같은 전역 Provider 정의


//Providers는 SessionProvider 같은 전역 Context를 포함한 Wrapper 컴포넌트입니다.
//예: NextAuth에서 로그인 세션을 모든 컴포넌트에서 인식하도록 해주는 역할

// 사용자 정보를 저장하는 컴포넌트
function SaveUserInfo() {
    const { data: session } = useSession();
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        // 세션이 있고, 아직 저장되지 않았으면 사용자 정보 저장
        if (session?.user && !saved) {
            const user = session.user; // TypeScript 오류 방지를 위해 변수로 추출
            
            const saveUser = async () => {
                try {
                    if (!user.email) {
                        console.error('이메일이 없습니다.');
                        return;
                    }
                    
                    console.log('🔄 사용자 정보 저장 시도:', user.email);
                    
                    // Supabase 클라이언트 생성
                    const supabase = createClientComponentClient();
                    
                    // 기존 사용자 확인
                    const { data: existingUser, error: selectError } = await supabase
                        .from('users')
                        .select('*')
                        .eq('email', user.email)
                        .maybeSingle();
                    
                    if (selectError) {
                        console.error('사용자 조회 오류:', selectError);
                        return;
                    }
                    
                    // 사용자가 존재하지 않으면 새로 추가
                    if (!existingUser) {
                        console.log('🆕 신규 사용자 등록:', user.email);
                        const { error: insertError } = await supabase.from('users').insert({
                            email: user.email,
                            name: user.name || '',
                            profile_image: user.image || null,
                        });
                        
                        if (insertError) {
                            console.error('사용자 등록 오류:', insertError);
                        } else {
                            console.log('✅ 사용자 등록 성공');
                            setSaved(true);
                        }
                    } else {
                        console.log('👤 기존 사용자 확인:', user.email);
                        setSaved(true);
                    }
                } catch (error) {
                    console.error('사용자 정보 저장 중 오류:', error);
                }
            };
            
            saveUser();
        }
    }, [session, saved]);
    
    // 이 컴포넌트는 UI를 렌더링하지 않습니다.
    return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <SessionProvider>
            <ThemeProvider
                attribute="class"
                defaultTheme="light"      // ✅ 시스템 말고 기본 테마 고정
                enableSystem={false}      // ✅ 서버와 클라이언트 간 동기화 충돌 방지
                disableTransitionOnChange
            >
                <SaveUserInfo />
                {children}
            </ThemeProvider>
        </SessionProvider>
    );
}

//ThemeProvider, SessionProvider는 클라이언트 컴포넌트임 : Context API를 사용하기 때문
//클라이언트 컴포넌트는 'use client'가 필요함	그렇지 않으면 context 오류 발생