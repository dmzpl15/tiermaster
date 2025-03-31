'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

// 타입 정의
interface Suggestion {
  id: string;
  name: string;
  description: string | null;
  category_id: string;
  user_email: string;
  user_name: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  processed_at: string | null;
  processed_by: string | null;
  rejection_reason: string | null;
  categories: {
    id: string;
    name: string;
    group_id: string;
  };
}

export default function SuggestionsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending');
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [currentSuggestion, setCurrentSuggestion] = useState<Suggestion | null>(null);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  
  // 로그인 상태 확인
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/api/auth/signin?callbackUrl=/admin/suggestions');
    }
  }, [status, router]);
  
  // 제안된 항목 목록 로드
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (status !== 'authenticated') return;
      
      try {
        setLoading(true);
        const response = await fetch('/api/admin/get-suggestions');
        const data = await response.json();
        
        if (data.success) {
          setSuggestions(data.suggestions);
        } else {
          setError(data.message || '제안된 항목을 불러오는 데 실패했습니다.');
        }
      } catch (err) {
        console.error('제안된 항목 로드 오류:', err);
        setError('서버 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchSuggestions();
  }, [status]);
  
  // 필터링된 제안 목록
  const filteredSuggestions = suggestions.filter(suggestion => {
    if (activeTab === 'all') return true;
    return suggestion.status === activeTab;
  });
  
  // 제안 승인 처리
  const handleApprove = async (id: string) => {
    if (processingId) return;
    
    try {
      setProcessingId(id);
      const response = await fetch('/api/admin/process-suggestion', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id,
          action: 'approve'
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        // 상태 업데이트
        setSuggestions(prev => 
          prev.map(suggestion => 
            suggestion.id === id 
              ? { ...suggestion, status: 'approved', processed_at: new Date().toISOString(), processed_by: session?.user?.email || null } 
              : suggestion
          )
        );
        setStatusMessage({ text: data.message, type: 'success' });
      } else {
        setStatusMessage({ text: data.message, type: 'error' });
      }
    } catch (err) {
      console.error('제안 승인 처리 오류:', err);
      setStatusMessage({ text: '서버 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.', type: 'error' });
    } finally {
      setProcessingId(null);
    }
  };
  
  // 거부 모달 열기
  const openRejectModal = (suggestion: Suggestion) => {
    setCurrentSuggestion(suggestion);
    setRejectionReason('');
    setShowRejectModal(true);
  };
  
  // 제안 거부 처리
  const handleReject = async () => {
    if (!currentSuggestion || processingId) return;
    
    try {
      setProcessingId(currentSuggestion.id);
      const response = await fetch('/api/admin/process-suggestion', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: currentSuggestion.id,
          action: 'reject',
          reason: rejectionReason || '관리자에 의해 거부됨'
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        // 상태 업데이트
        setSuggestions(prev => 
          prev.map(suggestion => 
            suggestion.id === currentSuggestion.id 
              ? { 
                  ...suggestion, 
                  status: 'rejected', 
                  processed_at: new Date().toISOString(), 
                  processed_by: session?.user?.email || null,
                  rejection_reason: rejectionReason || '관리자에 의해 거부됨'
                } 
              : suggestion
          )
        );
        setStatusMessage({ text: data.message, type: 'success' });
        setShowRejectModal(false);
      } else {
        setStatusMessage({ text: data.message, type: 'error' });
      }
    } catch (err) {
      console.error('제안 거부 처리 오류:', err);
      setStatusMessage({ text: '서버 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.', type: 'error' });
    } finally {
      setProcessingId(null);
    }
  };
  
  // 로딩 중이면 로딩 표시
  if (status === 'loading' || loading) {
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">제안된 항목 관리</h1>
        <div className="flex justify-center items-center h-64">
          <p className="text-gray-500">로딩 중...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">제안된 항목 관리</h1>
        <Link href="/admin/seedpage" className="text-blue-500 hover:underline">
          항목 추가 페이지로 이동
        </Link>
      </div>
      
      {/* 상태 메시지 */}
      {statusMessage && (
        <div className={`p-4 rounded mb-6 ${
          statusMessage.type === 'success' 
            ? 'bg-green-50 border border-green-200 text-green-800' 
            : 'bg-red-50 border border-red-200 text-red-800'
        }`}>
          <p>{statusMessage.text}</p>
        </div>
      )}
      
      {/* 탭 메뉴 */}
      <div className="flex border-b mb-6">
        <button 
          className={`px-4 py-2 ${activeTab === 'pending' ? 'border-b-2 border-blue-500 font-semibold' : 'text-gray-500'}`}
          onClick={() => setActiveTab('pending')}
        >
          대기 중 ({suggestions.filter(s => s.status === 'pending').length})
        </button>
        <button 
          className={`px-4 py-2 ${activeTab === 'approved' ? 'border-b-2 border-blue-500 font-semibold' : 'text-gray-500'}`}
          onClick={() => setActiveTab('approved')}
        >
          승인됨 ({suggestions.filter(s => s.status === 'approved').length})
        </button>
        <button 
          className={`px-4 py-2 ${activeTab === 'rejected' ? 'border-b-2 border-blue-500 font-semibold' : 'text-gray-500'}`}
          onClick={() => setActiveTab('rejected')}
        >
          거부됨 ({suggestions.filter(s => s.status === 'rejected').length})
        </button>
        <button 
          className={`px-4 py-2 ${activeTab === 'all' ? 'border-b-2 border-blue-500 font-semibold' : 'text-gray-500'}`}
          onClick={() => setActiveTab('all')}
        >
          전체 ({suggestions.length})
        </button>
      </div>
      
      {/* 오류 메시지 */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded mb-6">
          <p>{error}</p>
        </div>
      )}
      
      {/* 제안 목록 */}
      {filteredSuggestions.length === 0 ? (
        <div className="bg-gray-50 p-8 rounded-lg text-center">
          <p className="text-gray-500">표시할 제안이 없습니다.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
            <thead className="bg-gray-100 dark:bg-gray-700">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-200">항목 이름</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-200">카테고리</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-200">제안자</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-200">제안일</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-200">상태</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-200">액션</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredSuggestions.map((suggestion) => (
                <tr key={suggestion.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-4 py-3 text-sm">
                    <div className="font-medium text-gray-900 dark:text-white">{suggestion.name}</div>
                    {suggestion.description && (
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{suggestion.description}</div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{suggestion.categories?.name || '알 수 없음'}</td>
                  <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                    <div>{suggestion.user_name}</div>
                    <div className="text-xs text-gray-500">{suggestion.user_email}</div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                    {new Date(suggestion.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      suggestion.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      suggestion.status === 'approved' ? 'bg-green-100 text-green-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {suggestion.status === 'pending' ? '대기 중' :
                       suggestion.status === 'approved' ? '승인됨' :
                       '거부됨'}
                    </span>
                    {suggestion.status === 'rejected' && suggestion.rejection_reason && (
                      <div className="text-xs text-gray-500 mt-1">
                        사유: {suggestion.rejection_reason}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {suggestion.status === 'pending' ? (
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleApprove(suggestion.id)}
                          disabled={processingId === suggestion.id}
                          className={`px-3 py-1 rounded text-xs ${
                            processingId === suggestion.id
                              ? 'bg-gray-300 text-gray-700 cursor-not-allowed'
                              : 'bg-green-500 text-white hover:bg-green-600'
                          }`}
                        >
                          {processingId === suggestion.id ? '처리 중...' : '승인'}
                        </button>
                        <button
                          onClick={() => openRejectModal(suggestion)}
                          disabled={processingId === suggestion.id}
                          className={`px-3 py-1 rounded text-xs ${
                            processingId === suggestion.id
                              ? 'bg-gray-300 text-gray-700 cursor-not-allowed'
                              : 'bg-red-500 text-white hover:bg-red-600'
                          }`}
                        >
                          거부
                        </button>
                      </div>
                    ) : (
                      <span className="text-xs text-gray-500">
                        {suggestion.processed_at && `처리일: ${new Date(suggestion.processed_at).toLocaleDateString()}`}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      
      {/* 거부 사유 모달 */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">제안 거부</h3>
            <p className="mb-4 text-sm text-gray-600 dark:text-gray-300">
              <strong>{currentSuggestion?.name}</strong> 항목을 거부하시겠습니까?
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                거부 사유 (선택)
              </label>
              <textarea
                className="w-full p-2 border rounded bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 border-gray-300 dark:border-gray-600"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="거부 사유를 입력하세요"
                rows={3}
              />
            </div>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowRejectModal(false)}
                className="px-4 py-2 border border-gray-300 rounded text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                취소
              </button>
              <button
                onClick={handleReject}
                disabled={processingId === currentSuggestion?.id}
                className={`px-4 py-2 rounded text-white ${
                  processingId === currentSuggestion?.id
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-red-500 hover:bg-red-600'
                }`}
              >
                {processingId === currentSuggestion?.id ? '처리 중...' : '거부'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
