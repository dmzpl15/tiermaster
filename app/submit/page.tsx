'use client';

import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

type Category = {
    id: number;
    name: string;
    group_id: number;
};

type Group = {
    id: number;
    name: string;
};

export default function SubmitPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
    const [groups, setGroups] = useState<Group[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);
    const [filteredCategories, setFilteredCategories] = useState<Category[]>([]);
    
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [message, setMessage] = useState({ text: '', type: '' });
    const [remainingSubmissions, setRemainingSubmissions] = useState<number | null>(null);
    
    // 카테고리 데이터 로드
    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const response = await fetch('/api/admin/get-categories');
                const data = await response.json();
                
                if (data.success) {
                    setGroups(data.groups);
                    setCategories(data.categories);
                }
            } catch (error) {
                console.error('카테고리 데이터 로드 실패:', error);
                setMessage({ 
                    text: '카테고리 정보를 불러오는 데 실패했습니다. 잠시 후 다시 시도해 주세요.', 
                    type: 'error' 
                });
            }
        };
        
        fetchCategories();
    }, []);
    
    // 그룹 선택 시 카테고리 필터링
    useEffect(() => {
        if (selectedGroupId) {
            const filtered = categories.filter(category => category.group_id === selectedGroupId);
            setFilteredCategories(filtered);
            // 그룹이 변경되면 선택된 카테고리 초기화
            setSelectedCategoryId(null);
        } else {
            setFilteredCategories([]);
        }
    }, [selectedGroupId, categories]);
    
    // 남은 제안 횟수 조회
    useEffect(() => {
        if (session && session.user) {
            const fetchRemainingSubmissions = async () => {
                try {
                    const response = await fetch('/api/submit/remaining');
                    const data = await response.json();
                    
                    if (data.success) {
                        setRemainingSubmissions(data.remaining);
                    }
                } catch (error) {
                    console.error('남은 제안 횟수 조회 실패:', error);
                }
            };
            
            fetchRemainingSubmissions();
        }
    }, [session]);
    
    // 로그인 상태 확인
    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/api/auth/signin?callbackUrl=/submit');
        }
    }, [status, router]);
    
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        // 입력값 검증
        if (!name.trim()) {
            setMessage({ text: '항목 이름을 입력해 주세요.', type: 'error' });
            return;
        }
        
        if (!selectedCategoryId) {
            setMessage({ text: '카테고리를 선택해 주세요.', type: 'error' });
            return;
        }
        
        setIsSubmitting(true);
        setMessage({ text: '', type: '' });
        
        try {
            const response = await fetch('/api/submit', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name,
                    categoryId: selectedCategoryId,
                    description: description.trim() || null,
                }),
            });
            
            const data = await response.json();
            
            if (data.success) {
                setMessage({ text: data.message, type: 'success' });
                // 폼 초기화
                setName('');
                setDescription('');
                setSelectedGroupId(null);
                setSelectedCategoryId(null);
                
                // 남은 제안 횟수 업데이트
                if (remainingSubmissions !== null) {
                    setRemainingSubmissions(remainingSubmissions - 1);
                }
            } else {
                setMessage({ text: data.message, type: 'error' });
            }
        } catch (error) {
            console.error('항목 제안 요청 실패:', error);
            setMessage({ 
                text: '서버 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.', 
                type: 'error' 
            });
        } finally {
            setIsSubmitting(false);
        }
    };
    
    // 로딩 중이면 로딩 표시
    if (status === 'loading') {
        return (
            <div className="max-w-md mx-auto p-6 text-center">
                <p>로딩 중...</p>
            </div>
        );
    }
    
    return (
        <div className="max-w-md mx-auto p-6 bg-gray-50 dark:bg-gray-800 rounded-lg shadow-sm">
            <h1 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">➕ 항목 제안</h1>
            
            {remainingSubmissions !== null && (
                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                    <p className="text-sm text-blue-800">
                        이번 달 남은 제안 가능 횟수: <strong>{remainingSubmissions}회</strong>
                    </p>
                </div>
            )}
            
            {message.text && (
                <div className={`mb-4 p-3 rounded-md ${
                    message.type === 'success' 
                        ? 'bg-green-50 border border-green-200 text-green-800' 
                        : 'bg-red-50 border border-red-200 text-red-800'
                }`}>
                    <p className="text-sm">{message.text}</p>
                </div>
            )}
            
            <form className="space-y-4" onSubmit={handleSubmit}>
                {/* 그룹 선택 */}
                <div>
                    <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200 mb-1">
                        그룹 선택
                    </label>
                    <select
                        className="w-full border border-gray-300 px-3 py-2 rounded bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        value={selectedGroupId !== null ? String(selectedGroupId) : ''}
                        onChange={(e) => setSelectedGroupId(e.target.value ? Number(e.target.value) : null)}
                        required
                    >
                        <option value="">그룹을 선택해 주세요</option>
                        {groups.map((group) => (
                            <option key={group.id} value={group.id}>
                                {group.name}
                            </option>
                        ))}
                    </select>
                </div>
                
                {/* 카테고리 선택 */}
                <div>
                    <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200 mb-1">
                        카테고리 선택
                    </label>
                    <select
                        className="w-full border border-gray-300 px-3 py-2 rounded bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        value={selectedCategoryId !== null ? String(selectedCategoryId) : ''}
                        onChange={(e) => setSelectedCategoryId(e.target.value ? Number(e.target.value) : null)}
                        disabled={!selectedGroupId}
                        required
                    >
                        <option value="">
                            {selectedGroupId ? '카테고리를 선택해 주세요' : '먼저 그룹을 선택해 주세요'}
                        </option>
                        {filteredCategories.map((category) => (
                            <option key={category.id} value={category.id}>
                                {category.name}
                            </option>
                        ))}
                    </select>
                </div>
                
                {/* 항목 이름 */}
                <div>
                    <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200 mb-1">
                        항목 이름
                    </label>
                    <input
                        type="text"
                        placeholder="예: 아이폰 15 Pro"
                        className="w-full border border-gray-300 px-3 py-2 rounded bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        maxLength={50}
                    />
                </div>
                
                {/* 항목 설명 */}
                <div>
                    <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200 mb-1">
                        간단한 설명 (선택)
                    </label>
                    <textarea
                        placeholder="항목에 대한 간단한 설명을 입력해 주세요"
                        className="w-full border border-gray-300 px-3 py-2 rounded bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        maxLength={200}
                        rows={3}
                    />
                </div>
                
                {/* 제출 버튼 */}
                <button
                    type="submit"
                    className={`w-full py-2 rounded text-white ${
                        isSubmitting 
                            ? 'bg-gray-400 cursor-not-allowed' 
                            : 'bg-green-600 hover:bg-green-700'
                    }`}
                    disabled={isSubmitting}
                >
                    {isSubmitting ? '처리 중...' : '제안하기'}
                </button>
            </form>
            
            <div className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
                <p>
                    제안한 항목은 검토 후 반영됩니다.
                    <br />
                    <Link href="/" className="text-blue-600 hover:underline">
                        홈으로 돌아가기
                    </Link>
                </p>
            </div>
        </div>
    );
}
