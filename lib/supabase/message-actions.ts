import { createClient } from '@/lib/supabase/client'

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
}) {
  const supabase = createClient()
  
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      throw new Error('ユーザーが見つかりません')
    }

    const { error } = await supabase
      .from('messages')
      .insert({
        sender_id: user.id,
        recipient_id: data.recipientId,
        type: data.type,
        content: data.content.trim()
      })

    if (error) {
      throw new Error(`メッセージ送信エラー: ${error.message}`)
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
      return []
    }

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
    const { error } = await supabase
      .from('messages')
      .update({ 
        is_read: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', messageId)

    if (error) {
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