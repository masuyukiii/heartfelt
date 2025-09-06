'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getReceivedMessages, markAsRead, type Message } from '@/lib/supabase/message-actions';

interface MockMessage {
  id: string;
  type: 'thanks' | 'honesty';
  sender: string;
  content: string;
  receivedAt: string;
  isRead: boolean;
}

export default function InboxDemoPage() {
  // デフォルトのメッセージ
  const defaultMessages: MockMessage[] = [
    {
      id: '1',
      type: 'thanks',
      sender: '田中さん',
      content: '今日はプロジェクトの手伝いをしてくれてありがとうございました。おかげでスムーズに進めることができました！',
      receivedAt: '2時間前',
      isRead: false
    },
    {
      id: '2',
      type: 'honesty',
      sender: '佐藤さん',
      content: '正直に言うと、あなたの提案にはとても感動しました。新しい視点をありがとうございます。',
      receivedAt: '5時間前',
      isRead: false
    },
    {
      id: '3',
      type: 'thanks',
      sender: '山田さん',
      content: '昨日は遅くまでお疲れ様でした。あなたのサポートがあったから最後まで頑張れました。',
      receivedAt: '1日前',
      isRead: true
    }
  ];

  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // ページロード時にSupabaseからメッセージを読み込み
  useEffect(() => {
    loadMessages();
  }, []);

  const loadMessages = async () => {
    setIsLoading(true);
    try {
      const realMessages = await getReceivedMessages();
      
      // 実際のメッセージがある場合はそれを使用、ない場合はデモメッセージを表示
      if (realMessages.length > 0) {
        setMessages(realMessages.map(msg => ({
          id: msg.id,
          type: msg.type,
          sender: msg.sender_name || 'Unknown',
          content: msg.content,
          receivedAt: formatTimeAgo(new Date(msg.created_at)),
          isRead: msg.is_read
        })));
      } else {
        // デモメッセージを表示
        setMessages(defaultMessages.map(msg => ({
          id: msg.id,
          type: msg.type,
          sender: msg.sender,
          content: msg.content,
          receivedAt: msg.receivedAt,
          isRead: msg.isRead
        })));
      }
    } catch (error) {
      console.error('Failed to load messages:', error);
      // エラー時はデモメッセージを表示
      setMessages(defaultMessages.map(msg => ({
        id: msg.id,
        type: msg.type,
        sender: msg.sender,
        content: msg.content,
        receivedAt: msg.receivedAt,
        isRead: msg.isRead
      })));
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
      // Supabaseで既読状態を更新
      const result = await markAsRead(messageId);
      
      if (result.success) {
        // UIを更新
        const updatedMessages = messages.map(msg => 
          msg.id === messageId ? { ...msg, isRead: true } : msg
        );
        setMessages(updatedMessages);
      } else {
        console.error('Failed to mark as read:', result.error);
        alert('既読状態の更新に失敗しました');
      }
    } catch (error) {
      console.error('Mark as read error:', error);
      // デモメッセージの場合はローカルで更新
      const updatedMessages = messages.map(msg => 
        msg.id === messageId ? { ...msg, isRead: true } : msg
      );
      setMessages(updatedMessages);
    }
  };

  const handleClearMessages = () => {
    // デモメッセージのみリセット（実際のメッセージは削除しない）
    setMessages(defaultMessages.map(msg => ({
      id: msg.id,
      type: msg.type,
      sender: msg.sender,
      content: msg.content,
      receivedAt: msg.receivedAt,
      isRead: msg.isRead
    })));
  };

  const unreadCount = messages.filter(msg => !msg.isRead).length;
  const newMessagesCount = messages.filter(msg => !defaultMessages.some(defaultMsg => defaultMsg.id === msg.id)).length;

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
          {newMessagesCount > 0 && (
            <div className="inline-flex items-center bg-green-500 text-white px-4 py-2 rounded-xl font-semibold shadow-sm ml-2">
              <span className="w-2 h-2 bg-white rounded-full mr-2 animate-pulse"></span>
              新着 {newMessagesCount}件
            </div>
          )}
        </div>

        {/* デモ通知とクリアボタン */}
        <div className="bg-yellow-100 border-l-4 border-yellow-500 p-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-yellow-700">
              <strong>受信BOXデモ</strong> - ダッシュボードから送信したメッセージがここに表示されます
            </p>
            {newMessagesCount > 0 && (
              <button
                onClick={handleClearMessages}
                className="text-xs bg-yellow-500 text-white px-2 py-1 rounded hover:bg-yellow-600"
              >
                リセット
              </button>
            )}
          </div>
        </div>

        {/* メッセージリスト */}
        {isLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full mx-auto"></div>
            <p className="text-sm text-gray-500 mt-3">メッセージを読み込み中...</p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => (
            <div
              key={message.id}
              className={`bg-white rounded-lg shadow-md p-4 border-l-4 transition-all duration-200 ${
                message.type === 'thanks' 
                  ? 'border-green-500' 
                  : 'border-blue-500'
              } ${!message.isRead ? 'ring-2 ring-blue-200 shadow-lg' : ''}`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <span className="text-lg">
                    {message.type === 'thanks' ? '💚' : '💭'}
                  </span>
                  <div>
                    <span className="font-semibold text-gray-800">
                      {message.sender}
                    </span>
                    <span className="text-sm text-gray-500 ml-2">
                      {message.type === 'thanks' ? 'ありがとうメッセージ' : '本音メッセージ'}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs text-gray-500">
                    {message.receivedAt}
                  </span>
                  {!message.isRead && (
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
              
              {!message.isRead && (
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
              <div className="font-bold text-green-600">
                {messages.filter(m => m.type === 'thanks').length}件
              </div>
            </div>
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="text-2xl mb-1">💭</div>
              <div className="text-sm text-gray-600">本音メッセージ</div>
              <div className="font-bold text-blue-600">
                {messages.filter(m => m.type === 'honesty').length}件
              </div>
            </div>
          </div>
        </div>

        {/* 戻るボタン */}
        <div className="text-center">
          <Link href="/dashboard-demo">
            <button className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors">
              ← ダッシュボードに戻る
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}