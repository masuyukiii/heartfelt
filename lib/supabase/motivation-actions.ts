import { createClient } from '@/lib/supabase/client';
import { getCurrentUserProfile } from './profile-actions';

export interface Motivation {
  id: string;
  user_id: string;
  user_name: string;
  content: string;
  created_at: string;
  updated_at: string;
}

// 意気込みを追加/更新する関数
export async function saveMotivation(content: string): Promise<{ success: boolean; error?: string; data?: Motivation }> {
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

    // 既存の意気込みを削除（1人1つまで）
    await supabase
      .from('motivations')
      .delete()
      .eq('user_id', user.id);

    // 新しい意気込みを挿入
    const { data, error } = await supabase
      .from('motivations')
      .insert({
        user_id: user.id,
        user_name: userName,
        content: content.trim()
      })
      .select()
      .single();

    if (error) {
      console.error('意気込み保存エラー:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (error) {
    console.error('意気込み保存中にエラーが発生:', error);
    return { success: false, error: '意気込みの保存中にエラーが発生しました' };
  }
}

// 全ユーザーの意気込みを取得する関数
export async function getAllMotivations(): Promise<{ success: boolean; error?: string; data?: Motivation[] }> {
  try {
    const supabase = createClient();

    const { data, error } = await supabase
      .from('motivations')
      .select('*')
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('意気込み取得エラー:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data: data || [] };
  } catch (error) {
    console.error('意気込み取得中にエラーが発生:', error);
    return { success: false, error: '意気込みの取得中にエラーが発生しました' };
  }
}

// 現在のユーザーの意気込みを取得する関数
export async function getMyMotivation(): Promise<{ success: boolean; error?: string; data?: Motivation }> {
  try {
    const supabase = createClient();
    
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return { success: false, error: 'ユーザーが見つかりません' };
    }

    const { data, error } = await supabase
      .from('motivations')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
      console.error('自分の意気込み取得エラー:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data: data || undefined };
  } catch (error) {
    console.error('自分の意気込み取得中にエラーが発生:', error);
    return { success: false, error: '意気込みの取得中にエラーが発生しました' };
  }
}

// 意気込みを削除する関数
export async function deleteMotivation(): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createClient();
    
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return { success: false, error: 'ユーザーが見つかりません' };
    }

    const { error } = await supabase
      .from('motivations')
      .delete()
      .eq('user_id', user.id);

    if (error) {
      console.error('意気込み削除エラー:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('意気込み削除中にエラーが発生:', error);
    return { success: false, error: '意気込みの削除中にエラーが発生しました' };
  }
}