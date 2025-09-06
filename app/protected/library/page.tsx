'use client';

import { useState, useEffect } from 'react';
import { createClient } from "@/lib/supabase/client";
import { getLibraryWords, removeFromLibrary, getLibraryStats, type WordLibraryEntry } from '@/lib/supabase/word-library-actions';

function getCloudStyle(index: number, total: number) {
  const patterns = [
    () => ({
      left: `${Math.random() * 70 + 10}%`,
      top: `${Math.random() * 60 + 15}%`,
      transform: `rotate(${Math.random() * 20 - 10}deg)`,
    }),
    () => {
      const angle = (index / total) * Math.PI * 2;
      const radius = 25;
      const centerX = 50;
      const centerY = 40;
      return {
        left: `${centerX + Math.cos(angle) * radius}%`,
        top: `${centerY + Math.sin(angle) * radius}%`,
        transform: `rotate(${Math.sin(angle) * 15}deg)`,
      };
    },
    () => ({
      left: `${(index / total) * 80 + 10}%`,
      top: `${Math.sin((index / total) * Math.PI * 3) * 20 + 40}%`,
      transform: `rotate(${Math.sin(index) * 10}deg)`,
    }),
  ];

  const pattern = patterns[total % patterns.length];
  return pattern();
}

function getCloudSize(content: string) {
  const length = content.length;
  if (length < 20) return 'text-sm px-3 py-2';
  if (length < 40) return 'text-base px-4 py-3';
  if (length < 80) return 'text-lg px-5 py-4';
  return 'text-xl px-6 py-5';
}

