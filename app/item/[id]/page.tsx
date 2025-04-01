'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import AdBanner from '@/components/AdBanner';
import { useSession } from 'next-auth/react';

// 티어 색상 정의
const tierColors = {
  S: { bg: 'bg-yellow-100 dark:bg-yellow-900', text: 'text-yellow-800 dark:text-yellow-200', border: 'border-yellow-300 dark:border-yellow-700' },
  A: { bg: 'bg-red-100 dark:bg-red-900', text: 'text-red-800 dark:text-red-200', border: 'border-red-300 dark:border-red-700' },
  B: { bg: 'bg-blue-100 dark:bg-blue-900', text: 'text-blue-800 dark:text-blue-200', border: 'border-blue-300 dark:border-blue-700' },
  C: { bg: 'bg-green-100 dark:bg-green-900', text: 'text-green-800 dark:text-green-200', border: 'border-green-300 dark:border-green-700' },
  D: { bg: 'bg-gray-100 dark:bg-gray-800', text: 'text-gray-800 dark:text-gray-300', border: 'border-gray-300 dark:border-gray-700' }
};

type ItemData = {
  id: string;
  name: string;
  votes: number;
  tier: 'S' | 'A' | 'B' | 'C' | 'D';
  category: {
    id: string;
    name: string;
    group_id: string;
    groups: {
      name: string;
    };
  };
};

type RelatedItem = {
  id: string;
  name: string;
  votes: number;
  tier: 'S' | 'A' | 'B' | 'C' | 'D';
};

