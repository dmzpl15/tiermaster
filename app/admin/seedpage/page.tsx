'use client';
// app/admin/seedpage/page.tsx
import React from 'react';
import { useState, useEffect, ChangeEvent } from 'react';
import Link from 'next/link';

// 타입 정의
interface Group {
    id: string;
    name: string;
}

interface Category {
    id: string;
    name: string;
    group_id: string;
}

interface NewItem {
    name: string;
    category_id: string;
    votes: number;
}

const SeedPage = () => {
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState('');
    const [categories, setCategories] = useState<Category[]>([]);
    const [groups, setGroups] = useState<Group[]>([]);
    const [selectedGroupId, setSelectedGroupId] = useState('');
    const [filteredCategories, setFilteredCategories] = useState<Category[]>([]);
    const [newItem, setNewItem] = useState<NewItem>({
        name: '',
        category_id: '',
        votes: 0
    });

    const resetDatabase = async () => {
        if (loading) return;
        
        setLoading(true);
        setStatus('데이터베이스 초기화 중...');
        
        try {
            const res = await fetch('/api/admin/reset', { method: 'POST' });
            const json = await res.json();
            setStatus(json.message || '초기화 완료');
        } catch (error) {
            console.error(error);
            setStatus('초기화 중 오류가 발생했습니다.');
        } finally {
            setLoading(false);
        }
    };

    const seedData = async () => {
        if (loading) return;
        
        setLoading(true);
        setStatus('샘플 데이터 삽입 중...');
        
        try {
            const res = await fetch('/api/admin/seed-items', { method: 'POST' });
            const json = await res.json();
            setStatus(json.success ? '샘플 데이터 삽입 완료!' : '샘플 데이터 삽입 실패');
        } catch (error) {
            console.error(error);
            setStatus('샘플 데이터 삽입 중 오류가 발생했습니다.');
        } finally {
            setLoading(false);
        }
    };

    // 그룹과 카테고리 데이터 가져오기
    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await fetch('/api/admin/get-categories', {
                    method: 'GET',
                });
                
                if (response.ok) {
                    const data = await response.json();
                    setGroups(data.groups || []);
                    setCategories(data.categories || []);
                    
                    if (data.groups && data.groups.length > 0) {
                        setSelectedGroupId(data.groups[0].id);
                    }
                }
            } catch (error) {
                console.error('데이터 가져오기 오류:', error);
            }
        };
        
        fetchData();
    }, []);
    
    // 선택된 그룹에 따라 카테고리 필터링
    useEffect(() => {
        if (selectedGroupId && categories.length > 0) {
            const filtered = categories.filter(cat => cat.group_id === selectedGroupId);
            setFilteredCategories(filtered);
            
            // 필터링된 카테고리가 있으면 처음 값 선택
            if (filtered.length > 0 && !newItem.category_id) {
                setNewItem(prev => ({ ...prev, category_id: filtered[0].id }));
            }
        }
    }, [selectedGroupId, categories]);
    
    // 새 항목 추가 함수
    const addNewItem = async () => {
        if (loading) return;
        if (!newItem.name || !newItem.category_id) {
            setStatus('⚠️ 항목 이름과 카테고리는 필수입니다.');
            return;
        }
        
        setLoading(true);
        setStatus('새 항목 추가 중...');
        
        try {
            const res = await fetch('/api/admin/add-item', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(newItem),
            });
            
            const json = await res.json();
            
            if (json.success) {
                setStatus(`항목 추가 성공: ${newItem.name}`);
                // 폼 초기화 (카테고리는 유지)
                setNewItem({
                    name: '',
                    category_id: newItem.category_id,
                    votes: 0
                });
            } else {
                setStatus(`항목 추가 실패: ${json.message || '알 수 없는 오류'}`);
            }
        } catch (error) {
            console.error(error);
            setStatus('항목 추가 중 오류가 발생했습니다.');
        } finally {
            setLoading(false);
        }
    };
    
    // 입력 필드 변경 함수
    const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setNewItem(prev => ({ ...prev, [name]: name === 'votes' ? Number(value) : value }));
    };

    return (
        <div className="p-6 max-w-4xl mx-auto text-gray-800 dark:text-gray-200">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800 dark:text-white">관리자 데이터 관리</h1>
                <Link href="/admin/suggestions" className="text-blue-500 hover:underline">
                    제안된 항목 관리하기
                </Link>
            </div>
            
            <div className="flex gap-4 mb-6">
                <button 
                    onClick={resetDatabase} 
                    disabled={loading}
                    className={`px-4 py-2 rounded ${loading ? 'bg-gray-400' : 'bg-red-500'} text-white`}
                >
                    {loading ? '처리 중...' : '❌ 전체 초기화'}
                </button>
                
                <button 
                    onClick={seedData} 
                    disabled={loading}
                    className={`px-4 py-2 rounded ${loading ? 'bg-gray-400' : 'bg-blue-500'} text-white`}
                >
                    {loading ? '처리 중...' : '📥 샘플 데이터 삽입'}
                </button>
            </div>
            
            {status && (
                <div className={`p-4 rounded mb-6 ${status.includes('오류') ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'} font-medium border ${status.includes('오류') ? 'border-red-200' : 'border-green-200'}`}>
                    <p>{status}</p>
                </div>
            )}
            
            {/* 새 항목 추가 폼 */}
            <div className="mt-8 border-t pt-6">
                <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-100">🆕 새 항목 추가</h2>
                
                <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                    <div className="mb-4">
                        <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">그룹 선택</label>
                        <select 
                            className="w-full p-2 border rounded bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 border-gray-300 dark:border-gray-600"
                            value={selectedGroupId}
                            onChange={(e) => setSelectedGroupId(e.target.value)}
                        >
                            {groups.map(group => (
                                <option key={group.id} value={group.id}>{group.name}</option>
                            ))}
                        </select>
                    </div>
                    
                    <div className="mb-4">
                        <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">카테고리 선택</label>
                        <select 
                            name="category_id"
                            className="w-full p-2 border rounded bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 border-gray-300 dark:border-gray-600"
                            value={newItem.category_id}
                            onChange={handleInputChange}
                        >
                            {filteredCategories.map(category => (
                                <option key={category.id} value={category.id}>{category.name}</option>
                            ))}
                        </select>
                    </div>
                    
                    <div className="mb-4">
                        <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">항목 이름</label>
                        <input 
                            type="text" 
                            name="name"
                            className="w-full p-2 border rounded bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 border-gray-300 dark:border-gray-600"
                            value={newItem.name}
                            onChange={handleInputChange}
                            placeholder="예: 오징어 게임"
                        />
                    </div>
                    
                    <div className="mb-4">
                        <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">초기 추천 수</label>
                        <input 
                            type="number" 
                            name="votes"
                            className="w-full p-2 border rounded bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 border-gray-300 dark:border-gray-600"
                            value={newItem.votes}
                            onChange={handleInputChange}
                            min="0"
                        />
                    </div>
                    
                    <button 
                        onClick={addNewItem}
                        disabled={loading}
                        className={`px-4 py-2 rounded ${loading ? 'bg-gray-400' : 'bg-green-500'} text-white`}
                    >
                        {loading ? '추가 중...' : '항목 추가'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SeedPage;
