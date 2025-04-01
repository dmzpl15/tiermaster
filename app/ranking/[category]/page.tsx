'use client';

import { useEffect, useState } from 'react';
import { use } from 'react';
import Link from 'next/link';
import AdBanner from '@/components/AdBanner';
import { useRouter } from 'next/navigation';

// 티어 색상 정의
const tierColors = {
  S: { light: 'bg-yellow-100 border-yellow-500', dark: 'dark:bg-yellow-900 dark:border-yellow-600', text: 'text-yellow-800 dark:text-yellow-200' },
  A: { light: 'bg-red-100 border-red-500', dark: 'dark:bg-red-900 dark:border-red-600', text: 'text-red-800 dark:text-red-200' },
  B: { light: 'bg-blue-100 border-blue-500', dark: 'dark:bg-blue-900 dark:border-blue-600', text: 'text-blue-800 dark:text-blue-200' },
  C: { light: 'bg-green-100 border-green-500', dark: 'dark:bg-green-900 dark:border-green-600', text: 'text-green-800 dark:text-green-200' },
  D: { light: 'bg-gray-100 border-gray-500', dark: 'dark:bg-gray-800 dark:border-gray-600', text: 'text-gray-800 dark:text-gray-200' }
};

type Item = {
  id: string;
  name: string;
  votes: number;
  category_id: string;
};

type Category = {
  id: string;
  name: string;
  group_id: string;
};

type TieredItems = {
  S: Item[];
  A: Item[];
  B: Item[];
  C: Item[];
  D: Item[];
};

