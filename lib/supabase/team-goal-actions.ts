import { createClient } from '@/lib/supabase/client';
import { getCurrentUserProfile } from './profile-actions';

export interface TeamGoal {
  id: string;
  title: string;
  description?: string;
  required_points: number;
  updated_by_user_id?: string;
  updated_by_name: string;
  created_at: string;
  updated_at: string;
}

// チーム共通のご褒美ゴールを保存/更新する関数
export async function saveTeamGoal(
  title: string,
  description: string,
  requiredPoints: number
): Promise<{ success: boolean; error?: string; data?: TeamGoal }> {
  try {
    const supabase = createClient();
    
    // 現在のユーザー情報を取得
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return { success: false, error: 'ユーザーが見つかりません' };
    }

    // プロフィール情報を取得してユーザー名を設定
    const profile = await getCurrentUserProfile();
    const userName = profile?.name || user.email || 'Anonymous';

    // 既存のチームゴールを全て削除（常に1つだけ保持）
    await supabase.from('team_goals').delete().neq('id', '00000000-0000-0000-0000-000000000000');

    // 新しいチームゴールを挿入
    const { data, error } = await supabase
      .from('team_goals')
      .insert({
        title: title.trim(),
        description: description.trim() || null,
        required_points: requiredPoints,
        updated_by_user_id: user.id,
        updated_by_name: userName
      })
      .select()
      .single();

    if (error) {
      console.error('チームゴール保存エラー:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (error) {
    console.error('チームゴール保存中にエラーが発生:', error);
    return { success: false, error: 'チームゴールの保存中にエラーが発生しました' };
  }
}

// チーム共通のご褒美ゴールを取得する関数
export async function getTeamGoal(): Promise<{ success: boolean; error?: string; data?: TeamGoal }> {
  try {
    const supabase = createClient();

    const { data, error } = await supabase
      .from('team_goals')
      .select('*')
      .order('updated_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
      console.error('チームゴール取得エラー:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data: data || undefined };
  } catch (error) {
    console.error('チームゴール取得中にエラーが発生:', error);
    return { success: false, error: 'チームゴールの取得中にエラーが発生しました' };
  }
}

// デフォルトのチームゴールを作成する関数
export async function createDefaultTeamGoal(): Promise<{ success: boolean; error?: string; data?: TeamGoal }> {
  try {
    // 既存のゴールがあるかチェック
    const existing = await getTeamGoal();
    if (existing.success && existing.data) {
      return existing;
    }

    // デフォルトゴールを作成
    return await saveTeamGoal(
      'カフェタイム',
      'お気に入りのカフェで読書',
      30
    );
  } catch (error) {
    console.error('デフォルトチームゴール作成中にエラーが発生:', error);
    return { success: false, error: 'デフォルトチームゴールの作成中にエラーが発生しました' };
  }
}