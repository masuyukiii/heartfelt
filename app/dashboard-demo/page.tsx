'use client';

import { useState, useEffect } from 'react';
import { getUsers, type User } from '@/lib/supabase/users';
import { getReceivedMessages, markAsRead, type Message } from '@/lib/supabase/message-actions';

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

type ViewMode = 'dashboard' | 'inbox';

export default function DashboardDemoPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('dashboard');
  const [mockData, setMockData] = useState({
    thanksPoints: 12,
    honestyPoints: 8,
  });
  const [showCelebration, setShowCelebration] = useState(false);
  const [showThanksModal, setShowThanksModal] = useState(false);
  const [showHonestyModal, setShowHonestyModal] = useState(false);
  const [showGoalEditModal, setShowGoalEditModal] = useState(false);
  const [showProfileEditModal, setShowProfileEditModal] = useState(false);
  const [selectedRecipient, setSelectedRecipient] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // 受信BOX用の状態
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [messageError, setMessageError] = useState<string | null>(null);

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

  // プロフィール情報
  const [profileData, setProfileData] = useState({
    name: 'あなたの名前',
    email: 'your.email@example.com',
    department: 'あなたの部署',
    bio: 'よろしくお願いします！'
  });

  // プロフィール編集用の一時状態
  const [editProfileName, setEditProfileName] = useState('');
  const [editProfileEmail, setEditProfileEmail] = useState('');
  const [editProfileDepartment, setEditProfileDepartment] = useState('');
  const [editProfileBio, setEditProfileBio] = useState('');

  const totalPoints = mockData.thanksPoints + mockData.honestyPoints;
  const remainingPoints = Math.max(rewardGoal.requiredPoints - totalPoints, 0);
  const progressPercentage = Math.min((totalPoints / rewardGoal.requiredPoints) * 100, 100);

  const [users, setUsers] = useState<User[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  
  // デモ用のフォールバック受信者リスト
  const mockRecipients = [
    { id: '1', name: '田中さん', department: 'マーケティング部' },
    { id: '2', name: '佐藤さん', department: 'エンジニアリング部' },
    { id: '3', name: '山田さん', department: 'デザイン部' },
    { id: '4', name: '鈴木さん', department: '営業部' },
    { id: '5', name: '高橋さん', department: 'HR部' },
  ];

  // ページロード時にゴール設定とポイントデータを読み込み
  useEffect(() => {
    const savedGoal = localStorage.getItem('heartfelt-reward-goal');
    if (savedGoal) {
      setRewardGoal(JSON.parse(savedGoal));
    }

    const savedPoints = localStorage.getItem('heartfelt-demo-points');
    if (savedPoints) {
      setMockData(JSON.parse(savedPoints));
    }

    // ユーザー一覧を取得
    loadUsers();
    
    // メッセージを読み込み
    loadMessages();

    // プロフィールデータを読み込み
    const savedProfile = localStorage.getItem('heartfelt-profile-data');
    if (savedProfile) {
      setProfileData(JSON.parse(savedProfile));
    }
  }, []);

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

  const loadMessages = async () => {
    setIsLoadingMessages(true);
    setMessageError(null);
    try {
      const realMessages = await getReceivedMessages();
      setMessages(realMessages);
    } catch (error) {
      console.error('Failed to load messages:', error);
      setMessageError('メッセージの読み込みに失敗しました');
    } finally {
      setIsLoadingMessages(false);
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

  const openProfileEditModal = () => {
    setEditProfileName(profileData.name);
    setEditProfileEmail(profileData.email);
    setEditProfileDepartment(profileData.department);
    setEditProfileBio(profileData.bio);
    setShowProfileEditModal(true);
  };

  const closeProfileEditModal = () => {
    setShowProfileEditModal(false);
    setEditProfileName('');
    setEditProfileEmail('');
    setEditProfileDepartment('');
    setEditProfileBio('');
  };

  const handleSaveProfile = () => {
    const newProfile = {
      name: editProfileName || 'あなたの名前',
      email: editProfileEmail || 'your.email@example.com',
      department: editProfileDepartment || 'あなたの部署',
      bio: editProfileBio || 'よろしくお願いします！'
    };

    setProfileData(newProfile);
    localStorage.setItem('heartfelt-profile-data', JSON.stringify(newProfile));
    closeProfileEditModal();
    alert('プロフィール情報を更新しました！');
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
    
    // 送信シミュレーション
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // 送信したメッセージに対する返信を受信ボックスに追加（自分宛）
    const recipients = users.length > 0 ? users : mockRecipients;
    const selectedRecipientData = recipients.find(r => r.id === selectedRecipient);
    if (selectedRecipientData) {
      // 送信したメッセージに対する自動返信を生成
      const recipientName = ('email' in selectedRecipientData) 
        ? (selectedRecipientData.name || selectedRecipientData.email || '匿名ユーザー')
        : selectedRecipientData.name;
      const replyMessage = generateAutoReply(type, recipientName, message);
      
      const newMessage = {
        id: Date.now().toString(),
        type: type,
        sender: recipientName,
        content: replyMessage,
        receivedAt: '今',
        isRead: false
      };
      
      // 既存のメッセージを取得
      const existingMessages = JSON.parse(localStorage.getItem('heartfelt-inbox-messages') || '[]');
      
      // 新しいメッセージを先頭に追加
      const updatedMessages = [newMessage, ...existingMessages];
      
      // ローカルストレージに保存
      localStorage.setItem('heartfelt-inbox-messages', JSON.stringify(updatedMessages));
    }
    
    // ポイント追加
    addPoints(type);
    
    // 成功メッセージとモーダル閉じる
    setIsSubmitting(false);
    closeModals();
    
    // 簡単な成功通知
    alert(`${type === 'thanks' ? 'ありがとう' : '本音'}メッセージを送信しました！\n受信BOXで確認できます。`);
    
    // メッセージリストを更新
    loadMessages();
  };

  // 受信BOXビューの場合
  if (viewMode === 'inbox') {
    const unreadCount = messages.filter(msg => !msg.is_read).length;
    const thanksCount = messages.filter(m => m.type === 'thanks').length;
    const honestyCount = messages.filter(m => m.type === 'honesty').length;

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

          {/* ダッシュボードに戻るボタン */}
          <div className="text-center">
            <button
              onClick={() => setViewMode('dashboard')}
              className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-lg font-semibold transition-colors text-sm"
            >
              ← ダッシュボードに戻る
            </button>
          </div>

          {/* エラー表示 */}
          {messageError && (
            <div className="bg-red-100 border-l-4 border-red-500 p-4">
              <p className="text-sm text-red-700">{messageError}</p>
              <button 
                onClick={loadMessages}
                className="mt-2 text-xs bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600"
              >
                再試行
              </button>
            </div>
          )}

          {/* メッセージリスト */}
          {isLoadingMessages ? (
            <div className="text-center py-8">
              <div className="animate-spin w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full mx-auto"></div>
              <p className="text-sm text-gray-500 mt-3">メッセージを読み込み中...</p>
            </div>
          ) : messages.length === 0 ? (
            <div className="bg-gray-100 rounded-lg p-8 text-center">
              <div className="text-4xl mb-4">📭</div>
              <p className="text-gray-600">まだメッセージがありません</p>
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
                  } ${!message.is_read ? 'ring-2 ring-purple-200 shadow-lg' : ''}`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-lg">
                        {message.type === 'thanks' ? '💚' : '💭'}
                      </span>
                      <div>
                        <span className="font-semibold text-gray-800">
                          {message.sender_name || 'Anonymous'}
                        </span>
                        <span className="text-sm text-gray-500 ml-2">
                          {message.type === 'thanks' ? 'ありがとうメッセージ' : '本音メッセージ'}
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

          {/* リフレッシュボタン */}
          <div className="text-center">
            <button
              onClick={loadMessages}
              className="bg-purple-500 hover:bg-purple-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              🔄 メッセージを更新
            </button>
          </div>
        </div>
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
        {/* デモコントロール */}
        <div className="mb-4 bg-white/80 backdrop-blur-sm rounded-2xl p-3 shadow-sm">
          <div className="flex gap-2 justify-center">
            <button 
              onClick={() => addPoints('thanks')} 
              className="text-xs bg-gradient-to-r from-pink-500 to-rose-500 text-white px-3 py-1.5 rounded-full hover:shadow-md transition-all duration-200 hover:scale-105"
            >
              💖 +1
            </button>
            <button 
              onClick={() => addPoints('honesty')} 
              className="text-xs bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-3 py-1.5 rounded-full hover:shadow-md transition-all duration-200 hover:scale-105"
            >
              💭 +1
            </button>
            <button 
              onClick={resetPoints} 
              className="text-xs bg-gradient-to-r from-gray-400 to-gray-500 text-white px-3 py-1.5 rounded-full hover:shadow-md transition-all duration-200 hover:scale-105"
            >
              リセット
            </button>
          </div>
        </div>

        {/* メインカード */}
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
          
          {/* ヘッダー - ご褒美ゴール */}
          <div className="bg-gradient-to-r from-emerald-500 to-teal-500 px-6 py-8 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-white/10"></div>
            <div className="absolute top-4 right-4 flex space-x-2">
              <button
                onClick={openProfileEditModal}
                className="text-white hover:bg-white/20 rounded-full p-2 transition-all duration-200"
                title="プロフィールを編集"
              >
                👤
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
              <button 
                onClick={() => setViewMode('inbox')}
                className="group w-full bg-white border-2 border-gray-200 text-gray-700 p-4 rounded-2xl hover:border-purple-300 hover:bg-purple-50 transition-all duration-200 hover:scale-105 active:scale-95"
              >
                <div className="text-2xl mb-2 group-hover:scale-110 transition-transform duration-200">📫</div>
                <div className="text-sm font-semibold">受信<br />BOX</div>
                {messages.filter(m => !m.is_read).length > 0 && (
                  <div className="text-xs bg-red-500 text-white px-2 py-1 rounded-full mt-1">
                    {messages.filter(m => !m.is_read).length}件未読
                  </div>
                )}
              </button>
              
              <button className="group w-full bg-white border-2 border-gray-200 text-gray-400 p-4 rounded-2xl cursor-not-allowed">
                <div className="text-2xl mb-2">📚</div>
                <div className="text-sm font-medium">ことば<br />ライブラリ</div>
                <div className="text-xs text-gray-400 mt-1">準備中</div>
              </button>
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
        {showProfileEditModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
              {/* ヘッダー */}
              <div className="bg-gradient-to-r from-gray-600 to-gray-700 px-6 py-4 text-center relative">
                <button
                  onClick={closeProfileEditModal}
                  className="absolute left-4 top-4 text-white hover:bg-white/20 rounded-full p-2 transition-all duration-200"
                >
                  ✕
                </button>
                <div className="text-3xl mb-2">👤</div>
                <h2 className="text-white text-xl font-bold">プロフィール編集</h2>
              </div>

              <div className="p-6 space-y-6">
                {/* 名前 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">お名前</label>
                  <input
                    type="text"
                    value={editProfileName}
                    onChange={(e) => setEditProfileName(e.target.value)}
                    placeholder="あなたの名前"
                    maxLength={50}
                    className="w-full p-4 border-2 border-gray-200 rounded-xl focus:border-gray-500 focus:outline-none transition-colors duration-200"
                  />
                </div>

                {/* メールアドレス */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">メールアドレス</label>
                  <input
                    type="email"
                    value={editProfileEmail}
                    onChange={(e) => setEditProfileEmail(e.target.value)}
                    placeholder="your.email@example.com"
                    maxLength={100}
                    className="w-full p-4 border-2 border-gray-200 rounded-xl focus:border-gray-500 focus:outline-none transition-colors duration-200"
                  />
                </div>

                {/* 部署 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">部署</label>
                  <input
                    type="text"
                    value={editProfileDepartment}
                    onChange={(e) => setEditProfileDepartment(e.target.value)}
                    placeholder="あなたの部署"
                    maxLength={50}
                    className="w-full p-4 border-2 border-gray-200 rounded-xl focus:border-gray-500 focus:outline-none transition-colors duration-200"
                  />
                </div>

                {/* 自己紹介 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">自己紹介</label>
                  <textarea
                    value={editProfileBio}
                    onChange={(e) => setEditProfileBio(e.target.value)}
                    placeholder="よろしくお願いします！"
                    maxLength={200}
                    rows={4}
                    className="w-full p-4 border-2 border-gray-200 rounded-xl focus:border-gray-500 focus:outline-none resize-none transition-colors duration-200"
                  />
                  <div className="text-xs text-gray-500 mt-1">{editProfileBio.length}/200文字</div>
                </div>

                {/* 保存ボタン */}
                <button
                  onClick={handleSaveProfile}
                  className="w-full py-4 rounded-2xl font-semibold bg-gradient-to-r from-gray-600 to-gray-700 text-white hover:shadow-lg hover:scale-105 transition-all duration-200"
                >
                  👤 プロフィールを保存
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ご褒美ゴール編集モーダル */}
        {showGoalEditModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
              {/* ヘッダー */}
              <div className="bg-gradient-to-r from-emerald-500 to-teal-500 px-6 py-4 text-center relative">
                <button
                  onClick={closeGoalEditModal}
                  className="absolute left-4 top-4 text-white hover:bg-white/20 rounded-full p-2 transition-all duration-200"
                >
                  ✕
                </button>
                <div className="text-3xl mb-2">🎯</div>
                <h2 className="text-white text-xl font-bold">ご褒美ゴール設定</h2>
              </div>

              <div className="p-6 space-y-6">
                {/* ゴールタイトル */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">ご褒美の内容</label>
                  <input
                    type="text"
                    value={editGoalTitle}
                    onChange={(e) => setEditGoalTitle(e.target.value)}
                    placeholder="例：カフェで読書タイム"
                    maxLength={50}
                    className="w-full p-4 border-2 border-gray-200 rounded-xl focus:border-emerald-500 focus:outline-none transition-colors duration-200"
                  />
                  <div className="text-xs text-gray-500 mt-1">{editGoalTitle.length}/50文字</div>
                </div>

                {/* ゴール説明 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">詳細説明（任意）</label>
                  <textarea
                    value={editGoalDescription}
                    onChange={(e) => setEditGoalDescription(e.target.value)}
                    placeholder="例：お気に入りのカフェでゆっくり読書を楽しむ"
                    maxLength={100}
                    rows={3}
                    className="w-full p-4 border-2 border-gray-200 rounded-xl focus:border-emerald-500 focus:outline-none resize-none transition-colors duration-200"
                  />
                  <div className="text-xs text-gray-500 mt-1">{editGoalDescription.length}/100文字</div>
                </div>

                {/* 必要ポイント数 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">必要ポイント数</label>
                  <div className="flex items-center space-x-4">
                    <input
                      type="range"
                      min="10"
                      max="100"
                      step="5"
                      value={editGoalPoints}
                      onChange={(e) => setEditGoalPoints(Number(e.target.value))}
                      className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider-emerald"
                    />
                    <div className="bg-emerald-100 text-emerald-800 px-4 py-2 rounded-lg font-bold min-w-[80px] text-center">
                      {editGoalPoints}pt
                    </div>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    現在のポイント: {totalPoints}pt（あと{Math.max(editGoalPoints - totalPoints, 0)}pt で達成）
                  </div>
                  {rewardGoal.title !== editGoalTitle && totalPoints > 0 && (
                    <div className="text-xs text-orange-600 bg-orange-50 p-2 rounded mt-2">
                      ⚠️ ご褒美の内容を変更すると現在の進捗（{totalPoints}pt）がリセットされます
                    </div>
                  )}
                  {rewardGoal.requiredPoints !== editGoalPoints && rewardGoal.title === editGoalTitle && (
                    <div className="text-xs text-blue-600 bg-blue-50 p-2 rounded mt-2">
                      ℹ️ 必要ポイント数のみ変更は進捗をリセットしません
                    </div>
                  )}
                </div>

                {/* プリセットボタン */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">プリセット例</label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { title: 'カフェタイム', desc: 'お気に入りのカフェで読書', points: 30 },
                      { title: '映画鑑賞', desc: '気になっていた映画を見る', points: 25 },
                      { title: 'スパでリラックス', desc: 'マッサージで疲れをリセット', points: 50 },
                      { title: '美味しいディナー', desc: '行きたかったレストランで', points: 40 }
                    ].map((preset, index) => (
                      <button
                        key={index}
                        onClick={() => {
                          setEditGoalTitle(preset.title);
                          setEditGoalDescription(preset.desc);
                          setEditGoalPoints(preset.points);
                        }}
                        className="text-left p-3 border border-gray-200 rounded-lg hover:border-emerald-300 hover:bg-emerald-50 transition-colors duration-200"
                      >
                        <div className="text-sm font-medium text-gray-800">{preset.title}</div>
                        <div className="text-xs text-gray-500">{preset.points}pt</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 保存ボタン */}
                <button
                  onClick={handleSaveGoal}
                  disabled={!editGoalTitle.trim()}
                  className={`w-full py-4 rounded-2xl font-semibold transition-all duration-200 ${
                    editGoalTitle.trim()
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:shadow-lg hover:scale-105'
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  🎯 ご褒美ゴールを保存
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}