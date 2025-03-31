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
    try {
      if (clientId && slotId) {
        // 애드센스 광고 로딩
        if (typeof window !== 'undefined') {
          // 안전한 방식으로 애드센스 스크립트 추가
          if (!window.adsbygoogle) {
            window.adsbygoogle = [];
          }
          window.adsbygoogle.push({});
        }
      }
    } catch (err) {
      console.error('AdSense 오류:', err);
    }
  }, [clientId, slotId]);

  if (!clientId || !slotId) return null;

  return (
    <div className={className}>
      <ins
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client={clientId}
        data-ad-slot={slotId}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  );
}
