'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getReceivedMessages, markAsRead, type Message } from '@/lib/supabase/message-actions';

export default function InboxDemoPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'thanks' | 'honesty'>('all');

  // ページロード時にSupabaseからメッセージを読み込み
  useEffect(() => {
    loadMessages();
  }, []);

  const loadMessages = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const realMessages = await getReceivedMessages();
      setMessages(realMessages);
    } catch (error) {
      console.error('Failed to load messages:', error);
      setError('メッセージの読み込みに失敗しました');
    } finally {
      setIsLoading(false);
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

  const handleMarkAsRead = async (messageId: string) => {
    try {
      const result = await markAsRead(messageId);
      
      if (result.success) {
        // メッセージリストを再読み込み
        await loadMessages();
        alert('既読状態の更新に成功しました');
      } else {
        console.error('Failed to mark as read:', result.error);
        alert(`既読状態の更新に失敗しました: ${result.error}`);
      }
    } catch (error) {
      console.error('Mark as read error:', error);
      alert('既読状態の更新中にエラーが発生しました');
    }
  };

  const unreadCount = messages.filter(msg => !msg.is_read).length;
  const thanksCount = messages.filter(m => m.type === 'thanks').length;
  const honestyCount = messages.filter(m => m.type === 'honesty').length;

  // フィルタリングされたメッセージ
  const filteredMessages = messages.filter(message => {
    if (filter === 'all') return true;
    return message.type === filter;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-purple-50 px-4 py-6 sm:px-6 sm:py-8">
      <div className="max-w-md mx-auto space-y-6 sm:space-y-8">
        {/* ヘッダー */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center mb-3">
            <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center mr-3">
              <span className="text-white text-lg">📫</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              受信BOX
            </h1>
          </div>
          <p className="text-slate-600 text-sm leading-relaxed">
            あなたに届いたメッセージを確認しましょう
          </p>
          {unreadCount > 0 && (
            <div className="inline-flex items-center bg-red-500 text-white px-4 py-2 rounded-xl font-semibold shadow-sm">
              <span className="w-2 h-2 bg-white rounded-full mr-2 animate-pulse"></span>
              未読 {unreadCount}件
            </div>
          )}
        </div>

        {/* エラー表示 */}
        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 p-4">
            <p className="text-sm text-red-700">{error}</p>
            <button 
              onClick={loadMessages}
              className="mt-2 text-xs bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600"
            >
              再試行
            </button>
          </div>
        )}

        {/* メッセージリスト */}
        {isLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full mx-auto"></div>
            <p className="text-sm text-gray-500 mt-3">メッセージを読み込み中...</p>
          </div>
        ) : filteredMessages.length === 0 ? (
          <div className="bg-gray-100 rounded-lg p-8 text-center">
            <div className="text-4xl mb-4">📭</div>
            <p className="text-gray-600">
              {filter === 'all' ? 'まだメッセージがありません' : 
               filter === 'thanks' ? 'ありがとうメッセージがありません' : 
               '本音メッセージがありません'}
            </p>
            <p className="text-gray-500 text-sm mt-2">
              {filter === 'all' ? 'ダッシュボードからメッセージを送信してみてください' : 
               'フィルターを変更して他のメッセージを確認してください'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredMessages.map((message) => (
              <div
                key={message.id}
                className={`bg-white rounded-lg shadow-md p-4 border-l-4 transition-all duration-200 ${
                  message.type === 'thanks' 
                    ? 'border-green-500' 
                    : 'border-blue-500'
                } ${!message.is_read ? 'ring-2 ring-purple-200 shadow-lg' : ''}`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center space-x-3">
                    <span className="text-lg">
                      {message.type === 'thanks' ? '💚' : '💭'}
                    </span>
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold text-gray-800">
                        {message.sender_name || 'Anonymous'}
                      </span>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        message.type === 'thanks' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {message.type === 'thanks' ? 'ありがとう' : '本音'}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-gray-500">
                      {formatTimeAgo(new Date(message.created_at))}
                    </span>
                    {!message.is_read && (
                      <div className="mt-1">
                        <button
                          onClick={() => handleMarkAsRead(message.id)}
                          className="text-xs bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600"
                        >
                          既読にする
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                
                <p className="text-gray-700 leading-relaxed">
                  {message.content}
                </p>
                
                {!message.is_read && (
                  <div className="mt-3 p-2 bg-green-50 rounded text-sm text-green-700">
                    💚 このメッセージを読むと+1ポイント獲得！
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* 統計情報 */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-800">
            📊 受信統計
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="text-2xl mb-1">💚</div>
              <div className="text-sm text-gray-600">ありがとうメッセージ</div>
              <div className="font-bold text-green-600">{thanksCount}件</div>
            </div>
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="text-2xl mb-1">💭</div>
              <div className="text-sm text-gray-600">本音メッセージ</div>
              <div className="font-bold text-blue-600">{honestyCount}件</div>
            </div>
          </div>
        </div>

        {/* フィルタータブ */}
        <div className="flex bg-white rounded-lg p-1 shadow-sm">
          <button
            onClick={() => setFilter('all')}
            className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              filter === 'all'
                ? 'bg-purple-500 text-white'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            すべて ({messages.length})
          </button>
          <button
            onClick={() => setFilter('thanks')}
            className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              filter === 'thanks'
                ? 'bg-green-500 text-white'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            💚 ありがとう ({thanksCount})
          </button>
          <button
            onClick={() => setFilter('honesty')}
            className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              filter === 'honesty'
                ? 'bg-blue-500 text-white'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            💭 本音 ({honestyCount})
          </button>
        </div>

        {/* アクションボタン */}
        <div className="flex gap-4">
          <button
            onClick={loadMessages}
            className="flex-1 bg-purple-500 hover:bg-purple-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
          >
            🔄 更新
          </button>
          <Link href="/dashboard-demo" className="flex-1">
            <button className="w-full bg-gray-500 hover:bg-gray-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors">
              ← ダッシュボード
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}