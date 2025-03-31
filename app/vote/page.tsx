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

interface Vote {
    id?: string;
    user_id: string;
    item_id: string;
    category_id: string; // ✅ 추가
    created_at?: string;
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
    }, []);

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
    }, [session]); // 세션이 변경될 때마다 실행

    const filteredCategories = categories.filter((c) => c.group_id === selectedGroupId);
    const selectedCategory = selectedCategoryId ? categories.find(c => c.id === selectedCategoryId) : null;
    const filteredItems = selectedCategoryId
        ? items.filter((i) => i.category_id === selectedCategoryId)
        : [];

    const handleVote = async (item: Item) => {
        const alreadyVotedInCategory = items.find(
            (i) =>
                i.category_id === item.category_id &&
                votedItemIds.includes(i.id)
        );

        if (alreadyVotedInCategory) {
            // 이미 이 카테고리에서 추천한 항목 → 추천 취소
            const res = await fetch('/api/vote', {
                method: 'DELETE',
                body: JSON.stringify({ itemId: alreadyVotedInCategory.id }),
            });
            if (res.ok) {
                setItems((prev) =>
                    prev.map((i) =>
                        i.id === alreadyVotedInCategory.id
                            ? { ...i, votes: i.votes - 1 }
                            : i
                    )
                );
                setVotedItemIds((prev) => prev.filter((id) => id !== alreadyVotedInCategory.id));
            }
        }

        // 새로운 항목 추천
        const res = await fetch('/api/vote', {
            method: 'POST',
            body: JSON.stringify({ itemId: item.id }),
        });

        const result = await res.json();

        if (res.ok) {
            setItems((prev) =>
                prev.map((i) =>
                    i.id === item.id ? { ...i, votes: i.votes + 1 } : i
                )
            );
            setVotedItemIds((prev) => [...prev, item.id]);
        } else {
            alert(result.error || '추천 실패');
        }
    };

    return (
        <div className="flex min-h-screen bg-background text-foreground">
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
                                    className={`px-2 py-1 rounded text-xs ${votedItemIds.includes(item.id)
                                        ? 'bg-gray-400 text-white'
                                        : 'bg-blue-600 text-white hover:bg-blue-700'
                                        }`}
                                >
                                    {votedItemIds.includes(item.id) ? '✅ 완료' : '👍 추천'}
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
