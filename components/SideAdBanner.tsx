'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { USER_TIERS } from '@/lib/constants';

export default function SideAdBanner() {
  const { data: session } = useSession();
  const [userTier, setUserTier] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isVisible, setIsVisible] = useState(true);

  // 사용자 등급 확인
  useEffect(() => {
    const checkUserTier = async () => {
      if (session && session.user) {
        try {
          const response = await fetch('/api/user/info');
          const data = await response.json();
          
          if (data.success) {
            setUserTier(data.tier);
          }
        } catch (error) {
          console.error('사용자 정보 로드 실패:', error);
        }
      }
      setLoading(false);
    };
    
    checkUserTier();
  }, [session]);

  // 프리미엄/프로 사용자에게는 광고를 표시하지 않음
  if (!loading && (userTier === USER_TIERS.PREMIUM || userTier === USER_TIERS.PRO || userTier === USER_TIERS.ADMIN)) {
    return null;
  }

  if (!isVisible) {
    return null;
  }

  return (
    <div className="fixed right-4 bottom-4 md:right-8 md:top-32 z-10">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 w-[160px] h-[600px] flex flex-col overflow-hidden">
        <div className="flex justify-between items-center p-2 bg-gray-100 dark:bg-gray-700">
          <span className="text-xs text-gray-500 dark:text-gray-400">광고</span>
          <button 
            onClick={() => setIsVisible(false)}
            className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
          >
            ✕
          </button>
        </div>
        
        <div className="flex-1 flex flex-col items-center justify-center p-4 text-center">
          {/* 실제 광고 코드는 여기에 삽입 */}
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
            광고 없는 경험을 원하시나요?
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-6">
            TierMaster 프리미엄으로 업그레이드하여 광고 없이 이용하세요!
          </p>
          <a 
            href="/upgrade" 
            className="text-xs px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            업그레이드
          </a>
        </div>
      </div>
    </div>
  );
}
