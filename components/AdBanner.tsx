'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { USER_TIERS } from '@/lib/constants';
import GoogleAdSense from './GoogleAdSense';

interface AdBannerProps {
  type?: 'horizontal' | 'vertical' | 'square';
  className?: string;
}

export default function AdBanner({ type = 'horizontal', className = '' }: AdBannerProps) {
  const { data: session } = useSession();
  const [userTier, setUserTier] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

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

  // 광고 크기 설정
  let adSize = '';
  switch (type) {
    case 'horizontal':
      adSize = 'h-[90px] w-full max-w-[728px]';
      break;
    case 'vertical':
      adSize = 'h-[600px] w-[160px]';
      break;
    case 'square':
      adSize = 'h-[250px] w-[300px]';
      break;
    default:
      adSize = 'h-[90px] w-full max-w-[728px]';
  }

  // AdSense가 활성화되어 있는지 확인 (환경 변수 설정 여부)
  const isAdSenseEnabled = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID && (
    process.env.NEXT_PUBLIC_ADSENSE_HORIZONTAL_SLOT ||
    process.env.NEXT_PUBLIC_ADSENSE_SQUARE_SLOT ||
    process.env.NEXT_PUBLIC_ADSENSE_VERTICAL_SLOT
  );
  
  // 광고 슬롯 ID 결정
  let slotId = '';
  if (isAdSenseEnabled) {
    switch (type) {
      case 'horizontal':
        slotId = process.env.NEXT_PUBLIC_ADSENSE_HORIZONTAL_SLOT || '';
        break;
      case 'vertical':
        slotId = process.env.NEXT_PUBLIC_ADSENSE_VERTICAL_SLOT || '';
        break;
      case 'square':
        slotId = process.env.NEXT_PUBLIC_ADSENSE_SQUARE_SLOT || '';
        break;
    }
  }
  
  return (
    <div className={`ad-container ${adSize} ${className} bg-gray-100 dark:bg-gray-800 flex items-center justify-center my-4 mx-auto overflow-hidden rounded-md`}>
      {loading ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">광고 로딩 중...</p>
      ) : isAdSenseEnabled && slotId ? (
        <>
          <p className="text-xs text-gray-400 dark:text-gray-500 absolute top-1 left-2 z-10">광고</p>
          <GoogleAdSense 
            type={type}
            className="w-full h-full"
          />
        </>
      ) : (
        <>
          <p className="text-xs text-gray-400 dark:text-gray-500 absolute top-1 left-2">광고</p>
          <div className="ad-content text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              TierMaster 프리미엄으로 업그레이드하여 광고 없이 이용하세요!
            </p>
            <a 
              href="/upgrade" 
              className="text-xs mt-2 inline-block px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              업그레이드
            </a>
          </div>
        </>
      )}
    </div>
  );
}
