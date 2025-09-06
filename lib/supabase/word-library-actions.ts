import { createClient } from '@/lib/supabase/client'

export interface WordLibraryEntry {
  id: string
  user_id: string
  message_content: string
  message_type: 'thanks' | 'honesty'
  saved_at: string
  original_sender_name: string | null
  created_at: string
  updated_at: string
}

// ことばライブラリにメッセージを保存
export async function saveToLibrary(data: {
  messageContent: string
  messageType: 'thanks' | 'honesty'
  originalSenderName?: string
}) {
  const supabase = createClient()
  
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      throw new Error('ユーザーが見つかりません')
    }

    // コンテンツの妥当性をチェック
    if (!data.messageContent || data.messageContent.trim().length === 0) {
      throw new Error('メッセージ内容が必要です')
    }

    const { error } = await supabase
      .from('word_library')
      .insert({
        user_id: user.id,
        message_content: data.messageContent.trim(),
        message_type: data.messageType,
        original_sender_name: data.originalSenderName || null
      })

    if (error) {
      console.error('Supabase save to library error:', error)
      if (error.code === 'PGRST116' || error.message.includes('relation "word_library" does not exist')) {
        throw new Error('ことばライブラリテーブルが設定されていません。管理者にお問い合わせください。')
      }
      throw new Error(`ライブラリ保存エラー: ${error.message}`)
    }

    return { success: true }
  } catch (error) {
    console.error('Save to library error:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : '不明なエラー' 
    }
  }
}

// ユーザーのことばライブラリを取得
export async function getLibraryWords(): Promise<WordLibraryEntry[]> {
  const supabase = createClient()
  
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      console.error('User not found:', userError)
      return []
    }

    console.log('🔍 Getting word library for user:', user.id, user.email)

    const { data: words, error } = await supabase
      .from('word_library')
      .select('*')
      .eq('user_id', user.id)
      .order('saved_at', { ascending: false })

    if (error) {
      console.error('Failed to fetch word library:', error)
      console.error('Error details:', JSON.stringify(error, null, 2))
      // テーブルが存在しない場合は空配列を返す
      if (error.code === 'PGRST116' || error.message.includes('relation "word_library" does not exist')) {
        console.warn('Word library table does not exist. Please run the database setup.')
        return []
      }
      // 一時的にすべてのエラーで空配列を返す（デバッグ用）
      console.warn('Returning empty array due to database error')
      return []
    }

    console.log('✅ Retrieved word library entries:', words?.length || 0, 'entries')
    console.log('📝 Word library data:', words)

    return words || []
  } catch (error) {
    console.error('Get library words error:', error)
    return []
  }
}

// ことばライブラリから削除
export async function removeFromLibrary(entryId: string) {
  const supabase = createClient()
  
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      throw new Error('ユーザーが見つかりません')
    }

    // UUIDの妥当性をチェック
    if (!entryId || typeof entryId !== 'string' || entryId.length !== 36) {
      throw new Error('無効なエントリーIDです')
    }

    // ユーザー本人のエントリのみ削除可能にする
    const { error } = await supabase
      .from('word_library')
      .delete()
      .eq('id', entryId)
      .eq('user_id', user.id) // 重要：ユーザー本人のみ削除可能

    if (error) {
      console.error('Supabase remove from library error:', error)
      if (error.code === 'PGRST116' || error.message.includes('relation "word_library" does not exist')) {
        throw new Error('ことばライブラリテーブルが設定されていません。管理者にお問い合わせください。')
      }
      throw new Error(`ライブラリ削除エラー: ${error.message}`)
    }

    return { success: true }
  } catch (error) {
    console.error('Remove from library error:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : '不明なエラー' 
    }
  }
}

// メッセージタイプ別の統計を取得
export async function getLibraryStats() {
  const supabase = createClient()
  
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return { success: false, error: 'ユーザーが見つかりません' }
    }

    // ありがとうメッセージの数を取得
    const { count: thanksCount, error: thanksError } = await supabase
      .from('word_library')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('message_type', 'thanks')

    if (thanksError) {
      console.error('Failed to fetch thanks count:', thanksError)
      if (thanksError.code === 'PGRST116' || thanksError.message.includes('relation "word_library" does not exist')) {
        console.warn('Word library table does not exist. Returning 0 counts.')
        return { success: true, thanksCount: 0, honestyCount: 0 }
      }
      throw new Error(`ありがとう統計取得エラー: ${thanksError.message}`)
    }

    // 本音メッセージの数を取得
    const { count: honestyCount, error: honestyError } = await supabase
      .from('word_library')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('message_type', 'honesty')

    if (honestyError) {
      console.error('Failed to fetch honesty count:', honestyError)
      throw new Error(`本音統計取得エラー: ${honestyError.message}`)
    }

    console.log('📊 Library stats retrieved:', { thanksCount: thanksCount || 0, honestyCount: honestyCount || 0 })

    return {
      success: true,
      thanksCount: thanksCount || 0,
      honestyCount: honestyCount || 0
    }
  } catch (error) {
    console.error('Get library stats error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : '不明なエラー',
      thanksCount: 0,
      honestyCount: 0
    }
  }
}