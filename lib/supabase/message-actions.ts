import { createClient } from '@/lib/supabase/client'
import { getLineService } from '@/lib/line/line-client'

export interface Message {
  id: string
  sender_id: string
  recipient_id: string
  type: 'thanks' | 'honesty'
  content: string
  is_read: boolean
  created_at: string
  updated_at: string
  // Profile information (joined)
  sender_name?: string
  sender_email?: string
  recipient_name?: string
  recipient_email?: string
}

// メッセージを送信
export async function sendMessage(data: {
  recipientId: string
  type: 'thanks' | 'honesty'
  content: string
  sendToLine?: boolean  // LINE送信オプション
}) {
  const supabase = createClient()
  
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      throw new Error('ユーザーが見つかりません')
    }

    // UUIDの妥当性をチェック
    if (!data.recipientId || typeof data.recipientId !== 'string' || data.recipientId.length !== 36) {
      throw new Error('無効な宛先IDです')
    }

    // コンテンツの妥当性をチェック
    if (!data.content || data.content.trim().length === 0) {
      throw new Error('メッセージ内容を入力してください')
    }

    // メッセージをデータベースに保存
    const { error } = await supabase
      .from('messages')
      .insert({
        sender_id: user.id,
        recipient_id: data.recipientId,
        type: data.type,
        content: data.content.trim()
      })

    if (error) {
      console.error('Supabase send message error:', error)
      if (error.code === 'PGRST116' || error.message.includes('relation "messages" does not exist')) {
        throw new Error('データベーステーブルが設定されていません。管理者にお問い合わせください。')
      }
      throw new Error(`メッセージ送信エラー: ${error.message}`)
    }

    // LINE送信オプションが有効な場合
    if (data.sendToLine) {
      try {
        // 送信者の情報を取得
        const { data: senderProfile } = await supabase
          .from('profiles')
          .select('name, email')
          .eq('id', user.id)
          .single()

        // 受信者のLINE情報を取得（将来的にはprofilesテーブルのline_user_idカラムから）
        // 今回はデモ用に環境変数からLINE_USER_IDを取得
        const recipientLineUserId = process.env.LINE_DEFAULT_USER_ID || data.recipientId

        const lineService = getLineService()
        if (lineService) {
          const lineResult = await lineService.sendRichMessage({
            userId: recipientLineUserId,
            message: data.content.trim(),
            senderName: senderProfile?.name || senderProfile?.email?.split('@')[0] || '匿名ユーザー',
            messageType: data.type
          })

          if (!lineResult.success) {
            console.warn('LINE送信に失敗しましたが、メッセージ送信は続行します:', lineResult.error)
          }
        } else {
          console.warn('LINE設定が不完全です。LINE送信をスキップします。')
        }
      } catch (lineError) {
        console.error('LINE送信中にエラーが発生しました:', lineError)
        // LINEの送信エラーは致命的ではないため、処理を続行
      }
    }

    return { success: true }
  } catch (error) {
    console.error('Send message error:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : '不明なエラー' 
    }
  }
}

// 受信メッセージを取得
export async function getReceivedMessages(): Promise<Message[]> {
  const supabase = createClient()
  
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      console.error('User not found:', userError)
      return []
    }

    console.log('🔍 Getting messages for user:', user.id, user.email)

    const { data: messages, error } = await supabase
      .from('messages')
      .select(`
        *,
        sender:profiles!messages_sender_id_fkey(name, email)
      `)
      .eq('recipient_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Failed to fetch messages:', error)
      console.error('Error details:', JSON.stringify(error, null, 2))
      // テーブルが存在しない場合は空配列を返す
      if (error.code === 'PGRST116' || error.message.includes('relation "messages" does not exist')) {
        console.warn('Messages table does not exist. Please run the database setup.')
        return []
      }
      // 一時的にすべてのエラーで空配列を返す（デバッグ用）
      console.warn('Returning empty array due to database error')
      return []
    }

    console.log('✅ Retrieved messages:', messages?.length || 0, 'messages')
    console.log('📝 Messages data:', messages)

    return (messages || []).map(msg => ({
      id: msg.id,
      sender_id: msg.sender_id,
      recipient_id: msg.recipient_id,
      type: msg.type,
      content: msg.content,
      is_read: msg.is_read,
      created_at: msg.created_at,
      updated_at: msg.updated_at,
      sender_name: msg.sender?.name || msg.sender?.email?.split('@')[0] || '匿名ユーザー',
      sender_email: msg.sender?.email
    }))
  } catch (error) {
    console.error('Get messages error:', error)
    return []
  }
}

// メッセージを既読にする
export async function markAsRead(messageId: string) {
  const supabase = createClient()
  
  try {
    // UUIDの妥当性をチェック
    if (!messageId || typeof messageId !== 'string' || messageId.length !== 36) {
      throw new Error('無効なメッセージIDです')
    }

    const { error } = await supabase
      .from('messages')
      .update({ 
        is_read: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', messageId)

    if (error) {
      console.error('Supabase mark as read error:', error)
      throw new Error(`既読更新エラー: ${error.message}`)
    }

    return { success: true }
  } catch (error) {
    console.error('Mark as read error:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : '不明なエラー' 
    }
  }
}