'use client';

import { useState, useEffect } from 'react';
import { getUsers, type User } from '@/lib/supabase/users';
import { getReceivedMessages, markAsRead, sendMessage, type Message } from '@/lib/supabase/message-actions';
import { updateProfile, getCurrentUserProfile } from '@/lib/supabase/profile-actions';
import { saveMotivation, getAllMotivations, getMyMotivation, type Motivation } from '@/lib/supabase/motivation-actions';
import { saveTeamGoal, getTeamGoal, createDefaultTeamGoal, type TeamGoal } from '@/lib/supabase/team-goal-actions';
import { getAIFeedback, type ChatMessage } from '@/lib/claude/ai-assistant';

// 6段階成長システム関数（目標割合ベース）
function getGrowthStageIcon(totalPoints: number, targetPoints: number) {
  if (totalPoints === 0) return '🌰'; // タネ
  const percentage = (totalPoints / targetPoints) * 100;
  if (percentage <= 10) return '🌱'; // 芽
  if (percentage <= 30) return '🌿'; // 若葉
  if (percentage <= 60) return '🌲'; // 小木
  if (percentage <= 90) return '🌳'; // 木
  return '🌸'; // 花
}

function getGrowthMessage(totalPoints: number, targetPoints: number) {
  if (totalPoints === 0) return '心の種を植えましょう';
  const percentage = (totalPoints / targetPoints) * 100;
  if (percentage <= 10) return '小さな芽が出ました';
  if (percentage <= 30) return '順調に成長しています';
  if (percentage <= 60) return '立派に育っています';
  if (percentage <= 90) return 'もうすぐ目標達成です';
  return '美しく花が咲きました！\n目標達成まであとちょっと！';
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
  const [selectedRelationship, setSelectedRelationship] = useState('');
  const [finalMessage, setFinalMessage] = useState('');
  
  // AI添削機能用の状態
  const [showAIChat, setShowAIChat] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [aiInput, setAiInput] = useState('');
  const [isAIProcessing, setIsAIProcessing] = useState(false);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  
  // 受信BOX用の状態
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [messageError, setMessageError] = useState<string | null>(null);
  const [messageFilter, setMessageFilter] = useState<'unread' | 'all' | 'thanks' | 'honesty'>('all');

  // 意気込み機能の状態（初期値は空配列）
  const [motivations, setMotivations] = useState<Motivation[]>([]);
  const [myMotivation, setMyMotivation] = useState<Motivation | null>(null);
  const [isMotivationModalOpen, setIsMotivationModalOpen] = useState(false);
  const [newMotivationName, setNewMotivationName] = useState('');
  const [newMotivationContent, setNewMotivationContent] = useState('');
  const [currentMotivationIndex, setCurrentMotivationIndex] = useState(0);

  // userRewardSettingsとcurrentRewardIndexは削除（固定ゴール表示のため不要）

  // チーム共通のご褒美ゴール設定
  const [teamGoal, setTeamGoal] = useState<TeamGoal | null>(null);
  
  // 後方互換性のためのrewardGoal（計算用）
  const rewardGoal = {
    title: teamGoal?.title || 'カフェタイム',
    description: teamGoal?.description || 'お気に入りのカフェで読書',
    requiredPoints: teamGoal?.required_points || 30
  };

  // 編集用の一時状態
  const [editGoalTitle, setEditGoalTitle] = useState('');
  const [editGoalDescription, setEditGoalDescription] = useState('');
  const [editGoalPoints, setEditGoalPoints] = useState(30);

  // プロフィール情報
  const [profileData, setProfileData] = useState({
    name: 'あなたの名前',
    department: 'あなたの部署',
    bio: 'よろしくお願いします！'
  });

  // プロフィール編集用の一時状態
  const [editProfileName, setEditProfileName] = useState('');
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
    const savedPoints = localStorage.getItem('heartfelt-demo-points');
    if (savedPoints) {
      setMockData(JSON.parse(savedPoints));
    }

    // ユーザー一覧を取得
    loadUsers();
    
    // メッセージを読み込み
    loadMessages();

    // プロフィールデータをSupabaseから読み込み
    loadProfile();
    
    // 意気込みデータを読み込み
    loadMotivations();
    
    // チームゴールデータを読み込み
    loadTeamGoal();
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

  const loadProfile = async () => {
    try {
      const profile = await getCurrentUserProfile();
      if (profile) {
        setProfileData({
          name: profile.name || 'あなたの名前',
          department: profile.department || 'あなたの部署',
          bio: 'よろしくお願いします！' // bioは使っていないのでデフォルト値
        });
      }
    } catch (error) {
      console.error('Failed to load profile:', error);
    }
  };

  const loadMotivations = async () => {
    try {
      // 全員の意気込みを取得
      const allResult = await getAllMotivations();
      if (allResult.success && allResult.data) {
        setMotivations(allResult.data);
      }
      
      // 自分の意気込みを取得
      const myResult = await getMyMotivation();
      if (myResult.success) {
        setMyMotivation(myResult.data || null);
      }
    } catch (error) {
      console.error('Failed to load motivations:', error);
    }
  };

  const loadTeamGoal = async () => {
    try {
      const result = await getTeamGoal();
      if (result.success) {
        if (result.data) {
          setTeamGoal(result.data);
        } else {
          // デフォルトゴールを作成
          const defaultResult = await createDefaultTeamGoal();
          if (defaultResult.success && defaultResult.data) {
            setTeamGoal(defaultResult.data);
          }
        }
      }
    } catch (error) {
      console.error('Failed to load team goal:', error);
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

  // 意気込みを5秒ごとにランダムに切り替え
  useEffect(() => {
    if (motivations.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentMotivationIndex(prev => {
        let newIndex;
        do {
          newIndex = Math.floor(Math.random() * motivations.length);
        } while (newIndex === prev && motivations.length > 1);
        return newIndex;
      });
    }, 5000);

    return () => clearInterval(interval);
  }, [motivations]);

  // ご褒美設定のuseEffectは削除（固定表示のため不要）

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
    // モーダルを開くたびにユーザーリストを更新
    loadUsers();
  };

  const openHonestyModal = () => {
    setShowHonestyModal(true);
    setSelectedRecipient('');
    setMessage('');
    setSelectedRelationship('');
    // モーダルを開くたびにユーザーリストを更新
    loadUsers();
  };

  const closeModals = () => {
    setShowThanksModal(false);
    setShowHonestyModal(false);
    setSelectedRecipient('');
    setMessage('');
    setIsSubmitting(false);
    setSelectedRelationship('');
    setFinalMessage('');
  };

  const openGoalEditModal = () => {
    setEditGoalTitle(rewardGoal.title);
    setEditGoalDescription(rewardGoal.description || '');
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
    setEditProfileDepartment(profileData.department);
    setEditProfileBio(profileData.bio);
    setShowProfileEditModal(true);
  };

  const closeProfileEditModal = () => {
    setShowProfileEditModal(false);
    setEditProfileName('');
    setEditProfileDepartment('');
    setEditProfileBio('');
  };

  const handleSaveProfile = async () => {
    try {
      const result = await updateProfile({
        name: editProfileName || 'あなたの名前',
        department: editProfileDepartment || 'あなたの部署'
      });

      if (result.success) {
        // プロフィールデータを再読み込み
        await loadProfile();
        closeProfileEditModal();
        alert('プロフィール情報を更新しました！');
      } else {
        alert(`更新に失敗しました: ${result.error}`);
      }
    } catch (error) {
      console.error('Profile save error:', error);
      alert('プロフィール更新中にエラーが発生しました');
    }
  };

  const handleSaveGoal = async () => {
    if (!editGoalTitle.trim()) return;

    try {
      // チーム共通のゴールとして保存
      const result = await saveTeamGoal(editGoalTitle, editGoalDescription, editGoalPoints);
      
      if (result.success && result.data) {
        // ご褒美の内容（タイトル）が変更された場合のみ進捗をリセット
        const isContentChanged = rewardGoal.title !== editGoalTitle;
        
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

        // 状態を更新
        setTeamGoal(result.data);
        closeGoalEditModal();
        
        if (isContentChanged) {
          alert('ご褒美の内容を変更し、進捗を0からスタートしました！');
        } else {
          alert('ご褒美ゴールを更新しました！');
        }
      } else {
        alert(`保存に失敗しました: ${result.error}`);
      }
    } catch (error) {
      console.error('チームゴール保存中にエラー:', error);
      alert('チームゴールの保存中にエラーが発生しました');
    }
  };

  // 意気込み追加機能の処理
  const handleAddMotivation = async () => {
    if (!newMotivationContent.trim()) {
      alert('意気込みを入力してください');
      return;
    }

    try {
      const result = await saveMotivation(newMotivationContent);
      if (result.success) {
        // データを再読み込み
        await loadMotivations();
        setNewMotivationName('');
        setNewMotivationContent('');
        setIsMotivationModalOpen(false);
        alert('意気込みを保存しました！');
      } else {
        alert(`保存に失敗しました: ${result.error}`);
      }
    } catch (error) {
      console.error('意気込み保存中にエラー:', error);
      alert('意気込みの保存中にエラーが発生しました');
    }
  };

  const openMotivationModal = () => {
    setNewMotivationName(profileData.name); // プロフィール名前をデフォルトに設定
    if (myMotivation) {
      setNewMotivationContent(myMotivation.content); // 既存の意気込みを設定
    }
    setIsMotivationModalOpen(true);
  };

  // AI添削機能の処理
  const handleStartAIChat = () => {
    if (!message.trim()) {
      alert('まず、伝えたいことを入力してください');
      return;
    }
    
    setShowAIChat(true);
    setChatMessages([]);
    
    // 最初のAI応答を生成
    handleSendAIMessage(message, true);
  };

  const handleSendAIMessage = async (text: string, isInitial = false) => {
    if (!text.trim() && !isInitial) return;
    
    setIsAIProcessing(true);
    
    try {
      // 選択された受信者の情報を取得
      const recipient = selectedRecipient 
        ? (users.length > 0 ? users : mockRecipients).find(r => r.id === selectedRecipient)
        : null;
      
      const recipientInfo = recipient 
        ? { name: recipient.name || '相手', department: recipient.department || '部署' }
        : undefined;
      
      let updatedChatMessages = [...chatMessages];
      
      // 初回でない場合のみユーザーメッセージを追加
      if (!isInitial) {
        const userMessage: ChatMessage = {
          id: Date.now().toString(),
          role: 'user',
          content: text,
          timestamp: new Date()
        };
        updatedChatMessages = [...chatMessages, userMessage];
        setChatMessages(updatedChatMessages);
      }
      
      // AI応答を取得（受信者情報と関係性を渡す）
      const aiInputText = isInitial ? `「${text}」という内容を相手にポジティブに伝えたいのですが、どう表現したらよいでしょうか？` : text;
      const response = await getAIFeedback(aiInputText, chatMessages, recipientInfo, selectedRelationship);
      
      if (response.success && response.message) {
        const aiMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: response.message,
          timestamp: new Date()
        };
        
        setChatMessages([...updatedChatMessages, aiMessage]);
        
        // 【完成版】が含まれている場合、メッセージを自動更新
        if (response.message.includes('【完成版】')) {
          const finalVersionMatch = response.message.match(/【完成版】\s*(.+?)(?:\n|$)/);
          if (finalVersionMatch && finalVersionMatch[1]) {
            const finalText = finalVersionMatch[1].trim();
            setMessage(finalText);
          }
        }
      } else {
        alert(`AI応答エラー: ${response.error}`);
      }
    } catch (error) {
      console.error('AI message error:', error);
      alert('AI機能でエラーが発生しました');
    } finally {
      setIsAIProcessing(false);
    }
  };

  const closeAIChat = () => {
    setShowAIChat(false);
    setChatMessages([]);
    setAiInput('');
  };

  // メッセージをクリップボードにコピーする関数
  const copyToClipboard = async (text: string, messageId: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedMessageId(messageId);
      setTimeout(() => setCopiedMessageId(null), 2000); // 2秒後にリセット
    } catch (err) {
      console.error('コピーに失敗しました:', err);
    }
  };

  // メッセージから提案文章を抽出する関数
  const extractMessageFromAI = (content: string): string | null => {
    // ==========で囲まれたメッセージ部分を抽出（最優先）
    const equalMatch = content.match(/==========\s*([\s\S]*?)\s*==========/);
    if (equalMatch) {
      const extracted = equalMatch[1].trim();
      if (extracted.length > 5) { // ある程度の長さがある場合のみ
        return extracted;
      }
    }
    
    // 複数行対応の「」（鉤括弧）で囲まれたメッセージ部分を抽出
    const multiLineQuotedMatch = content.match(/「([\s\S]*?)」/);
    if (multiLineQuotedMatch) {
      const extracted = multiLineQuotedMatch[1].trim();
      if (extracted.length > 10) { // ある程度の長さがある場合のみ
        return extracted;
      }
    }
    
    // 単行の「」（鉤括弧）で囲まれたメッセージ部分を抽出
    const quotedMatch = content.match(/「([^」\n]+)」/);
    if (quotedMatch) return quotedMatch[1];
    
    // 『』で囲まれたメッセージ部分を抽出
    const messageMatch = content.match(/『([^』]+)』/s);
    if (messageMatch) return messageMatch[1];
    
    // ---で囲まれたメッセージ部分を抽出
    const dashMatch = content.match(/---\n([\s\S]+?)\n---/);
    if (dashMatch) return dashMatch[1].trim();
    
    // 「こんな感じで伝えてみるのはどうでしょう？」の後の段落を抽出
    const suggestionMatch = content.match(/こんな感じで伝えてみるのはどうでしょう[？?]\s*\n\s*(.+?)(?:\n\n|$)/s);
    if (suggestionMatch) return suggestionMatch[1].trim();
    
    return null;
  };

  const handleSubmit = async (type: 'thanks' | 'honesty') => {
    // 本音の場合はfinalMessage、ありがとうの場合はmessageを使用
    const messageContent = type === 'honesty' ? finalMessage : message;
    if (!selectedRecipient || !messageContent.trim()) return;
    
    setIsSubmitting(true);
    
    try {
      // 実際のSupabaseにメッセージを送信
      const result = await sendMessage({
        recipientId: selectedRecipient,
        type: type,
        content: messageContent.trim()
      });
      
      if (result.success) {
        // ポイント追加
        addPoints(type);
        
        // 成功メッセージとモーダル閉じる
        setIsSubmitting(false);
        closeModals();
        
        // 成功通知
        alert(`${type === 'thanks' ? 'ありがとう' : '本音'}メッセージを送信しました！`);
        
        // メッセージリストを更新
        loadMessages();
      } else {
        // エラー処理
        setIsSubmitting(false);
        alert(`送信に失敗しました: ${result.error}`);
      }
    } catch (error) {
      console.error('Message send error:', error);
      setIsSubmitting(false);
      alert('メッセージ送信中にエラーが発生しました');
    }
  };

  // 受信BOXビューの場合
  if (viewMode === 'inbox') {
    const unreadCount = messages.filter(msg => !msg.is_read).length;
    const thanksCount = messages.filter(m => m.type === 'thanks').length;
    const honestyCount = messages.filter(m => m.type === 'honesty').length;

    // フィルタリングされたメッセージ
    const filteredMessages = messages.filter(message => {
      if (messageFilter === 'all') return true;
      if (messageFilter === 'unread') return !message.is_read;
      return message.type === messageFilter;
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

          {/* ダッシュボードに戻るボタン */}
          <div className="text-center">
            <button
              onClick={() => setViewMode('dashboard')}
              className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-lg font-semibold transition-colors text-sm"
            >
              ← ダッシュボードに戻る
            </button>
          </div>

          {/* フィルタータブ */}
          <div className="flex bg-white rounded-lg p-1 shadow-sm">
            <button
              onClick={() => setMessageFilter('unread')}
              className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                messageFilter === 'unread'
                  ? 'bg-red-500 text-white'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              🔴 未読 ({unreadCount})
            </button>
            <button
              onClick={() => setMessageFilter('all')}
              className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                messageFilter === 'all'
                  ? 'bg-purple-500 text-white'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              すべて ({messages.length})
            </button>
            <button
              onClick={() => setMessageFilter('thanks')}
              className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                messageFilter === 'thanks'
                  ? 'bg-green-500 text-white'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              💚 ありがとう ({thanksCount})
            </button>
            <button
              onClick={() => setMessageFilter('honesty')}
              className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                messageFilter === 'honesty'
                  ? 'bg-blue-500 text-white'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              💭 本音 ({honestyCount})
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
          ) : filteredMessages.length === 0 ? (
            <div className="bg-gray-100 rounded-lg p-8 text-center">
              <div className="text-4xl mb-4">📭</div>
              <p className="text-gray-600">
                {messageFilter === 'all' ? 'まだメッセージがありません' : 
                 messageFilter === 'unread' ? '未読メッセージがありません' :
                 messageFilter === 'thanks' ? 'ありがとうメッセージがありません' : 
                 '本音メッセージがありません'}
              </p>
              <p className="text-gray-500 text-sm mt-2">
                {messageFilter === 'all' ? 'メッセージを送信してみてください' : 
                 messageFilter === 'unread' ? '新しいメッセージが届くのをお待ちください' :
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
      <style jsx global>{`
        @keyframes fadeIn {
          0% { opacity: 0; transform: translateY(10px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .motivation-fade-in {
          animation: fadeIn 1s ease-in-out;
        }
      `}</style>
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
          <div className="bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-3 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-white/10"></div>
            <div className="absolute top-2 right-2 flex space-x-1">
              <button
                onClick={openProfileEditModal}
                className="text-white hover:bg-white/30 hover:scale-110 rounded-full p-3 transition-all duration-200 cursor-pointer select-none"
                title="プロフィールを編集"
              >
                <span className="text-lg">👤</span>
              </button>
              <button
                onClick={openGoalEditModal}
                className="text-white hover:bg-white/30 hover:scale-110 rounded-full p-3 transition-all duration-200 cursor-pointer select-none"
                title="ご褒美ゴールを編集"
              >
                <span className="text-lg">✏️</span>
              </button>
            </div>
            <div className="relative z-10">
              <div className="inline-flex items-center justify-center w-8 h-8 bg-white/20 rounded-full mb-1">
                <span className="text-lg">🎯</span>
              </div>
              <h1 className="text-white text-lg font-bold tracking-wide">
                ご褒美ゴール：{rewardGoal.title}
              </h1>
              {motivations.length > 0 && (
                <div key={currentMotivationIndex} className="motivation-fade-in mt-2">
                  <p className="text-emerald-100 text-sm">
                    {motivations[currentMotivationIndex]?.user_name}：{motivations[currentMotivationIndex]?.content}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* 進捗エリア */}
          <div className="px-4 py-3 bg-gradient-to-b from-white to-gray-50">
            
            {/* 進捗バー */}
            <div className="mb-3">
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
            <div className="text-center mb-3">
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
            <div className="bg-gradient-to-b from-sky-50 to-emerald-50 rounded-xl p-3 mb-2 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-white/50 to-transparent"></div>
              <div className="relative z-10 text-center">
                <div className="text-3xl mb-1 filter drop-shadow-lg animate-pulse">
                  {getGrowthStageIcon(totalPoints, rewardGoal.requiredPoints)}
                </div>
                <p className="text-emerald-700 font-medium text-xs whitespace-pre-line mb-1">
                  {getGrowthMessage(totalPoints, rewardGoal.requiredPoints)}
                </p>
                <div className="inline-flex items-center bg-white/60 backdrop-blur-sm px-2 py-1 rounded-full mb-1">
                  <span className="text-xs text-gray-600">現在 {totalPoints} ポイント</span>
                </div>
                
                {/* ポイント詳細（植物エリア内に統合） */}
                <div className="grid grid-cols-2 gap-2 mt-1">
                  <div className="bg-white/40 backdrop-blur-sm rounded-lg p-2 text-center border border-pink-200/50">
                    <div className="text-sm mb-1">💖</div>
                    <div className="text-sm font-bold text-pink-600">{mockData.thanksPoints}</div>
                    <div className="text-xs text-pink-700">ありがとう</div>
                  </div>
                  <div className="bg-white/40 backdrop-blur-sm rounded-lg p-2 text-center border border-blue-200/50">
                    <div className="text-sm mb-1">💭</div>
                    <div className="text-sm font-bold text-blue-600">{mockData.honestyPoints}</div>
                    <div className="text-xs text-blue-700">本音</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* アクションボタン */}
          <div className="p-3 bg-gray-50">
            <div className="grid grid-cols-2 gap-3 mb-3">
              <button 
                onClick={openThanksModal}
                className="group bg-gradient-to-r from-pink-500 to-rose-500 text-white p-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 active:scale-95"
              >
                <div className="text-2xl mb-2 group-hover:scale-110 transition-transform duration-200">💖</div>
                <div className="text-sm font-semibold">ありがとう<br />を送る</div>
              </button>
              
              <button 
                onClick={openHonestyModal}
                className="group bg-gradient-to-r from-blue-500 to-indigo-500 text-white p-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 active:scale-95"
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

                {/* 関係性選択 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    相手との関係性
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'boss', label: '上司', emoji: '👔' },
                      { id: 'colleague', label: '同僚', emoji: '🤝' },
                      { id: 'subordinate', label: '部下', emoji: '🌱' },
                      { id: 'lover', label: '恋人', emoji: '💕' },
                      { id: 'friend', label: '友人', emoji: '😊' },
                      { id: 'family', label: '家族', emoji: '👨‍👩‍👧‍👦' }
                    ].map((relationship) => (
                      <button
                        key={relationship.id}
                        onClick={() => setSelectedRelationship(relationship.id)}
                        className={`p-3 rounded-lg border-2 transition-all duration-200 text-center ${
                          selectedRelationship === relationship.id
                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                            : 'border-gray-200 bg-white text-gray-600 hover:border-blue-300'
                        }`}
                      >
                        <div className="text-lg mb-1">{relationship.emoji}</div>
                        <div className="text-xs font-medium">{relationship.label}</div>
                      </button>
                    ))}
                  </div>
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
                    placeholder="正直な気持ちをそのままぶつけてみましょう..."
                    className="w-full h-32 p-4 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none resize-none transition-colors duration-200"
                  />
                </div>

                {/* AI先生相談ボタン */}
                <div className="border-t pt-4">
                  <button
                    onClick={handleStartAIChat}
                    disabled={!message.trim()}
                    className={`w-full py-3 rounded-xl font-semibold transition-all duration-200 ${
                      message.trim()
                        ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:shadow-lg hover:scale-105'
                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    🤖 AI先生に本音をぶつけてみる
                  </button>
                </div>

                {/* AI チャットUI */}
                {showAIChat && (
                  <div className="border-2 border-gray-300 rounded-xl p-4 bg-white shadow-md">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-bold text-gray-800">💬 AI先生に本音をぶつけてみる</h3>
                      <button 
                        onClick={closeAIChat}
                        className="text-gray-500 hover:bg-gray-100 rounded-full p-1"
                      >
                        ✕
                      </button>
                    </div>
                    
                    {/* チャット履歴 */}
                    <div className="max-h-60 overflow-y-auto mb-4 space-y-3">
                      {chatMessages.map((msg) => (
                        <div
                          key={msg.id}
                          className={`p-3 rounded-lg ${
                            msg.role === 'user'
                              ? 'bg-blue-50 border border-blue-200 ml-4'
                              : 'bg-gray-50 border border-gray-200 mr-4'
                          }`}
                        >
                          <div className="flex items-start space-x-2">
                            <span className="text-sm">
                              {msg.role === 'user' ? '👤' : '🤖'}
                            </span>
                            <div className="flex-1">
                              <p className="text-sm text-gray-800 whitespace-pre-wrap">{msg.content}</p>
                              {msg.role === 'assistant' && extractMessageFromAI(msg.content) && (
                                <div className="mt-3 pt-2 border-t border-gray-200">
                                  <button
                                    onClick={() => {
                                      const extractedMessage = extractMessageFromAI(msg.content);
                                      if (extractedMessage) {
                                        copyToClipboard(extractedMessage, msg.id);
                                        setFinalMessage(extractedMessage); // 実際の送信欄にも自動入力
                                      }
                                    }}
                                    className={`px-3 py-1 text-xs rounded-full transition-all duration-200 ${
                                      copiedMessageId === msg.id
                                        ? 'bg-green-100 text-green-700 border border-green-300'
                                        : 'bg-blue-100 text-blue-700 border border-blue-300 hover:bg-blue-200'
                                    }`}
                                  >
                                    {copiedMessageId === msg.id ? '✓ コピー完了!' : '📋 メッセージをコピー'}
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                      {isAIProcessing && (
                        <div className="bg-gray-50 border border-gray-200 mr-4 p-3 rounded-lg">
                          <div className="flex items-center space-x-2">
                            <span className="text-sm">🤖</span>
                            <div className="flex space-x-1">
                              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* チャット入力 */}
                    <div className="flex space-x-2">
                      <textarea
                        value={aiInput}
                        onChange={(e) => setAiInput(e.target.value)}
                        placeholder="追加の質問や要望があればどうぞ..."
                        className="flex-1 p-3 border border-blue-200 rounded-lg focus:border-blue-400 focus:outline-none text-gray-800 bg-blue-50 placeholder-gray-500 resize-none min-h-[80px]"
                        rows={3}
                      />
                      <button
                        onClick={() => {
                          handleSendAIMessage(aiInput);
                          setAiInput('');
                        }}
                        disabled={!aiInput.trim() || isAIProcessing}
                        className={`px-4 py-2 rounded-lg font-semibold ${
                          aiInput.trim() && !isAIProcessing
                            ? 'bg-blue-500 text-white hover:bg-blue-600'
                            : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        }`}
                      >
                        送信
                      </button>
                    </div>
                  </div>
                )}

                {/* 実際の送信メッセージ */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    実際に送信するメッセージ <span className="text-gray-500">({finalMessage.length}/500文字)</span>
                  </label>
                  <textarea
                    value={finalMessage}
                    onChange={(e) => setFinalMessage(e.target.value)}
                    maxLength={500}
                    placeholder="AI先生のアドバイスを参考に、ここに実際に送信するメッセージを入力してください..."
                    className="w-full h-32 p-4 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none resize-none transition-colors duration-200"
                  />
                </div>

                {/* 送信ボタン */}
                <button
                  onClick={() => handleSubmit('honesty')}
                  disabled={!selectedRecipient || !finalMessage.trim() || isSubmitting}
                  className={`w-full py-4 rounded-2xl font-semibold transition-all duration-200 ${
                    selectedRecipient && finalMessage.trim() && !isSubmitting
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
                    placeholder="例：ちょっと豪華なランチ"
                    maxLength={50}
                    className="w-full p-4 border-2 border-gray-200 rounded-xl focus:border-emerald-500 focus:outline-none transition-colors duration-200"
                  />
                  <div className="flex justify-between items-center mt-1">
                    <div className="text-xs text-gray-500">{editGoalTitle.length}/50文字</div>
                    {teamGoal && (
                      <div className="text-xs text-gray-400">
                        最終更新：{teamGoal.updated_by_name}（{new Date(teamGoal.updated_at).toLocaleDateString('ja-JP', { month: 'numeric', day: 'numeric' })}）
                      </div>
                    )}
                  </div>
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

                {/* 自分の意気込み */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    💪 自分の意気込み
                  </label>
                  {myMotivation && (
                    <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-4 mb-3 text-center">
                      <p className="text-sm text-gray-700">
                        {myMotivation.content}
                      </p>
                    </div>
                  )}
                  <button 
                    className="w-full py-3 px-4 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-600 rounded-xl transition-colors text-sm"
                    onClick={openMotivationModal}
                  >
                    + 意気込みを{myMotivation ? '変更' : '追加'}する
                  </button>
                </div>

                {/* プリセットボタン */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">ご褒美ゴール例</label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { title: 'ちょっと豪華なランチ', desc: '美味しいランチでリフレッシュ', points: 30 },
                      { title: '美味しいディナー', desc: '行きたかったレストランで', points: 50 },
                      { title: 'スパでリラックス', desc: 'マッサージで疲れをリセット', points: 70 },
                      { title: '憧れの場所へ特別な旅行', desc: '憧れの場所へ特別な旅', points: 100 }
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

        {/* 意気込み追加モーダル */}
        {isMotivationModalOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-6 w-full max-w-md space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-gray-800">
                  💪 意気込みを追加
                </h3>
                <button
                  onClick={() => setIsMotivationModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    お名前
                  </label>
                  <input
                    type="text"
                    value={newMotivationName}
                    onChange={(e) => setNewMotivationName(e.target.value)}
                    placeholder="あなたの名前"
                    className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    意気込み
                  </label>
                  <textarea
                    value={newMotivationContent}
                    onChange={(e) => setNewMotivationContent(e.target.value)}
                    placeholder="例：今月こそは目標達成するぞ！"
                    maxLength={100}
                    rows={3}
                    className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none resize-none transition-colors"
                  />
                  <div className="text-xs text-gray-500 mt-1">{newMotivationContent.length}/100文字</div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setIsMotivationModalOpen(false)}
                  className="flex-1 py-3 px-4 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  キャンセル
                </button>
                <button
                  onClick={handleAddMotivation}
                  disabled={!newMotivationContent.trim()}
                  className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-all ${
                    newMotivationContent.trim()
                      ? 'bg-blue-500 text-white hover:bg-blue-600'
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  追加
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}