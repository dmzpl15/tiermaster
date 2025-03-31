'use client';

import { useSession, signIn, signOut } from 'next-auth/react';
import { useTheme } from 'next-themes';
import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';


function useMounted() {
    const [mounted, setMounted] = useState(false);//상태 값을 선언


    //마운트 이후에 실행되는 로직 (DOM 접근, 클라이언트 전용 로직)
    useEffect(() => {
        setMounted(true);
    }, []);

    return mounted;
}

export default function Header() {
    const { data: session, status } = useSession();
    const { theme, setTheme } = useTheme();

    const [dropdownOpen, setDropdownOpen] = useState(false);

    const mounted = useMounted(); // ✅ 추가

    // 개발 모드에서만 로그 출력 (불필요한 로그 제거)
    // if (process.env.NODE_ENV === 'development') {
    //     console.log('세션 사용자 정보:', {
    //         name: session?.user?.name,
    //         email: session?.user?.email,
    //         image: session?.user?.image
    //     });
    // }
    return (
        <header className="px-6 py-4 border-b shadow-sm bg-white dark:bg-gray-900 dark:text-white">
            <div className="flex justify-between items-center flex-wrap">
                {/* 로고 */}
                <Link href="/" className="text-xl font-bold hover:text-blue-600 dark:hover:text-blue-400">
                    🏆 Tier Master
                </Link>

                {/* 오른쪽 메뉴 */}
                <div className="flex items-center gap-4 mt-4 md:mt-0">
                    {/* ✅ 테마 버튼은 mounted 되었을 때만 렌더링 */}
                    {mounted && (
                        <button
                            onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
                            className="text-sm underline text-gray-500 dark:text-gray-300"
                        >
                            {theme === 'dark' ? '☀️ Light' : '🌙 Dark'}
                        </button>
                    )}

                    {/* 로그인 상태 */}
                    {status === 'loading' ? (
                        <span className="text-sm text-gray-400">로딩 중...</span>
                    ) : session ? (
                        <div className="relative">
                            <button
                                onClick={() => setDropdownOpen(!dropdownOpen)}
                                className="flex items-center gap-2 text-sm focus:outline-none"
                            >
                                <Image
                                    src={session.user?.image || '/default-avatar.png'}
                                    width={28}
                                    height={28}
                                    alt="User avatar"
                                    className="rounded-full border"
                                />
                                <span className="hidden md:inline">{session.user?.name}</span>
                            </button>

                            {/* 드롭다운 메뉴 */}
                            {dropdownOpen && (
                                <div className="absolute right-0 mt-2 w-40 bg-white dark:bg-gray-800 border rounded shadow-md text-sm z-50">
                                    <button
                                        onClick={() => {
                                            setDropdownOpen(false);
                                            signOut({ callbackUrl: '/' });
                                        }}
                                        className="block w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700"
                                    >
                                        로그아웃
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <button
                            onClick={() => signIn('google')}
                            className="flex items-center gap-2 text-sm text-gray-700 dark:text-white bg-white dark:bg-gray-700 border border-gray-300 px-4 py-2 rounded hover:shadow"
                        >
                            <Image
                                src="https://developers.google.com/identity/images/g-logo.png"
                                width={18}
                                height={18}
                                alt="Google logo"
                            />
                            로그인
                        </button>
                    )}
                </div>
            </div>
        </header>
    );
}
