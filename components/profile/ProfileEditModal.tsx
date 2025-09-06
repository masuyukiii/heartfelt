"use client";

import { useState, useEffect } from 'react';
import { updateProfile, getCurrentUserProfile } from '@/lib/supabase/profile-actions';

interface ProfileEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

export default function ProfileEditModal({ isOpen, onClose, onUpdate }: ProfileEditModalProps) {
  const [name, setName] = useState('');
  const [department, setDepartment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      loadProfile();
    }
  }, [isOpen]);

  const loadProfile = async () => {
    setLoading(true);
    setError('');
    
    try {
      const profile = await getCurrentUserProfile();
      if (profile) {
        setName(profile.name || '');
        setDepartment(profile.department || '');
      }
    } catch (err) {
      setError('プロフィール情報の取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      setError('名前を入力してください');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const result = await updateProfile({
        name: name.trim(),
        department: department.trim() || undefined
      });

      if (result.success) {
        onUpdate(); // 親コンポーネントでユーザーリストを再読み込み
        onClose();
      } else {
        setError(result.error || '更新に失敗しました');
      }
    } catch (err) {
      setError('予期しないエラーが発生しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setName('');
    setDepartment('');
    setError('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* ヘッダー */}
        <div className="bg-gradient-to-r from-emerald-500 to-teal-500 px-6 py-4 text-center relative">
          <button
            onClick={handleClose}
            className="absolute left-4 top-4 text-white hover:bg-white/20 rounded-full p-2 transition-all duration-200"
            disabled={isSubmitting}
          >
            ✕
          </button>
          <div className="text-3xl mb-2">👤</div>
          <h2 className="text-white text-xl font-bold">プロフィール編集</h2>
        </div>

        <div className="p-6 space-y-6">
          {loading ? (
            <div className="text-center py-4">
              <div className="animate-spin w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full mx-auto"></div>
              <p className="text-sm text-gray-500 mt-2">読み込み中...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl">
                  {error}
                </div>
              )}

              {/* 名前入力 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  表示名 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="例：田中 太郎"
                  maxLength={50}
                  className="w-full p-4 border-2 border-gray-200 rounded-xl focus:border-emerald-500 focus:outline-none transition-colors duration-200"
                  disabled={isSubmitting}
                  required
                />
                <div className="text-xs text-gray-500 mt-1">{name.length}/50文字</div>
              </div>

              {/* 部署入力 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  部署・チーム <span className="text-gray-400">(任意)</span>
                </label>
                <input
                  type="text"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  placeholder="例：エンジニアリング部"
                  maxLength={50}
                  className="w-full p-4 border-2 border-gray-200 rounded-xl focus:border-emerald-500 focus:outline-none transition-colors duration-200"
                  disabled={isSubmitting}
                />
                <div className="text-xs text-gray-500 mt-1">{department.length}/50文字</div>
              </div>

              {/* ボタン */}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={isSubmitting}
                  className="flex-1 py-4 rounded-2xl font-semibold transition-all duration-200 bg-gray-200 text-gray-700 hover:bg-gray-300 disabled:opacity-50"
                >
                  キャンセル
                </button>
                
                <button
                  type="submit"
                  disabled={!name.trim() || isSubmitting}
                  className={`flex-1 py-4 rounded-2xl font-semibold transition-all duration-200 ${
                    name.trim() && !isSubmitting
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:shadow-lg hover:scale-105'
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  {isSubmitting ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                      更新中...
                    </div>
                  ) : (
                    '💾 保存する'
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}