export default function ItemDetailPage() {
  const params = useParams();
  const { data: session } = useSession();
  const [item, setItem] = useState<ItemData | null>(null);
  const [relatedItems, setRelatedItems] = useState<RelatedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasVoted, setHasVoted] = useState(false);

  // Kakao SDK 초기화
  useEffect(() => {
    // Kakao SDK 스크립트 로드
    const script = document.createElement('script');
    script.src = 'https://developers.kakao.com/sdk/js/kakao.js';
    script.async = true;
    document.body.appendChild(script);

    script.onload = () => {
      // Kakao SDK 초기화
      const apiKey = process.env.NEXT_PUBLIC_KAKAO_API_KEY || '';
      if (apiKey) {
        window.Kakao.init(apiKey);
      } else {
        console.error('Kakao API 키가 설정되지 않았습니다.');
      }
    };

    return () => {
      if (script.parentNode) {
        document.body.removeChild(script);
      }
    };
  }, []);

  // 항목 데이터 로드
  useEffect(() => {
    const fetchItemData = async () => {
      if (!params.id) return;
      
      try {
        setLoading(true);
        const response = await fetch(`/api/items/${params.id}`);
        
        if (!response.ok) {
          throw new Error('항목 데이터를 가져오는데 실패했습니다.');
        }
        
        const data = await response.json();
        setItem(data.item);
        setRelatedItems(data.relatedItems || []);
        setHasVoted(data.hasVoted || false);
        setError(null);
      } catch (err: unknown) {
        console.error('데이터 로딩 오류:', err);
        setError(err instanceof Error ? err.message : '데이터를 가져오는데 실패했습니다.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchItemData();
  }, [params.id]);

  // 투표 함수
  const handleVote = async () => {
    if (!session) {
      // 로그인 페이지로 리디렉션
      window.location.href = `/login?callbackUrl=${encodeURIComponent(window.location.href)}`;
      return;
    }

    if (!item) return;

    try {
      const response = await fetch('/api/vote', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          itemId: item.id,
          categoryId: item.category.id,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || '투표에 실패했습니다.');
      }

      // 투표 성공 후 데이터 새로고침
      const updatedItemResponse = await fetch(`/api/items/${params.id}`);
      const updatedData = await updatedItemResponse.json();
      setItem(updatedData.item);
      setHasVoted(true);
    } catch (err: unknown) {
      console.error('투표 오류:', err);
      alert(err instanceof Error ? err.message : '투표 중 오류가 발생했습니다.');
    }
  };

  // 카카오톡 공유하기
  const shareToKakao = () => {
    if (!item) return;
    
    if (window.Kakao) {
      const shareUrl = `${window.location.origin}/item/${item.id}`;
      
      window.Kakao.Link.sendDefault({
        objectType: 'feed',
        content: {
          title: `${item.name} - Tier Master`,
          description: `${item.name}은(는) 현재 ${item.tier} 티어에 있으며, ${item.votes}개의 추천을 받았습니다.`,
          imageUrl: `${window.location.origin}/images/default-item.jpg`,
          link: {
            mobileWebUrl: shareUrl,
            webUrl: shareUrl
          }
        },
        buttons: [
          {
            title: '자세히 보기',
            link: {
              mobileWebUrl: shareUrl,
              webUrl: shareUrl
            }
          },
          {
            title: '추천하기',
            link: {
              mobileWebUrl: shareUrl,
              webUrl: shareUrl
            }
          }
        ]
      });
    } else {
      alert('카카오톡 SDK를 불러오는데 실패했습니다.');
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-4"></div>
          <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-4"></div>
          <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
        </div>
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className="max-w-4xl mx-auto p-6 text-center">
        <h1 className="text-2xl font-bold mb-4 text-red-600 dark:text-red-400">오류 발생</h1>
        <p className="mb-4">{error || '항목을 찾을 수 없습니다.'}</p>
        <Link href="/" className="text-blue-600 dark:text-blue-400 hover:underline">
          홈으로 돌아가기
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* 상단 네비게이션 */}
      <div className="mb-6">
        <Link href={`/ranking/${item.category.id}`} className="text-blue-600 dark:text-blue-400 hover:underline">
          ← {item.category.groups.name} - {item.category.name} 랭킹으로 돌아가기
        </Link>
      </div>

      {/* 항목 헤더 */}
      <div className="mb-8">
        <div className="flex items-center mb-2">
          <span className={`w-10 h-10 rounded-full flex items-center justify-center mr-3 ${tierColors[item.tier].bg} ${tierColors[item.tier].text} font-bold text-xl border-2 ${tierColors[item.tier].border}`}>
            {item.tier}
          </span>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-200">{item.name}</h1>
        </div>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          {item.category.groups.name} - {item.category.name} 카테고리
        </p>
      </div>

      {/* 광고 배너 */}
      <AdBanner type="horizontal" className="mb-8" />

      {/* 항목 상세 정보 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
        {/* 이미지 */}
        <div className="md:col-span-1">
          <div className={`rounded-lg overflow-hidden border-2 ${tierColors[item.tier].border} h-64 relative`}>
            <div className={`w-full h-full flex items-center justify-center ${tierColors[item.tier].bg}`}>
              <span className="text-4xl">{item.name.charAt(0)}</span>
            </div>
          </div>
        </div>

        {/* 정보 및 투표 */}
        <div className="md:col-span-2">
          <div className={`p-6 rounded-lg border ${tierColors[item.tier].border} ${tierColors[item.tier].bg} mb-6`}>
            <div className="flex justify-between items-center mb-4">
              <div>
                <h2 className="text-xl font-bold mb-1">현재 티어: <span className={tierColors[item.tier].text}>{item.tier}</span></h2>
                <p className="text-gray-700 dark:text-gray-300">총 추천 수: {item.votes}</p>
              </div>
              <button
                onClick={handleVote}
                disabled={hasVoted}
                className={`px-6 py-2 rounded-lg font-medium ${
                  hasVoted 
                    ? 'bg-gray-300 dark:bg-gray-700 text-gray-600 dark:text-gray-400 cursor-not-allowed' 
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                {hasVoted ? '추천 완료' : '👍 추천하기'}
              </button>
            </div>
            
            <div className="mb-4">
              <h3 className="font-semibold mb-1">카테고리:</h3>
              <p className="text-gray-700 dark:text-gray-300">{item.category.groups.name} - {item.category.name}</p>
            </div>

            {/* 공유 버튼 */}
            <div className="mt-6">
              <h3 className="font-semibold mb-2">이 항목 공유하기:</h3>
              <div className="flex space-x-2">
                <button 
                  onClick={shareToKakao}
                  className="px-4 py-2 bg-yellow-400 hover:bg-yellow-500 text-black rounded-lg flex items-center"
                >
                  <span className="mr-1">🗨️</span> 카카오톡
                </button>
                {/* 다른 공유 버튼들도 추가 가능 */}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 같은 카테고리의 다른 항목들 */}
      {relatedItems.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-gray-200">같은 카테고리의 다른 항목</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {relatedItems.map((relatedItem) => (
              <Link 
                key={relatedItem.id} 
                href={`/item/${relatedItem.id}`}
                className={`p-4 rounded-lg border ${tierColors[relatedItem.tier].border} ${tierColors[relatedItem.tier].bg} hover:shadow-md transition-shadow`}
              >
                <div className="flex items-center">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center mr-2 ${tierColors[relatedItem.tier].text} font-bold text-sm border ${tierColors[relatedItem.tier].border}`}>
                    {relatedItem.tier}
                  </span>
                  <span className="font-medium truncate">{relatedItem.name}</span>
                </div>
                <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                  {relatedItem.votes} 추천
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// 타입 정의
declare global {
  interface Window {
    Kakao: {
      init: (apiKey: string) => void;
      isInitialized: () => boolean;
      Link: {
        sendDefault: (settings: {
          objectType: string;
          content: {
            title: string;
            description: string;
            imageUrl: string;
            link: {
              mobileWebUrl: string;
              webUrl: string;
            };
          };
          buttons: Array<{
            title: string;
            link: {
              mobileWebUrl: string;
              webUrl: string;
            };
          }>;
        }) => void;
      };
    };
  }
}
