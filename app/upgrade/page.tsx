'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { USER_TIERS, TIER_PRICES, TIER_BENEFITS } from '@/lib/constants';

export default function UpgradePage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [userTier, setUserTier] = useState<string>(USER_TIERS.FREE);
    const [loading, setLoading] = useState(true);
    
    // 사용자 정보 로드
    useEffect(() => {
        if (session && session.user) {
            const fetchUserInfo = async () => {
                try {
                    const response = await fetch('/api/user/info');
                    const data = await response.json();
                    
                    if (data.success) {
                        setUserTier(data.tier || USER_TIERS.FREE);
                    }
                    setLoading(false);
                } catch (error) {
                    console.error('사용자 정보 로드 실패:', error);
                    setLoading(false);
                }
            };
            
            fetchUserInfo();
        } else if (status === 'unauthenticated') {
            router.push('/api/auth/signin?callbackUrl=/upgrade');
        }
    }, [session, status, router]);
    
    const handleUpgrade = async (tier: string) => {
        // 실제 구현에서는 결제 처리 로직 추가
        alert(`${tier} 등급으로 업그레이드 예정입니다. 결제 시스템은 추후 구현 예정입니다.`);
    };
    
    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <p>로딩 중...</p>
            </div>
        );
    }
    
    return (
        <div className="max-w-4xl mx-auto p-6">
            <h1 className="text-3xl font-bold mb-6 text-center text-gray-900 dark:text-white">등급 업그레이드</h1>
            
            <div className="mb-8 text-center">
                <p className="text-lg text-gray-700 dark:text-gray-300">
                    현재 등급: <span className={`font-semibold ${
                        userTier === USER_TIERS.PREMIUM ? 'text-blue-600 dark:text-blue-400' : 
                        userTier === USER_TIERS.PRO ? 'text-purple-600 dark:text-purple-400' : 
                        'text-gray-600 dark:text-gray-400'
                    }`}>
                        {userTier === USER_TIERS.FREE ? '무료 회원' : 
                         userTier === USER_TIERS.PREMIUM ? '프리미엄 회원' : 
                         userTier === USER_TIERS.PRO ? 'Pro 회원' : 
                         userTier === USER_TIERS.ADMIN ? '관리자' : '무료 회원'}
                    </span>
                </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* 무료 등급 */}
                <div className={`border rounded-lg overflow-hidden shadow-sm ${userTier === USER_TIERS.FREE ? 'border-gray-400 bg-gray-50 dark:bg-gray-800' : 'border-gray-200 bg-white dark:bg-gray-900'}`}>
                    <div className="p-6">
                        <h2 className="text-xl font-bold mb-2 text-gray-800 dark:text-gray-200">무료 회원</h2>
                        <p className="text-3xl font-bold mb-4 text-gray-900 dark:text-white">₩0<span className="text-sm font-normal text-gray-500">/월</span></p>
                        <div className="mb-6">
                            <ul className="space-y-2">
                                {TIER_BENEFITS[USER_TIERS.FREE].map((benefit, index) => (
                                    <li key={index} className="flex items-start">
                                        <span className="text-green-500 mr-2">✓</span>
                                        <span className="text-sm text-gray-600 dark:text-gray-400">{benefit}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <button 
                            disabled={true}
                            className="w-full py-2 px-4 bg-gray-300 text-gray-700 rounded-md cursor-not-allowed"
                        >
                            현재 등급
                        </button>
                    </div>
                </div>
                
                {/* 프리미엄 등급 */}
                <div className={`border rounded-lg overflow-hidden shadow-md ${
                    userTier === USER_TIERS.PREMIUM ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20' : 
                    'border-gray-200 bg-white dark:bg-gray-900'
                }`}>
                    <div className="p-6">
                        <h2 className="text-xl font-bold mb-2 text-blue-600 dark:text-blue-400">프리미엄 회원</h2>
                        <p className="text-3xl font-bold mb-4 text-gray-900 dark:text-white">₩{TIER_PRICES[USER_TIERS.PREMIUM].toLocaleString()}<span className="text-sm font-normal text-gray-500">/월</span></p>
                        <div className="mb-6">
                            <ul className="space-y-2">
                                {TIER_BENEFITS[USER_TIERS.PREMIUM].map((benefit, index) => (
                                    <li key={index} className="flex items-start">
                                        <span className="text-blue-500 mr-2">✓</span>
                                        <span className="text-sm text-gray-600 dark:text-gray-400">{benefit}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                        {userTier === USER_TIERS.PREMIUM ? (
                            <button 
                                disabled={true}
                                className="w-full py-2 px-4 bg-blue-300 text-blue-700 rounded-md cursor-not-allowed"
                            >
                                현재 등급
                            </button>
                        ) : userTier === USER_TIERS.PRO ? (
                            <button 
                                disabled={true}
                                className="w-full py-2 px-4 bg-gray-300 text-gray-700 rounded-md cursor-not-allowed"
                            >
                                다운그레이드 불가
                            </button>
                        ) : (
                            <button 
                                onClick={() => handleUpgrade(USER_TIERS.PREMIUM)}
                                className="w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                            >
                                업그레이드
                            </button>
                        )}
                    </div>
                </div>
                
                {/* Pro 등급 */}
                <div className={`border rounded-lg overflow-hidden shadow-md ${
                    userTier === USER_TIERS.PRO ? 'border-purple-400 bg-purple-50 dark:bg-purple-900/20' : 
                    'border-gray-200 bg-white dark:bg-gray-900'
                }`}>
                    <div className="p-6">
                        <h2 className="text-xl font-bold mb-2 text-purple-600 dark:text-purple-400">Pro 회원</h2>
                        <p className="text-3xl font-bold mb-4 text-gray-900 dark:text-white">₩{TIER_PRICES[USER_TIERS.PRO].toLocaleString()}<span className="text-sm font-normal text-gray-500">/월</span></p>
                        <div className="mb-6">
                            <ul className="space-y-2">
                                {TIER_BENEFITS[USER_TIERS.PRO].map((benefit, index) => (
                                    <li key={index} className="flex items-start">
                                        <span className="text-purple-500 mr-2">✓</span>
                                        <span className="text-sm text-gray-600 dark:text-gray-400">{benefit}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                        {userTier === USER_TIERS.PRO ? (
                            <button 
                                disabled={true}
                                className="w-full py-2 px-4 bg-purple-300 text-purple-700 rounded-md cursor-not-allowed"
                            >
                                현재 등급
                            </button>
                        ) : (
                            <button 
                                onClick={() => handleUpgrade(USER_TIERS.PRO)}
                                className="w-full py-2 px-4 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
                            >
                                업그레이드
                            </button>
                        )}
                    </div>
                </div>
            </div>
            
            <div className="mt-8 text-center">
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                    결제는 매월 자동으로 갱신되며, 언제든지 취소할 수 있습니다.
                </p>
                <Link href="/submit" className="text-blue-600 hover:underline">
                    항목 제안 페이지로 돌아가기
                </Link>
            </div>
        </div>
    );
}
