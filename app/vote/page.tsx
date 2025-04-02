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


/*
✅ 1. 페이지 로딩 시 필요한 데이터 불러오기
useEffect 안에서 groups, categories, items, votes를 함께 불러옴

✅ 2. 추천 클릭 시
동일 카테고리에서 기존에 추천한 항목이 있다면 먼저 추천 취소
새로운 항목에 추천 insert 요청 (/api/vote)
성공 시: items.votes 반영, votedItemIds에 추가


✅ 3. 새로고침 시 동기화됨
DB의 최신 상태를 다시 읽어옴


✅ 추가 UX 기능
버튼 상태: 이미 추천했다면 ✅ 추천 완료 + 회색
중복 추천 시 자동 취소 후 추천
추천 취소도 가능 (같은 항목 클릭 시 toggle 가능)
아래에 내가 추천한 항목 목록 표시

*/
export default function VotePage() {
    const supabase = createClientComponentClient();
    const { data: session } = useSession();

    const [groups, setGroups] = useState<Group[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [items, setItems] = useState<Item[]>([]);
    const [votedItemIds, setVotedItemIds] = useState<string[]>([]);
    const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
    const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);

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
                    body: JSON.stringify({ itemId: item.id }),
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
                return;
            }
            
            // IMPORTANT: 시나리오 2 - 같은 카테고리의 다른 항목에 투표한 경우
            // -> 기존 투표 취소 후 현재 항목에 투표
            if (otherVotedItem) {
                // 기존 투표 취소를 위한 DELETE 요청
                const res = await fetch('/api/vote', {
                    method: 'DELETE',
                    body: JSON.stringify({ itemId: otherVotedItem.id }),
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
                    return; // 오류 발생 시 현재 항목 투표 시도 중단
                }
            }

            // IMPORTANT: 시나리오 3 - 현재 항목에 투표 (모든 경우 실행)
            // 새로운 투표를 위한 POST 요청
            const res = await fetch('/api/vote', {
                method: 'POST',
                body: JSON.stringify({ itemId: item.id }),
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

    // 토스트 메시지 컴포넌트
    const Toast = () => {
        if (!toast.show) return null;
        
        return (
            <div className={`fixed bottom-4 right-4 p-4 rounded-md shadow-lg transition-opacity duration-300 ${toast.type === 'success' ? 'bg-green-500' : 'bg-red-500'} text-white`}>
                {toast.message}
            </div>
        );
    };
    
    return (
        <div className="flex min-h-screen bg-background text-foreground relative">
            {/* 토스트 메시지 표시 */}
            <Toast />
            
            <aside className="w-48 p-4 border-r bg-gray-50 dark:bg-gray-900">
                <h2 className="font-bold mb-2">그룹</h2>
                <ul className="space-y-1">
                    {groups.map((group) => (
                        <li key={group.id}>
                            <button
                                onClick={() => {
                                    setSelectedGroupId(group.id);
                                    setSelectedCategoryId(null);
                                }}
                                className={`w-full text-left ${selectedGroupId === group.id ? 'font-bold' : ''}`}
                            >
                                {group.name}
                            </button>
                        </li>
                    ))}
                </ul>
            </aside>

            <main className="flex-1 p-6">
                <div className="flex flex-wrap gap-2 mb-4">
                    {filteredCategories.map((cat) => (
                        <button
                            key={cat.id}
                            onClick={() => setSelectedCategoryId(cat.id)}
                            className={`px-3 py-1 border rounded ${selectedCategoryId === cat.id ? 'bg-blue-600 text-white' : ''}`}
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


                {/* max-w-md: 최대 너비 768px 정도 mx-auto: 수평 중앙 정렬 */}
                <div className="w-full max-w-md ">
                    {filteredItems.map((item) => (
                        <div
                            key={item.id}
                            className="flex justify-between items-center border px-3 py-1 mb-1 rounded text-sm"
                        >
                            <span className="truncate">{item.name}</span>
                            <div className="flex items-center gap-2">
                                <span className="text-gray-500">{item.votes} 추천</span>
                                <button
                                    onClick={() => handleVote(item)}
                                    disabled={isVoting}
                                    className={`px-2 py-1 rounded text-xs transition-all ${loadingItemId === item.id 
                                        ? 'bg-gray-400 animate-pulse text-white' 
                                        : votedItemIds.includes(item.id)
                                            ? 'bg-green-500 hover:bg-red-500 text-white'
                                            : 'bg-blue-600 text-white hover:bg-blue-700'
                                        } ${isVoting ? 'cursor-not-allowed opacity-80' : ''}`}
                                >
                                    {loadingItemId === item.id 
                                        ? '⏳ 처리중...' 
                                        : votedItemIds.includes(item.id) 
                                            ? '✅ 완료' 
                                            : '👍 추천'}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>



                {/* 내가 추천한 항목 */}
                <div className="mt-8 border-t pt-6">
                    <h3 className="font-semibold mb-2">🧡 내가 추천한 항목</h3>
                    <ul className="list-disc ml-4 text-sm text-foreground">
                        {items.filter((i) => votedItemIds.includes(i.id)).map((i) => {
                            // 해당 항목의 카테고리 찾기
                            const category = categories.find(c => c.id === i.category_id);
                            return (
                                <li key={i.id} className="mb-1">
                                    <span className="font-medium">{i.name}</span>
                                    {category && (
                                        <>
                                            <span className="ml-2 text-xs px-2 py-0.5 bg-gray-200 dark:bg-gray-700 rounded">
                                                {category.name}
                                            </span>
                                            <Link 
                                                href={`/ranking/${category.id}`}
                                                className="ml-2 text-xs text-blue-600 dark:text-blue-400 hover:underline"
                                            >
                                                티어 보기
                                            </Link>
                                        </>
                                    )}
                                </li>
                            );
                        })}
                    </ul>
                </div>
            </main>
        </div>
    );
}
