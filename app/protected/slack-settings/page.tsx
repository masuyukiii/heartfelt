'use client';

import { useState, useEffect } from 'react';
import { getSlackSettings, updateSlackSettings, type SlackSettings } from '@/lib/supabase/slack-actions';

export default function SlackSettingsPage() {
  const [settings, setSettings] = useState<SlackSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState('');
  const [channel, setChannel] = useState('#general');
  const [isEnabled, setIsEnabled] = useState(true);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const result = await getSlackSettings();
      if (result) {
        setSettings(result);
        setWebhookUrl(result.webhook_url || '');
        setChannel(result.channel || '#general');
        setIsEnabled(result.is_enabled);
      }
    } catch (error) {
      console.error('Slack設定の読み込みに失敗:', error);
      setMessage({ type: 'error', text: 'Slack設定の読み込みに失敗しました' });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!webhookUrl.trim()) {
      setMessage({ type: 'error', text: 'Webhook URLは必須です' });
      return;
    }

    if (!webhookUrl.startsWith('https://hooks.slack.com/')) {
      setMessage({ type: 'error', text: '有効なSlack Webhook URLを入力してください' });
      return;
    }

    setSaving(true);
    try {
      const result = await updateSlackSettings({
        webhook_url: webhookUrl.trim(),
        channel: channel.trim() || '#general',
        is_enabled: isEnabled
      });

      if (result.success) {
        setMessage({ type: 'success', text: 'Slack設定を保存しました' });
        loadSettings();
      } else {
        setMessage({ type: 'error', text: result.error || '保存に失敗しました' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: '保存中にエラーが発生しました' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sky-50 via-blue-50 to-indigo-100">
        <div className="max-w-md mx-auto p-4 relative z-10">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-blue-50 to-indigo-100">
      <div className="max-w-md mx-auto p-4 relative z-10">
        {/* ヘッダー */}
        <div className="text-center mb-4">
          <div className="flex items-center justify-center mb-2">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center mr-2">
              <span className="text-white text-sm">⚙️</span>
            </div>
            <h1 className="text-xl font-bold text-slate-900">
              Slack設定
            </h1>
          </div>
          <p className="text-slate-600 text-xs">
            ありがとうメッセージをSlackに投稿
          </p>
        </div>

        {/* 戻るボタン */}
        <div className="text-center mb-4">
          <button
            onClick={() => window.location.href = '/protected'}
            className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-1.5 rounded-lg text-xs transition-colors"
          >
            ← 戻る
          </button>
        </div>

        {/* メッセージ */}
        {message && (
          <div className={`mb-4 p-3 rounded-lg text-xs ${
            message.type === 'success' 
              ? 'bg-green-100 text-green-700 border border-green-200' 
              : 'bg-red-100 text-red-700 border border-red-200'
          }`}>
            {message.text}
          </div>
        )}

        {/* 設定フォーム */}
        <div className="bg-white rounded-2xl shadow-lg p-4 mb-4">
          <div className="space-y-4">
            {/* 有効/無効 */}
            <div>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={isEnabled}
                  onChange={(e) => setIsEnabled(e.target.checked)}
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded"
                />
                <span className="text-sm font-medium text-gray-700">
                  Slack投稿を有効にする
                </span>
              </label>
            </div>

            {/* Webhook URL */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Slack Webhook URL
              </label>
              <input
                type="url"
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                placeholder="https://hooks.slack.com/services/..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-xs"
                disabled={!isEnabled}
              />
              <p className="text-xs text-gray-500 mt-1">
                SlackのIncoming Webhooks URLを入力してください
              </p>
            </div>

            {/* チャンネル */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                投稿先チャンネル
              </label>
              <input
                type="text"
                value={channel}
                onChange={(e) => setChannel(e.target.value)}
                placeholder="#general"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-xs"
                disabled={!isEnabled}
              />
              <p className="text-xs text-gray-500 mt-1">
                投稿するSlackチャンネルを指定してください
              </p>
            </div>
          </div>

          {/* 保存ボタン */}
          <div className="mt-6">
            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white py-2 px-4 rounded-lg text-sm font-medium transition-colors"
            >
              {saving ? '保存中...' : '設定を保存'}
            </button>
          </div>
        </div>

        {/* 説明 */}
        <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
          <h3 className="text-sm font-semibold text-blue-800 mb-2">📋 設定方法</h3>
          <div className="text-xs text-blue-700 space-y-1">
            <p>1. Slackワークスペースの管理画面を開く</p>
            <p>2. 「アプリ」→「Incoming Webhooks」を検索</p>
            <p>3. アプリを追加してWebhook URLをコピー</p>
            <p>4. このページにURLを貼り付けて保存</p>
          </div>
        </div>
      </div>
    </div>
  );
}