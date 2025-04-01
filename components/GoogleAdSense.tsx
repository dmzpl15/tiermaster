'use client';

import { useEffect } from 'react';

// AdSense 타입 선언
declare global {
  interface Window {
    adsbygoogle: Array<Record<string, unknown>>;
  }
}

type AdType = 'horizontal' | 'vertical' | 'square';

interface GoogleAdSenseProps {
  type: AdType;
  className?: string;
}

const getSlotId = (type: AdType): string => {
  switch (type) {
    case 'horizontal':
      return process.env.NEXT_PUBLIC_ADSENSE_HORIZONTAL_SLOT || '';
    case 'vertical':
      return process.env.NEXT_PUBLIC_ADSENSE_VERTICAL_SLOT || '';
    case 'square':
      return process.env.NEXT_PUBLIC_ADSENSE_SQUARE_SLOT || '';
    default:
      return process.env.NEXT_PUBLIC_ADSENSE_HORIZONTAL_SLOT || '';
  }
};

export default function GoogleAdSense({ type, className = '' }: GoogleAdSenseProps) {
  const clientId = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID || '';
  const slotId = getSlotId(type);

  useEffect(() => {
    // 애드센스 광고 로딩 지연
    const timer = setTimeout(() => {
      try {
        if (clientId && slotId && typeof window !== 'undefined') {
          // 광고 초기화 시도
          if (window.adsbygoogle && Array.isArray(window.adsbygoogle)) {
            window.adsbygoogle.push({});
          } else {
            // adsbygoogle 객체가 없는 경우 초기화
            window.adsbygoogle = window.adsbygoogle || [];
            window.adsbygoogle.push({});
          }
        }
      } catch (err) {
        console.error('AdSense 오류:', err);
      }
    }, 100); // 지연을 통해 스크립트가 먼저 로드되도록 함
    
    return () => clearTimeout(timer);
  }, [clientId, slotId]);

  if (!clientId || !slotId) return null;

  return (
    <div className={className}>
      <ins
        className="adsbygoogle"
        style={{ display: 'block', width: '100%', height: '100%', minHeight: '100px' }}
        data-ad-client={clientId}
        data-ad-slot={slotId}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  );
}