export default function LibraryPage() {
  const [, setUser] = useState<{ id: string; email?: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [words, setWords] = useState<WordLibraryEntry[]>([]);
  const [isLoadingWords, setIsLoadingWords] = useState(false);
  const [stats, setStats] = useState({ thanksCount: 0, honestyCount: 0 });
  const [filter, setFilter] = useState<'all' | 'thanks' | 'honesty'>('all');
  const [selectedWord, setSelectedWord] = useState<WordLibraryEntry | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    checkUser();
    loadWords();
    loadStats();
  }, []);

  const checkUser = async () => {
    const supabase = createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
      window.location.href = "/auth/login";
      return;
    }
    
    setUser(user);
    setLoading(false);
  };

  const loadWords = async () => {
    setIsLoadingWords(true);
    try {
      const fetchedWords = await getLibraryWords();
      setWords(fetchedWords);
    } catch (error) {
      console.error('Failed to load words:', error);
    } finally {
      setIsLoadingWords(false);
    }
  };

  const loadStats = async () => {
    try {
      const result = await getLibraryStats();
      if (result.success) {
        setStats({
          thanksCount: result.thanksCount || 0,
          honestyCount: result.honestyCount || 0,
        });
      }
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const handleDelete = async (entryId: string) => {
    try {
      const result = await removeFromLibrary(entryId);
      
      if (result.success) {
        await loadWords();
        await loadStats();
        setShowDeleteConfirm(null);
        alert('ことばライブラリから削除しました');
      } else {
        alert(`削除に失敗しました: ${result.error}`);
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert('削除中にエラーが発生しました');
    }
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return '今';
    if (diffMins < 60) return `${diffMins}分前`;
    if (diffHours < 24) return `${diffHours}時間前`;
    if (diffDays < 7) return `${diffDays}日前`;
    return date.toLocaleDateString('ja-JP');
  };

  // フィルタリングされた言葉
  const filteredWords = words.filter(word => {
    if (filter === 'all') return true;
    return word.message_type === filter;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-blue-50 to-indigo-100 px-4 py-6 sm:px-6 sm:py-8">
      {/* 雲の背景パターン */}
      <div className="fixed inset-0 pointer-events-none opacity-10">
        <div className="absolute top-10 left-10 text-6xl">☁️</div>
        <div className="absolute top-20 right-20 text-4xl">🌤️</div>
        <div className="absolute bottom-32 left-1/4 text-5xl">☁️</div>
        <div className="absolute bottom-20 right-1/3 text-3xl">🌥️</div>
        <div className="absolute top-1/3 left-1/2 text-4xl">☁️</div>
      </div>

      <div className="max-w-md mx-auto space-y-4 relative z-10">
        {/* ヘッダー */}
        <div className="text-center">
          <div className="flex items-center justify-center mb-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mr-2">
              <span className="text-white text-sm">☁️</span>
            </div>
            <h1 className="text-xl font-bold text-slate-900">
              ことばライブラリ
            </h1>
          </div>
          <p className="text-slate-600 text-xs">
            心に残る言葉たち
          </p>
        </div>

        {/* ダッシュボードに戻るボタン */}
        <div className="text-center">
          <button
            onClick={() => window.location.href = '/protected'}
            className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-1.5 rounded-lg text-xs transition-colors"
          >
            ← 戻る
          </button>
        </div>


        {/* フィルター */}
        <div className="flex bg-white/70 backdrop-blur-sm rounded-lg p-1 shadow-sm">
          <button
            onClick={() => setFilter('all')}
            className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              filter === 'all'
                ? 'bg-purple-500 text-white'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            すべて ({words.length})
          </button>
          <button
            onClick={() => setFilter('thanks')}
            className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              filter === 'thanks'
                ? 'bg-green-500 text-white'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            💚 ありがとう ({stats.thanksCount})
          </button>
          <button
            onClick={() => setFilter('honesty')}
            className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              filter === 'honesty'
                ? 'bg-blue-500 text-white'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            💭 本音 ({stats.honestyCount})
          </button>
        </div>

        {/* 言葉の表示 */}
        {isLoadingWords ? (
          <div className="text-center py-8">
            <div className="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
            <p className="text-xs text-gray-500 mt-2">読み込み中...</p>
          </div>
        ) : filteredWords.length === 0 ? (
          <div className="bg-white/80 rounded-xl p-6 text-center">
            <div className="text-3xl mb-2">☁️</div>
            <p className="text-sm text-gray-600 mb-1">
              {filter === 'all' ? '保存した言葉がまだありません' : 
               filter === 'thanks' ? 'ありがとうの言葉がありません' : 
               '本音の言葉がありません'}
            </p>
            <p className="text-xs text-gray-500">
              メッセージを受信して保存してみましょう
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            {filteredWords.map((word) => (
              <div
                key={word.id}
                className={`rounded-xl cursor-pointer transition-shadow duration-200 p-3 ${
                  word.message_type === 'thanks' 
                    ? 'bg-gradient-to-b from-green-50 to-emerald-50 border border-green-200' 
                    : 'bg-gradient-to-b from-blue-50 to-sky-50 border border-blue-200'
                }`}
                onClick={() => setSelectedWord(word)}
              >
                <div className="text-center mb-2">
                  <span className="text-xl">
                    {word.message_type === 'thanks' ? '💚' : '💭'}
                  </span>
                </div>
                
                <div className="text-center mb-2">
                  <span className="text-[10px] text-gray-500">
                    {word.original_sender_name || '匿名'}
                  </span>
                </div>
                
                <p className="text-[10px] text-gray-600 text-center line-clamp-4 leading-relaxed">
                  {word.message_content}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* リフレッシュボタン */}
        <div className="text-center">
          <button
            onClick={() => {
              loadWords();
              loadStats();
            }}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-xs transition-colors"
          >
            🔄 更新
          </button>
        </div>
      </div>

      {/* 詳細モーダル */}
      {selectedWord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            {/* ヘッダー */}
            <div className={`bg-gradient-to-r ${
              selectedWord.message_type === 'thanks' 
                ? 'from-green-500 to-emerald-500' 
                : 'from-blue-500 to-indigo-500'
            } px-6 py-4 text-center relative`}>
              <button
                onClick={() => setSelectedWord(null)}
                className="absolute left-4 top-4 text-white hover:bg-white/20 rounded-full p-2 transition-all duration-200"
              >
                ✕
              </button>
              <div className="text-3xl mb-2">
                {selectedWord.message_type === 'thanks' ? '💚' : '💭'}
              </div>
              <h2 className="text-white text-xl font-bold">
                {selectedWord.message_type === 'thanks' ? 'ありがとうの言葉' : '本音の言葉'}
              </h2>
            </div>

            <div className="p-6 space-y-4">
              {/* メッセージ内容 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">メッセージ</label>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">
                    {selectedWord.message_content}
                  </p>
                </div>
              </div>

              {/* 送信者情報 */}
              {selectedWord.original_sender_name && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">送信者</label>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-gray-800">{selectedWord.original_sender_name}</p>
                  </div>
                </div>
              )}

              {/* 保存日時 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">保存日時</label>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-gray-800">
                    {new Date(selectedWord.saved_at).toLocaleString('ja-JP')}
                  </p>
                </div>
              </div>

              {/* 削除ボタン */}
              <button
                onClick={() => setShowDeleteConfirm(selectedWord.id)}
                className="w-full py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg font-semibold transition-colors duration-200"
              >
                🗑️ ライブラリから削除
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 削除確認モーダル */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6">
            <div className="text-center space-y-4">
              <div className="text-4xl">🗑️</div>
              <h3 className="text-lg font-bold text-gray-800">本当に削除しますか？</h3>
              <p className="text-sm text-gray-600">
                この言葉をことばライブラリから削除します。<br />
                この操作は取り消すことができません。
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(null)}
                  className="flex-1 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg font-semibold transition-colors duration-200"
                >
                  キャンセル
                </button>
                <button
                  onClick={() => handleDelete(showDeleteConfirm)}
                  className="flex-1 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg font-semibold transition-colors duration-200"
                >
                  削除する
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}