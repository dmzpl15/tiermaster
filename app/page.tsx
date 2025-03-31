'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import AdBanner from '@/components/AdBanner';

// 티어 색상 정의
const tierColors = {
  S: { bg: 'bg-yellow-100 dark:bg-yellow-800', text: 'text-yellow-800 dark:text-yellow-100', border: 'border-yellow-300 dark:border-yellow-600' },
  A: { bg: 'bg-red-100 dark:bg-red-800', text: 'text-red-800 dark:text-red-100', border: 'border-red-300 dark:border-red-600' },
  B: { bg: 'bg-blue-100 dark:bg-blue-800', text: 'text-blue-800 dark:text-blue-100', border: 'border-blue-300 dark:border-blue-600' },
  C: { bg: 'bg-green-100 dark:bg-green-800', text: 'text-green-800 dark:text-green-100', border: 'border-green-300 dark:border-green-600' },
  D: { bg: 'bg-gray-100 dark:bg-gray-700', text: 'text-gray-800 dark:text-gray-100', border: 'border-gray-300 dark:border-gray-600' }
};

// 서비스 특징 데이터
const features = [
  {
    icon: '🗳️',
    title: '간편한 추천',
    description: '좋아하는 항목에 쉽게 투표하고 실시간으로 반영되는 결과를 확인하세요.'
  },
  {
    icon: '🏆',
    title: '티어 랭킹',
    description: '투표 결과에 따라 S, A, B, C, D 티어로 자동 분류된 랭킹을 확인하세요.'
  },
  {
    icon: '➕',
    title: '항목 제안',
    description: '원하는 항목이 없나요? 직접 새로운 항목을 제안하고 다른 사람들의 의견을 들어보세요.'
  },
  {
    icon: '🌐',
    title: '다양한 카테고리',
    description: '음식, 영화, 게임 등 다양한 분야의 티어 랭킹을 한 곳에서 확인하세요.'
  }
];

// 항목 타입 정의
type Item = {
  id: string;
  name: string;
  votes: number;
  category_id: string;
};

type TieredItems = {
  S: Item[];
  A: Item[];
  B: Item[];
  C: Item[];
  D: Item[];
};

type CategoryData = {
  id: string;
  name: string;
  group_id: string;
  groups: {
    name: string;
  };
};

type PopularTier = {
  category: CategoryData;
  items: Item[];
  tieredItems: TieredItems;
};