export default function CategoryRankingPage({ params }: { params: Promise<{ category: string }> }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [category, setCategory] = useState<Category | null>(null);
  const [tieredItems, setTieredItems] = useState<TieredItems>({ S: [], A: [], B: [], C: [], D: [] });
  
  // Kakao SDK 초기화
  useEffect(() => {
    // Kakao SDK 스크립트 로드
    const script = document.createElement('script');
    script.src = 'https://developers.kakao.com/sdk/js/kakao.js';
    script.async = true;
    document.body.appendChild(script);

    script.onload = () => {
      // Kakao SDK 초기화
      if (window.Kakao && !window.Kakao.isInitialized()) {
        const apiKey = process.env.NEXT_PUBLIC_KAKAO_API_KEY || '';
        if (apiKey) {
          window.Kakao.init(apiKey);
        } else {
          console.error('Kakao API 키가 설정되지 않았습니다.');
        }
      }
    };

    return () => {
      if (script.parentNode) {
        document.body.removeChild(script);
      }
    };
  }, []);
  
  const resolvedParams = use(params);
  const categoryId = resolvedParams.category;

  useEffect(() => {
    const fetchCategoryItems = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/ranking/get-items?categoryId=${categoryId}`);
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || '데이터를 가져오는 중 오류가 발생했습니다.');
        }
        
        const data = await response.json();
        setCategory(data.category);
        setTieredItems(data.tieredItems);
        setError(null);
      } catch (err: Error | unknown) {
        console.error('데이터 로딩 오류:', err);
        setError(err instanceof Error ? err.message : '데이터를 가져오는 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };

    if (categoryId) {
      fetchCategoryItems();
    }
  }, [categoryId]);

  // 카카오톡 공유하기 함수
  const shareToKakao = (item: Item) => {
    if (!window.Kakao) {
      alert('카카오톡 SDK를 불러오는데 실패했습니다.');
      return;
    }
    
    if (!window.Kakao.isInitialized()) {
      alert('카카오톡 SDK가 초기화되지 않았습니다.');
      return;
    }
    
    const shareUrl = `${window.location.origin}/item/${item.id}`;
    
    window.Kakao.Link.sendDefault({
      objectType: 'feed',
      content: {
        title: `${item.name} - Tier Master`,
        description: `${item.name}은(는) 현재 ${category?.name || ''} 카테고리에서 ${item.votes}개의 추천을 받았습니다.`,
        imageUrl: `${window.location.origin}/images/logo.png`,
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
            mobileWebUrl: `${window.location.origin}/vote`,
            webUrl: `${window.location.origin}/vote`
          }
        }
      ]
    });
  };
  
  // 항목 상세 페이지로 이동
  const goToItemDetail = (itemId: string) => {
    router.push(`/item/${itemId}`);
  };

  // 티어 렌더링 함수
  const renderTier = (tier: 'S' | 'A' | 'B' | 'C' | 'D', items: Item[]) => {
    if (items.length === 0) return null;
    
    return (
      <div className="mb-8">
        <div className={`flex items-center mb-2 ${tierColors[tier].text} font-bold`}>
          <div className={`w-12 h-12 rounded-full flex items-center justify-center mr-3 border-2 ${tierColors[tier].light} ${tierColors[tier].dark} ${tierColors[tier].text}`}>
            {tier}
          </div>
          <h2 className="text-xl font-bold">{tier} 티어</h2>
        </div>
        
        <div className={`p-4 rounded-lg border-2 ${tierColors[tier].light} ${tierColors[tier].dark}`}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {items.map((item) => (
              <div key={item.id} className="bg-white dark:bg-gray-700 p-3 rounded-md shadow-sm">
                <div className="flex justify-between items-center mb-2">
                  <span 
                    className="font-medium text-gray-800 dark:text-gray-200 cursor-pointer hover:text-blue-600 dark:hover:text-blue-400"
                    onClick={() => goToItemDetail(item.id)}
                  >
                    {item.name}
                  </span>
                  <span className="text-sm bg-gray-100 dark:bg-gray-600 px-2 py-1 rounded text-gray-700 dark:text-gray-300">
                    {item.votes} 추천
                  </span>
                </div>
                <div className="flex justify-end">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      shareToKakao(item);
                    }}
                    className="text-xs px-2 py-1 bg-yellow-400 hover:bg-yellow-500 text-black rounded flex items-center"
                  >
                    <span className="mr-1">🗨️</span> 공유
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6 text-center">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-64 mb-4"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full max-w-md mb-8"></div>
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-gray-200 dark:bg-gray-700 rounded w-full mb-4"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 p-4 rounded-lg">
          <h2 className="text-lg font-bold mb-2">오류가 발생했습니다</h2>
          <p>{error}</p>
          <Link href="/vote" className="mt-4 inline-block text-blue-600 dark:text-blue-400 hover:underline">
            투표 페이지로 돌아가기
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <Link href="/vote" className="text-blue-600 dark:text-blue-400 hover:underline mb-4 inline-block">
          ← 투표 페이지로 돌아가기
        </Link>
        <h1 className="text-3xl font-bold mb-2 text-gray-800 dark:text-white">
          {category?.name || '카테고리'} 티어 랭킹
        </h1>
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          추천수에 따라 자동으로 분류된 티어 목록입니다. 더 많은 항목을 추천하고 싶다면 투표 페이지를 이용해주세요.
        </p>
      </div>

      {/* 티어 섹션 */}
      {renderTier('S', tieredItems.S)}
      {renderTier('A', tieredItems.A)}
      
      {/* A티어와 B티어 사이에 광고 배너 */}
      <AdBanner type="horizontal" className="my-6" />
      
      {renderTier('B', tieredItems.B)}
      {renderTier('C', tieredItems.C)}
      {renderTier('D', tieredItems.D)}
      
      {/* 하단에 광고 배너 */}
      <div className="mt-8">
        <AdBanner type="square" className="mx-auto" />
      </div>

      {/* 항목이 없는 경우 */}
      {Object.values(tieredItems).every(items => items.length === 0) && (
        <div className="bg-gray-100 dark:bg-gray-800 p-6 rounded-lg text-center">
          <p className="text-gray-700 dark:text-gray-300 mb-4">
            이 카테고리에는 아직 항목이 없습니다.
          </p>
          <Link href="/vote" className="inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition">
            투표 페이지로 이동하기
          </Link>
        </div>
      )}
    </div>
  );
}
