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
            console.log('dmzpl 전체 세션 객체:', JSON.stringify(session, null, 2));
            const saveUser = async () => {
                try {
                    if (!user.email) {
                        console.error('이메일이 없습니다.');
                        return;
                    }
                    
                    console.log('🔄 사용자 정보 저장 시도:', user.email);
                    
                    // API 라우트를 통해 사용자 정보 저장
                    // provider_id를 user.id로 사용 (네이밍 협약상 NextAuth에서는 소셜 로그인 ID가 user.id로 전달됨)
                    const response = await fetch('/api/auth/register-user', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            email: user.email,
                            name: user.name || '',
                            image: user.image || null,
                            provider_id: user.id, // NextAuth에서 전달된 소셜 로그인 ID
                            provider_type: 'google', // 현재는 Google만 사용하고 있음
                        }),
                    });
                    
                    if (response.ok) {
                        const result = await response.json();
                        console.log('✅ 사용자 정보 저장 성공:', result.message);
                        setSaved(true);
                    } else {
                        const errorData = await response.json();
                        console.error('사용자 정보 저장 실패:', errorData.error);
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