export default function HomePage() {
  const [loading, setLoading] = useState(true);
  const [popularTiers, setPopularTiers] = useState<PopularTier[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPopularTiers = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/home/get-popular-tiers');
        
        if (!response.ok) {
          throw new Error('인기 티어 데이터를 가져오는데 실패했습니다.');
        }
        
        const data = await response.json();
        setPopularTiers(data.popularTiers || []);
        setError(null);
      } catch (err: Error | unknown) {
        console.error('데이터 로딩 오류:', err);
        setError(err instanceof Error ? err.message : '데이터를 가져오는 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchPopularTiers();
  }, []);

  // 티어 미리보기 렌더링 함수
  const renderTierPreview = (tier: PopularTier) => {
    // 가장 인기 있는 티어만 표시 (S 또는 A 티어)
    const topTier = tier.tieredItems.S.length > 0 ? 'S' : 
                   tier.tieredItems.A.length > 0 ? 'A' : 
                   tier.tieredItems.B.length > 0 ? 'B' : 'C';
    
    const items = tier.tieredItems[topTier as keyof TieredItems].slice(0, 3); // 최대 3개만 표시
    
    if (items.length === 0) return null;
    
    return (
      <div key={tier.category.id} className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center">
            <span className={`w-8 h-8 rounded-full flex items-center justify-center mr-2 ${tierColors[topTier as keyof typeof tierColors].bg} ${tierColors[topTier as keyof typeof tierColors].text} font-bold border-2 ${tierColors[topTier as keyof typeof tierColors].border}`}>
              {topTier}
            </span>
            <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200">
              {tier.category.groups.name} - {tier.category.name}
            </h3>
          </div>
          <Link 
            href={`/ranking/${tier.category.id}`}
            className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
          >
            전체 보기 →
          </Link>
        </div>
        
        <div className={`p-4 rounded-lg border ${tierColors[topTier as keyof typeof tierColors].border} ${tierColors[topTier as keyof typeof tierColors].bg}`}>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {items.map((item) => (
              <div key={item.id} className="bg-white dark:bg-gray-700 p-3 rounded-md shadow-sm flex justify-between items-center">
                <span className="font-medium text-gray-800 dark:text-gray-100 truncate">{item.name}</span>
                <span className="text-xs bg-gray-100 dark:bg-gray-600 px-2 py-1 rounded text-gray-700 dark:text-gray-200 whitespace-nowrap">
                  {item.votes} 추천
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* 히어로 섹션 */}
      <div className="text-center mb-16 py-10 px-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-900 rounded-xl shadow-sm border border-blue-100 dark:border-gray-700">
        <h1 className="text-4xl font-bold mb-4">
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-300 dark:to-indigo-300">🏆 Tier Master</span>
        </h1>
        <p className="text-xl mb-6 text-gray-700 dark:text-gray-200 max-w-2xl mx-auto">
          사람들이 좋아하는 것을 추천하고, 인기순으로 티어를 만드는 투표 기반 랭킹 서비스
        </p>
        <Link
          href="/vote"
          className="inline-block bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium px-6 py-3 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 transform hover:-translate-y-1"
        >
          🔥 추천하러 가기
        </Link>
      </div>

      {/* 서비스 특징 */}
      <div className="mb-16">
        <h2 className="text-2xl font-bold mb-8 text-center text-gray-800 dark:text-gray-100">
          Tier Master의 특징
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {features.map((feature, index) => (
            <div key={index} className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow duration-200">
              <div className="text-3xl mb-3">{feature.icon}</div>
              <h3 className="text-lg font-semibold mb-2 text-gray-800 dark:text-gray-100">{feature.title}</h3>
              <p className="text-gray-600 dark:text-gray-300">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 인기 티어 미리보기 */}
      <div className="mb-10">
        <h2 className="text-2xl font-bold mb-6 text-center text-gray-800 dark:text-gray-100">
          인기 티어 미리보기
        </h2>
        
        {loading ? (
          <div className="animate-pulse space-y-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-gray-100 dark:bg-gray-800 h-40 rounded-lg"></div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <p>{error}</p>
            <p className="mt-2">대신 직접 투표에 참여해보세요!</p>
          </div>
        ) : popularTiers.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <p>아직 인기 티어가 없습니다.</p>
            <p className="mt-2">첫 번째로 투표에 참여해보세요!</p>
          </div>
        ) : (
          <div className="space-y-6">
            {popularTiers.map(renderTierPreview)}
          </div>
        )}
        
        <div className="text-center mt-8">
          <Link 
            href="/vote" 
            className="inline-block text-blue-600 dark:text-blue-400 hover:underline font-medium"
          >
            모든 카테고리 보러가기 →
          </Link>
        </div>
      </div>
      
      {/* 광고 배너 */}
      <AdBanner type="horizontal" className="my-10" />
      
      {/* 참여 유도 섹션 */}
      <div className="text-center p-8 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-gray-100">지금 바로 참여하세요!</h2>
        <p className="mb-6 text-gray-600 dark:text-gray-300">여러분의 의견이 티어를 만듭니다. 로그인하고 좋아하는 항목에 투표하세요.</p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link 
            href="/vote"
            className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            👍 추천하기
          </Link>
          <Link 
            href="/submit"
            className="px-6 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-100 rounded hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
          >
            ✏️ 항목 제안하기
          </Link>
        </div>
      </div>
    </div>
  );
}
