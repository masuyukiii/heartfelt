"use client";

import { useState, useEffect } from 'react';
import { createClient } from "@/lib/supabase/client";
import { getUsers, type User } from '@/lib/supabase/users';
import { getCurrentUserProfile } from '@/lib/supabase/profile-actions';
import { sendMessage } from '@/lib/supabase/message-actions';
import Link from "next/link";
import { Heart, MessageCircle, TreePine, Gift, CloudRain, Send, ArrowLeft, Sparkles, Settings, User as UserIcon } from "lucide-react";
import ProfileEditModal from '@/components/profile/ProfileEditModal';

// 6段階成長システム関数
function getGrowthStageIcon(totalPoints: number) {
  if (totalPoints === 0) return '🌰';
  if (totalPoints <= 3) return '🌱';
  if (totalPoints <= 8) return '🌿';
  if (totalPoints <= 15) return '🌲';
  if (totalPoints <= 25) return '🌳';
  return '🌸';
}

function getGrowthMessage(totalPoints: number) {
  if (totalPoints === 0) return '心の種を植えましょう';
  if (totalPoints <= 3) return '小さな芽が出ました';
  if (totalPoints <= 8) return '成長しています';
  if (totalPoints <= 15) return '立派に育っています';
  if (totalPoints <= 25) return '大きく成長しました';
  return '美しく花が咲きました';
}

// 自動返信メッセージを生成する関数
function generateAutoReply(type: 'thanks' | 'honesty', senderName: string, originalMessage: string): string {
  const thanksReplies = [
    `${originalMessage.substring(0, 20)}...のメッセージ、とても嬉しかったです！こちらこそありがとうございます😊`,
    `温かいお言葉をいただき、ありがとうございます。${senderName}さんのおかげで頑張れます！`,
    `ありがとうございます！${senderName}さんと一緒に働けて本当に良かったです。`,
    `お気遣いいただき、ありがとうございます。${senderName}さんの優しさに感謝しています。`,
    `メッセージを読んで元気が出ました！${senderName}さん、ありがとうございます。`
  ];
  
  const honestyReplies = [
    `正直なお気持ちを伝えてくださり、ありがとうございます。${senderName}さんのご意見、参考になります。`,
    `率直なフィードバックをいただき、感謝しています。一緒に改善していきましょう！`,
    `本音でお話しくださり、ありがとうございます。${senderName}さんとはオープンに話せて心強いです。`,
    `貴重なご意見をありがとうございます。${senderName}さんの視点、とても参考になりました。`,
    `正直な気持ちを共有してくださり、ありがとうございます。信頼関係を感じています。`
  ];
  
  const replies = type === 'thanks' ? thanksReplies : honestyReplies;
  return replies[Math.floor(Math.random() * replies.length)];
}

