'use client';

import { useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import Link from 'next/link';
import { useSession } from 'next-auth/react';

interface Group {
    id: string;
    name: string;
}

interface Category {
    id: string;
    name: string;
    group_id: string;
}

interface Item {
    id: string;
    name: string;
    category_id: string;
    votes: number;
}

export default function VotePage() {
    const supabase = createClientComponentClient();
    const { data: session } = useSession();

    const [groups, setGroups] = useState<Group[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [items, setItems] = useState<Item[]>([]);
    const [votedItemIds, setVotedItemIds] = useState<string[]>([]);
    const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
    const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
    
    // 모바일에서 사이드바 토글 상태 관리
    const [showSidebar, setShowSidebar] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            // 기본 데이터 가져오기
            const { data: groupData } = await supabase.from('groups').select('*');
            const { data: categoryData } = await supabase.from('categories').select('*');
            const { data: itemData } = await supabase.from('items').select('*');

            setGroups(groupData ?? []);
            setCategories(categoryData ?? []);
            setItems(itemData ?? []);

            if (groupData?.length) setSelectedGroupId(groupData[0].id);
        };
        loadData();
    }, [supabase]);

    // 세션이 변경될 때마다 투표 데이터 가져오기
    useEffect(() => {
        const loadVoteData = async () => {
            let votedIds: string[] = [];
            
            // NextAuth 세션에서 사용자 이메일 가져오기
            const userEmail = session?.user?.email;
            console.log('세션 사용자 이메일:', userEmail);
            
            if (userEmail) {
                // 먼저 users 테이블에서 UUID 가져오기
                const { data: userData, error: userError } = await supabase
                    .from('users')
                    .select('id')
                    .eq('email', userEmail)
                    .maybeSingle();
                
                console.log('사용자 데이터:', userData, '오류:', userError);
                
                if (userData) {
                    const { data: voteData, error: voteError } = await supabase
                        .from('votes')
                        .select('item_id')
                        .eq('user_id', userData.id);
                    
                    if (voteError) {
                        console.error('투표 데이터 로드 오류:', voteError);
                    } else {
                        console.log('로드된 투표 데이터:', voteData);
                        votedIds = (voteData ?? []).map((v: { item_id: string }) => v.item_id);
                    }
                } else {
                    console.error('사용자 데이터 로드 오류:', userError);
                }
            } else {
                console.log('로그인된 사용자 없음');
            }

            setVotedItemIds(votedIds);
        };

        // 세션이 있을 때만 투표 데이터 가져오기
        if (session) {
            loadVoteData();
        }
    }, [session, supabase]); // 세션이 변경될 때마다 실행

    const filteredCategories = categories.filter((c) => c.group_id === selectedGroupId);
    const selectedCategory = selectedCategoryId ? categories.find(c => c.id === selectedCategoryId) : null;
    const filteredItems = selectedCategoryId
        ? items.filter((i) => i.category_id === selectedCategoryId)
        : [];

    /**
     * 투표 처리 중 연속 클릭 방지를 위한 디바운싱 상태
     * true일 때는 클릭을 무시하여 중복 요청 방지
     */
    const [isVoting, setIsVoting] = useState(false);
    
    /**
     * 현재 처리 중인 항목의 ID를 추적하여 시각적 피드백 제공
     */
    const [loadingItemId, setLoadingItemId] = useState<string | null>(null);
    
    /**
     * 투표 결과 피드백을 위한 토스트 메시지 상태
     */
    const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
    
    /**
     * 토스트 메시지 표시 후 자동으로 숨기는 함수
     */
    const showToast = (message: string, type: 'success' | 'error' = 'success') => {
        setToast({ show: true, message, type });
        setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
    };

    /**
     * 투표 처리 함수 - 항목 클릭시 호출되는 핵심 함수
     * 
     * 이 함수는 다음과 같은 세 가지 시나리오를 처리합니다:
     * 1. 이미 현재 항목에 투표한 경우 -> 투표 취소
     * 2. 같은 카테고리의 다른 항목에 투표한 경우 -> 기존 투표 취소 후 현재 항목에 투표
     * 3. 아무데도 투표하지 않은 경우 -> 현재 항목에 투표
     * 
     * @param item - 투표할 항목 객체
     */
    const handleVote = async (item: Item) => {
        // IMPORTANT: 이미 요청 처리 중이면 추가 클릭 무시 (디바운싱)
        if (isVoting) return;
        
        // 투표 처리 중 상태로 설정
        setIsVoting(true);
        setLoadingItemId(item.id); // 현재 처리 중인 항목 표시
        
        try {
            // IMPORTANT: 현재 항목에 이미 투표했는지 확인
            // 이미 투표한 경우 투표 취소를 위해 필요
            const isCurrentItemVoted = votedItemIds.includes(item.id);
            
            // IMPORTANT: 같은 카테고리에서 다른 항목에 투표했는지 확인
            // 카테고리당 하나의 투표만 가능하므로, 다른 항목 투표를 취소해야 함
            const otherVotedItem = items.find(
                (i) => i.category_id === item.category_id && 
                       votedItemIds.includes(i.id) && 
                       i.id !== item.id
            );

            // IMPORTANT: 시나리오 1 - 이미 현재 항목에 투표한 경우 -> 투표 취소
            if (isCurrentItemVoted) {
                // DELETE 요청을 보내 투표 취소
                const res = await fetch('/api/vote', {
                    method: 'DELETE',
                    body: JSON.stringify({ itemId: Number(item.id) }),
                });
                
                if (res.ok) {
                    // IMPORTANT: 클라이언트 상태 업데이트 (낙관적 UI 업데이트)
                    // 1. 해당 항목의 투표수 감소
                    setItems((prev) =>
                        prev.map((i) =>
                            i.id === item.id ? { ...i, votes: i.votes - 1 } : i
                        )
                    );
                    // 2. 투표한 항목 목록에서 제거
                    setVotedItemIds((prev) => prev.filter((id) => id !== item.id));
                    
                    // 사용자에게 투표 취소 피드백 제공
                    showToast(`${item.name} 항목의 투표를 취소했습니다.`, 'success');
                } else {
                    // 오류 발생 시 사용자에게 알림
                    showToast('투표 취소 중 오류가 발생했습니다.', 'error');
                }
                
                // IMPORTANT: 투표 취소 후 함수 종료 - 추가 요청 없음
                setIsVoting(false);
                setLoadingItemId(null);
                return;
            }
            
            // IMPORTANT: 시나리오 2 - 같은 카테고리의 다른 항목에 투표한 경우
            // -> 기존 투표 취소 후 현재 항목에 투표
            if (otherVotedItem) {
                // 기존 투표 취소를 위한 DELETE 요청
                const res = await fetch('/api/vote', {
                    method: 'DELETE',
                    body: JSON.stringify({ itemId: Number(otherVotedItem.id) }),
                });
                
                if (res.ok) {
                    // IMPORTANT: 클라이언트 상태 업데이트 (낙관적 UI 업데이트)
                    // 1. 기존 항목의 투표수 감소
                    setItems((prev) =>
                        prev.map((i) =>
                            i.id === otherVotedItem.id ? { ...i, votes: i.votes - 1 } : i
                        )
                    );
                    // 2. 투표한 항목 목록에서 기존 항목 제거
                    setVotedItemIds((prev) => prev.filter((id) => id !== otherVotedItem.id));
                    
                    // 사용자에게 기존 투표 취소 피드백 제공 (조용히 표시)
                    console.log(`${otherVotedItem.name} 항목의 기존 투표가 취소되었습니다.`);
                } else {
                    // 오류 발생 시 사용자에게 알림
                    showToast('기존 투표 취소 중 오류가 발생했습니다.', 'error');
                    setIsVoting(false);
                    setLoadingItemId(null);
                    return; // 오류 발생 시 현재 항목 투표 시도 중단
                }
            }

            // IMPORTANT: 시나리오 3 - 현재 항목에 투표 (모든 경우 실행)
            // 새로운 투표를 위한 POST 요청
            const res = await fetch('/api/vote', {
                method: 'POST',
                body: JSON.stringify({ itemId: Number(item.id) }),
            });

            const result = await res.json();

            if (res.ok) {
                // IMPORTANT: 클라이언트 상태 업데이트 (낙관적 UI 업데이트)
                // 1. 현재 항목의 투표수 증가
                setItems((prev) =>
                    prev.map((i) =>
                        i.id === item.id ? { ...i, votes: i.votes + 1 } : i
                    )
                );
                // 2. 투표한 항목 목록에 현재 항목 추가
                setVotedItemIds((prev) => [...prev, item.id]);
                
                // 사용자에게 투표 성공 피드백 제공
                showToast(`${item.name} 항목에 투표했습니다!`, 'success');
            } else {
                // 오류 발생 시 사용자에게 알림
                showToast(result.error || '투표 실패: 다시 시도해주세요.', 'error');
            }
        } catch (error) {
            // IMPORTANT: 예외 처리 - 네트워크 오류 등 처리
            console.error('투표 처리 오류:', error);
            showToast('네트워크 오류: 인터넷 연결을 확인해주세요.', 'error');
        } finally {
            // IMPORTANT: 디바운싱 해제를 위한 타이머
            // 약간의 지연을 주어 연속 클릭 방지 (300ms 쿨다운)
            setTimeout(() => {
                setIsVoting(false);
                setLoadingItemId(null); // 로딩 상태 해제
            }, 300);
        }
    };
    
    // 화면 크기 변경 감지 - 클라이언트 사이드에서만 실행
    useEffect(() => {
        // 서버 사이드 렌더링 중에는 window 객체가 없음
        if (typeof window === 'undefined') return;
        
        const handleResize = () => {
            // PC 화면에서는 항상 사이드바 표시
            if (window.innerWidth >= 768) {
                setShowSidebar(true);
            } else {
                // 모바일에서는 초기에 사이드바 숨김
                setShowSidebar(false);
            }
        };
        
        // 초기 실행
        handleResize();
        
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);
    
    // 토스트 메시지 컴포넌트
    const Toast = () => {
        if (!toast.show) return null;
        
        return (
            <div className={`fixed bottom-4 right-4 p-4 rounded-md shadow-lg transition-opacity duration-300 ${toast.type === 'success' ? 'bg-green-500' : 'bg-red-500'} text-white z-50`}>
                {toast.message}
            </div>
        );
    };
    
    return (
        <div className="min-h-screen bg-background text-foreground flex flex-col">
            {/* 토스트 메시지 표시 */}
            <Toast />
            
            {/* 모바일에서 사이드바 뒤의 오버레이 */}
            {showSidebar && (
                <div 
                    className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden"
                    onClick={() => setShowSidebar(false)}
                />
            )}
            
            {/* 모바일 헤더 - 사이드바 토글 버튼 */}
            <div className="md:hidden flex items-center justify-between p-4 border-b">
                <h1 className="text-lg font-bold">티어마스터</h1>
                <button 
                    onClick={() => setShowSidebar(!showSidebar)}
                    className="p-2 rounded-md bg-blue-500 text-white hover:bg-blue-600 active:bg-blue-700 transition-colors"
                    aria-label="메뉴 토글"
                >
                    {showSidebar ? '✖' : '☰'}
                </button>
            </div>
            
            <div className="flex flex-col md:flex-row flex-1">
                {/* 사이드바 - 모바일에서는 토글 가능 */}
                <aside className={`
                    ${showSidebar ? 'block' : 'hidden'} 
                    md:block 
                    w-full md:w-48 p-4 
                    border-b md:border-b-0 md:border-r 
                    bg-gray-50 dark:bg-gray-900
                    fixed md:static top-[57px] left-0 right-0 bottom-0 md:top-0
                    z-30 md:z-auto
                    overflow-y-auto
                    h-[calc(100vh-57px)] md:h-auto
                `}>
                    <h2 className="font-bold mb-2">그룹</h2>
                    <ul className="space-y-1">
                        {groups.map((group) => (
                            <li key={group.id}>
                                <button
                                    onClick={() => {
                                        setSelectedGroupId(group.id);
                                        setSelectedCategoryId(null);
                                        // 모바일에서는 선택 후 사이드바 닫기
                                        // 클라이언트 사이드에서만 실행
                                        if (typeof window !== 'undefined' && window.innerWidth < 768) {
                                            setShowSidebar(false);
                                        }
                                    }}
                                    className={`w-full text-left py-2 px-1 rounded ${selectedGroupId === group.id ? 'font-bold bg-gray-200 dark:bg-gray-800' : ''}`}
                                >
                                    {group.name}
                                </button>
                            </li>
                        ))}
                    </ul>
                </aside>

                <main className="flex-1 p-4">
                    <div className="flex flex-wrap gap-2 mb-4">
                        {filteredCategories.map((cat) => (
                            <button
                                key={cat.id}
                                onClick={() => setSelectedCategoryId(cat.id)}
                                className={`px-3 py-1 border rounded ${selectedCategoryId === cat.id ? 'bg-blue-600 text-white' : ''} active:bg-blue-100 md:active:bg-transparent`}
                            >
                                {cat.name}
                            </button>
                        ))}
                    </div>

                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-lg font-semibold">{selectedCategory?.name || '카테고리를 선택하세요'}</h2>
                        {selectedCategoryId && (
                            <Link 
                                href={`/ranking/${selectedCategoryId}`}
                                className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white text-sm rounded-md flex items-center"
                            >
                                <span>📊 티어 보기</span>
                            </Link>
                        )}
                    </div>

                    <div className="w-full max-w-3xl">
                        {filteredItems.length > 0 ? filteredItems.map((item) => (
                            <div
                                key={item.id}
                                className="flex justify-between items-center border px-3 py-2 mb-2 rounded shadow-sm"
                            >
                                <span className="truncate mr-2 flex-1">{item.name}</span>
                                <div className="flex items-center gap-2 flex-shrink-0">
                                    <span className="text-gray-500 text-sm">{item.votes} 추천</span>
                                    <button
                                        onClick={() => handleVote(item)}
                                        disabled={isVoting}
                                        className={`px-2 py-1 rounded text-sm transition-all ${loadingItemId === item.id 
                                            ? 'bg-gray-400 animate-pulse text-white' 
                                            : votedItemIds.includes(item.id)
                                                ? 'bg-green-500 hover:bg-red-500 text-white'
                                                : 'bg-blue-600 text-white hover:bg-blue-700'
                                            } ${isVoting ? 'cursor-not-allowed opacity-80' : ''} active:scale-95 md:active:scale-100`}
                                    >
                                        {loadingItemId === item.id 
                                            ? '처리중...' 
                                            : votedItemIds.includes(item.id) 
                                                ? '✅ 완료' 
                                                : '👍 추천'}
                                    </button>
                                </div>
                            </div>
                        )) : (
                            selectedCategoryId ? (
                                <div className="text-center py-8 text-gray-500">
                                    해당 카테고리에 항목이 없습니다.
                                </div>
                            ) : (
                                <div className="text-center py-8 text-gray-500">
                                    카테고리를 선택해주세요.
                                </div>
                            )
                        )}
                    </div>

                    {/* 내가 추천한 항목 */}
                    <div className="mt-8 border-t pt-6">
                        <h3 className="font-semibold mb-2">🧡 내가 추천한 항목</h3>
                        {items.filter((i) => votedItemIds.includes(i.id)).length > 0 ? (
                            <ul className="list-disc ml-4 text-sm text-foreground">
                                {items.filter((i) => votedItemIds.includes(i.id)).map((i) => {
                                    // 해당 항목의 카테고리 찾기
                                    const category = categories.find(c => c.id === i.category_id);
                                    return (
                                        <li key={i.id} className="mb-2">
                                            <div className="flex items-center">
                                                <span className="font-medium">{i.name}</span>
                                                {category && (
                                                    <span className="ml-2 text-xs px-2 py-0.5 bg-gray-200 dark:bg-gray-700 rounded">
                                                        {category.name}
                                                    </span>
                                                )}
                                                {category && (
                                                    <Link 
                                                        href={`/ranking/${category.id}`}
                                                        className="ml-2 text-xs text-blue-600 dark:text-blue-400 hover:underline"
                                                    >
                                                        티어 보기
                                                    </Link>
                                                )}
                                            </div>
                                            <div className="md:hidden flex gap-2 mt-1">
                                                <button 
                                                    onClick={() => handleVote(i)}
                                                    disabled={isVoting}
                                                    className="text-xs text-red-500 px-2 py-1 border border-red-200 rounded active:bg-red-50"
                                                >
                                                    추천 취소
                                                </button>
                                            </div>
                                        </li>
                                    );
                                })}
                            </ul>
                        ) : (
                            <div className="text-center py-4 text-gray-500 text-sm">
                                아직 추천한 항목이 없습니다.
                            </div>
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
}