export default function ProtectedPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [mockData, setMockData] = useState({
    thanksPoints: 12,
    honestyPoints: 8,
  });
  const [showCelebration, setShowCelebration] = useState(false);
  const [showThanksModal, setShowThanksModal] = useState(false);
  const [showHonestyModal, setShowHonestyModal] = useState(false);
  const [showGoalEditModal, setShowGoalEditModal] = useState(false);
  const [selectedRecipient, setSelectedRecipient] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [currentUserProfile, setCurrentUserProfile] = useState<any>(null);

  // ご褒美ゴール設定
  const [rewardGoal, setRewardGoal] = useState({
    title: 'カフェで読書タイム',
    description: 'お気に入りのカフェでゆっくり読書を楽しむ',
    requiredPoints: 30
  });

  // 編集用の一時状態
  const [editGoalTitle, setEditGoalTitle] = useState('');
  const [editGoalDescription, setEditGoalDescription] = useState('');
  const [editGoalPoints, setEditGoalPoints] = useState(30);

  const totalPoints = mockData.thanksPoints + mockData.honestyPoints;
  const remainingPoints = Math.max(rewardGoal.requiredPoints - totalPoints, 0);
  const progressPercentage = Math.min((totalPoints / rewardGoal.requiredPoints) * 100, 100);

  // デモ用のフォールバック受信者リスト
  const mockRecipients = [
    { id: '1', name: '田中さん', department: 'マーケティング部' },
    { id: '2', name: '佐藤さん', department: 'エンジニアリング部' },
    { id: '3', name: '山田さん', department: 'デザイン部' },
    { id: '4', name: '鈴木さん', department: '営業部' },
    { id: '5', name: '高橋さん', department: 'HR部' },
  ];

  useEffect(() => {
    checkUser();
    loadInitialData();
    loadUsers();
    loadCurrentUserProfile();
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

  const loadInitialData = () => {
    const savedGoal = localStorage.getItem('heartfelt-reward-goal');
    if (savedGoal) {
      setRewardGoal(JSON.parse(savedGoal));
    }

    const savedPoints = localStorage.getItem('heartfelt-demo-points');
    if (savedPoints) {
      setMockData(JSON.parse(savedPoints));
    }
  };

  const loadUsers = async () => {
    setIsLoadingUsers(true);
    try {
      const fetchedUsers = await getUsers();
      setUsers(fetchedUsers);
    } catch (error) {
      console.error('Failed to load users:', error);
    } finally {
      setIsLoadingUsers(false);
    }
  };

  const loadCurrentUserProfile = async () => {
    try {
      const profile = await getCurrentUserProfile();
      setCurrentUserProfile(profile);
    } catch (error) {
      console.error('Failed to load current user profile:', error);
    }
  };

  const handleProfileUpdate = () => {
    loadUsers(); // ユーザー一覧を再読み込み
    loadCurrentUserProfile(); // 現在のユーザープロフィールを再読み込み
  };

  // ポイントが変更されたときにローカルストレージに保存
  useEffect(() => {
    localStorage.setItem('heartfelt-demo-points', JSON.stringify(mockData));
  }, [mockData]);

  const addPoints = (type: 'thanks' | 'honesty') => {
    setMockData(prev => ({
      ...prev,
      [type === 'thanks' ? 'thanksPoints' : 'honestyPoints']: 
        prev[type === 'thanks' ? 'thanksPoints' : 'honestyPoints'] + 1
    }));
    
    // 達成時のセレブレーション
    if (totalPoints + 1 >= rewardGoal.requiredPoints) {
      setShowCelebration(true);
      setTimeout(() => setShowCelebration(false), 2000);
    }
  };

  const resetPoints = () => {
    const newData = {
      thanksPoints: 0,
      honestyPoints: 0
    };
    setMockData(newData);
    localStorage.setItem('heartfelt-demo-points', JSON.stringify(newData));
    setShowCelebration(false);
  };

  const openThanksModal = () => {
    setShowThanksModal(true);
    setSelectedRecipient('');
    setMessage('');
  };

  const openHonestyModal = () => {
    setShowHonestyModal(true);
    setSelectedRecipient('');
    setMessage('');
  };

  const closeModals = () => {
    setShowThanksModal(false);
    setShowHonestyModal(false);
    setSelectedRecipient('');
    setMessage('');
    setIsSubmitting(false);
  };

  const openGoalEditModal = () => {
    setEditGoalTitle(rewardGoal.title);
    setEditGoalDescription(rewardGoal.description);
    setEditGoalPoints(rewardGoal.requiredPoints);
    setShowGoalEditModal(true);
  };

  const closeGoalEditModal = () => {
    setShowGoalEditModal(false);
    setEditGoalTitle('');
    setEditGoalDescription('');
    setEditGoalPoints(30);
  };

  const handleSaveGoal = () => {
    if (!editGoalTitle.trim()) return;

    const newGoal = {
      title: editGoalTitle,
      description: editGoalDescription,
      requiredPoints: editGoalPoints
    };

    // ご褒美の内容（タイトル）が変更された場合のみ進捗をリセット
    const isContentChanged = rewardGoal.title !== newGoal.title;
    
    if (isContentChanged && (mockData.thanksPoints > 0 || mockData.honestyPoints > 0)) {
      const shouldReset = confirm('ご褒美の内容を変更すると、現在の進捗がリセットされます。\n続行しますか？');
      
      if (shouldReset) {
        // ポイントをリセット
        setMockData({
          thanksPoints: 0,
          honestyPoints: 0
        });
        
        // ローカルストレージからもポイントデータを削除
        localStorage.removeItem('heartfelt-demo-points');
      } else {
        return; // キャンセルされた場合は何もしない
      }
    }

    setRewardGoal(newGoal);
    localStorage.setItem('heartfelt-reward-goal', JSON.stringify(newGoal));
    closeGoalEditModal();
    
    if (isContentChanged) {
      alert('ご褒美の内容を変更し、進捗を0からスタートしました！');
    } else {
      alert('ご褒美ゴールを更新しました！');
    }
  };

  const handleSubmit = async (type: 'thanks' | 'honesty') => {
    if (!selectedRecipient || !message.trim()) return;
    
    setIsSubmitting(true);
    
    try {
      // 実際にSupabaseにメッセージを送信
      const result = await sendMessage({
        recipientId: selectedRecipient,
        type: type,
        content: message
      });

      if (result.success) {
        // ポイント追加
        addPoints(type);
        
        // 成功メッセージとモーダル閉じる
        setIsSubmitting(false);
        closeModals();
        
        // 成功通知
        alert(`${type === 'thanks' ? 'ありがとう' : '本音'}メッセージを送信しました！`);
      } else {
        throw new Error(result.error || 'メッセージ送信に失敗しました');
      }
    } catch (error) {
      console.error('Message send error:', error);
      setIsSubmitting(false);
      alert('メッセージの送信に失敗しました。もう一度お試しください。');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50">
      {/* セレブレーション */}
      {showCelebration && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-8 text-center shadow-2xl animate-pulse">
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-2xl font-bold text-emerald-600 mb-2">おめでとうございます！</h2>
            <p className="text-gray-600">目標を達成しました</p>
          </div>
        </div>
      )}

      <div className="max-w-md mx-auto p-4">
        {/* メインカード */}
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
          
          {/* ヘッダー - ご褒美ゴール */}
          <div className="bg-gradient-to-r from-emerald-500 to-teal-500 px-6 py-8 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-white/10"></div>
            <div className="absolute top-4 right-4 flex gap-2">
              <button
                onClick={() => setShowProfileModal(true)}
                className="text-white hover:bg-white/20 rounded-full p-2 transition-all duration-200"
                title="プロフィールを編集"
              >
                <UserIcon size={20} />
              </button>
              <button
                onClick={openGoalEditModal}
                className="text-white hover:bg-white/20 rounded-full p-2 transition-all duration-200"
                title="ご褒美ゴールを編集"
              >
                ✏️
              </button>
            </div>
            <div className="relative z-10">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-white/20 rounded-full mb-3">
                <span className="text-2xl">🎯</span>
              </div>
              <h1 className="text-white text-xl font-bold tracking-wide">ご褒美ゴール</h1>
              <p className="text-emerald-100 text-sm mt-1">{rewardGoal.title}</p>
              {rewardGoal.description && (
                <p className="text-emerald-200 text-xs mt-1 opacity-80">{rewardGoal.description}</p>
              )}
            </div>
          </div>

          {/* 進捗エリア */}
          <div className="px-6 py-8 bg-gradient-to-b from-white to-gray-50">
            
            {/* 進捗バー */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-600">進捗状況</span>
                <span className="text-sm font-bold text-gray-800">{totalPoints} / {rewardGoal.requiredPoints}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-emerald-500 to-teal-500 h-3 rounded-full transition-all duration-1000 ease-out shadow-sm"
                  style={{ width: `${progressPercentage}%` }}
                ></div>
              </div>
            </div>

            {/* 達成メッセージ */}
            <div className="text-center mb-6">
              {remainingPoints > 0 ? (
                <div className="space-y-2">
                  <p className="text-gray-600 text-sm">達成まで</p>
                  <p className="text-3xl font-bold text-emerald-600">{remainingPoints}</p>
                  <p className="text-gray-600 text-sm">ポイント</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="text-4xl">🌟</div>
                  <p className="text-xl font-bold text-emerald-600">目標達成！</p>
                  <p className="text-gray-600 text-sm">お疲れ様でした</p>
                </div>
              )}
            </div>

            {/* 植物エリア */}
            <div className="bg-gradient-to-b from-sky-50 to-emerald-50 rounded-2xl p-8 mb-6 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-white/50 to-transparent"></div>
              <div className="relative z-10 text-center">
                <div className="text-7xl mb-4 filter drop-shadow-lg animate-pulse">
                  {getGrowthStageIcon(totalPoints)}
                </div>
                <p className="text-emerald-700 font-medium text-sm">
                  {getGrowthMessage(totalPoints)}
                </p>
                <div className="mt-3 inline-flex items-center bg-white/60 backdrop-blur-sm px-3 py-1 rounded-full">
                  <span className="text-xs text-gray-600">現在 {totalPoints} ポイント</span>
                </div>
              </div>
            </div>

            {/* ポイント詳細 */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-gradient-to-br from-pink-50 to-rose-50 rounded-xl p-4 text-center border border-pink-100">
                <div className="text-2xl mb-2">💖</div>
                <div className="text-2xl font-bold text-pink-600">{mockData.thanksPoints}</div>
                <div className="text-xs text-pink-700">ありがとう</div>
              </div>
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 text-center border border-blue-100">
                <div className="text-2xl mb-2">💭</div>
                <div className="text-2xl font-bold text-blue-600">{mockData.honestyPoints}</div>
                <div className="text-xs text-blue-700">本音</div>
              </div>
            </div>
          </div>

          {/* アクションボタン */}
          <div className="p-6 bg-gray-50">
            <div className="grid grid-cols-2 gap-4 mb-4">
              <button 
                onClick={openThanksModal}
                className="group bg-gradient-to-r from-pink-500 to-rose-500 text-white p-4 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 active:scale-95"
              >
                <div className="text-2xl mb-2 group-hover:scale-110 transition-transform duration-200">💖</div>
                <div className="text-sm font-semibold">ありがとう<br />を送る</div>
              </button>
              
              <button 
                onClick={openHonestyModal}
                className="group bg-gradient-to-r from-blue-500 to-indigo-500 text-white p-4 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 active:scale-95"
              >
                <div className="text-2xl mb-2 group-hover:scale-110 transition-transform duration-200">💭</div>
                <div className="text-sm font-semibold">本音を<br />送る</div>
              </button>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <Link href="/inbox-demo" className="block">
                <button className="group w-full bg-white border-2 border-gray-200 text-gray-700 p-4 rounded-2xl hover:border-purple-300 hover:bg-purple-50 transition-all duration-200 hover:scale-105 active:scale-95">
                  <div className="text-2xl mb-2 group-hover:scale-110 transition-transform duration-200">📫</div>
                  <div className="text-sm font-semibold">受信<br />BOX</div>
                </button>
              </Link>
              
              <Link href="/positive-writer" className="block">
                <button className="group w-full bg-white border-2 border-gray-200 text-gray-700 p-4 rounded-2xl hover:border-green-300 hover:bg-green-50 transition-all duration-200 hover:scale-105 active:scale-95">
                  <div className="text-2xl mb-2 group-hover:scale-110 transition-transform duration-200">✨</div>
                  <div className="text-sm font-semibold">ポジティブ<br />ライター</div>
                </button>
              </Link>
            </div>
          </div>
        </div>

        {/* ありがとうメッセージ送信モーダル */}
        {showThanksModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
              {/* ヘッダー */}
              <div className="bg-gradient-to-r from-pink-500 to-rose-500 px-6 py-4 text-center relative">
                <button
                  onClick={closeModals}
                  className="absolute left-4 top-4 text-white hover:bg-white/20 rounded-full p-2 transition-all duration-200"
                >
                  ✕
                </button>
                <div className="text-3xl mb-2">💖</div>
                <h2 className="text-white text-xl font-bold">ありがとうを送る</h2>
              </div>

              <div className="p-6 space-y-6">
                {/* 宛先選択 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">宛先を選択してください</label>
                  {isLoadingUsers ? (
                    <div className="text-center py-4">
                      <div className="animate-spin w-6 h-6 border-2 border-pink-500 border-t-transparent rounded-full mx-auto"></div>
                      <p className="text-sm text-gray-500 mt-2">ユーザー一覧を読み込み中...</p>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {(users.length > 0 ? users : mockRecipients).map((recipient) => (
                        <button
                          key={recipient.id}
                          onClick={() => setSelectedRecipient(recipient.id)}
                          className={`w-full text-left p-3 rounded-xl border-2 transition-all duration-200 ${
                            selectedRecipient === recipient.id
                              ? 'border-pink-500 bg-pink-50'
                              : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          <div className="font-medium text-gray-900">
                            {('email' in recipient) ? (recipient.name || recipient.email || '匿名ユーザー') : recipient.name}
                          </div>
                          <div className="text-xs text-gray-500">
                            {('email' in recipient) ? (recipient.department || 'Supabaseユーザー') : recipient.department}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* メッセージ入力 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    メッセージ <span className="text-gray-500">({message.length}/200文字)</span>
                  </label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    maxLength={200}
                    placeholder="感謝の気持ちを伝えましょう..."
                    className="w-full h-32 p-4 border-2 border-gray-200 rounded-xl focus:border-pink-500 focus:outline-none resize-none transition-colors duration-200"
                  />
                </div>

                {/* 送信ボタン */}
                <button
                  onClick={() => handleSubmit('thanks')}
                  disabled={!selectedRecipient || !message.trim() || isSubmitting}
                  className={`w-full py-4 rounded-2xl font-semibold transition-all duration-200 ${
                    selectedRecipient && message.trim() && !isSubmitting
                      ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white hover:shadow-lg hover:scale-105'
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  {isSubmitting ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                      送信中...
                    </div>
                  ) : (
                    '💖 ありがとうを送る'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 本音メッセージ送信モーダル */}
        {showHonestyModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
              {/* ヘッダー */}
              <div className="bg-gradient-to-r from-blue-500 to-indigo-500 px-6 py-4 text-center relative">
                <button
                  onClick={closeModals}
                  className="absolute left-4 top-4 text-white hover:bg-white/20 rounded-full p-2 transition-all duration-200"
                >
                  ✕
                </button>
                <div className="text-3xl mb-2">💭</div>
                <h2 className="text-white text-xl font-bold">本音を送る</h2>
              </div>

              <div className="p-6 space-y-6">
                {/* 宛先選択 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">宛先を選択してください</label>
                  {isLoadingUsers ? (
                    <div className="text-center py-4">
                      <div className="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
                      <p className="text-sm text-gray-500 mt-2">ユーザー一覧を読み込み中...</p>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {(users.length > 0 ? users : mockRecipients).map((recipient) => (
                        <button
                          key={recipient.id}
                          onClick={() => setSelectedRecipient(recipient.id)}
                          className={`w-full text-left p-3 rounded-xl border-2 transition-all duration-200 ${
                            selectedRecipient === recipient.id
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          <div className="font-medium text-gray-900">
                            {('email' in recipient) ? (recipient.name || recipient.email || '匿名ユーザー') : recipient.name}
                          </div>
                          <div className="text-xs text-gray-500">
                            {('email' in recipient) ? (recipient.department || 'Supabaseユーザー') : recipient.department}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* メッセージ入力 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    メッセージ <span className="text-gray-500">({message.length}/200文字)</span>
                  </label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    maxLength={200}
                    placeholder="正直な気持ちを伝えましょう..."
                    className="w-full h-32 p-4 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none resize-none transition-colors duration-200"
                  />
                </div>

                {/* 送信ボタン */}
                <button
                  onClick={() => handleSubmit('honesty')}
                  disabled={!selectedRecipient || !message.trim() || isSubmitting}
                  className={`w-full py-4 rounded-2xl font-semibold transition-all duration-200 ${
                    selectedRecipient && message.trim() && !isSubmitting
                      ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white hover:shadow-lg hover:scale-105'
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  {isSubmitting ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                      送信中...
                    </div>
                  ) : (
                    '💭 本音を送る'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* プロフィール編集モーダル */}
        <ProfileEditModal
          isOpen={showProfileModal}
          onClose={() => setShowProfileModal(false)}
          onUpdate={handleProfileUpdate}
        />
      </div>
    </div>
  );
}