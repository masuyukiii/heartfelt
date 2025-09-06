import { createClient } from '@/lib/supabase/client'

export interface SlackSettings {
  id: string
  webhook_url: string
  channel: string
  is_enabled: boolean
  created_at: string
  updated_at: string
}

export async function getSlackSettings(): Promise<SlackSettings | null> {
  const supabase = createClient()
  
  try {
    const { data, error } = await supabase
      .from('slack_settings')
      .select('*')
      .single()
    
    if (error) {
      console.error('Slack設定の取得エラー:', error)
      return null
    }
    
    return data
  } catch (error) {
    console.error('Slack設定取得中にエラーが発生:', error)
    return null
  }
}

export async function updateSlackSettings(settings: {
  webhook_url: string
  channel: string
  is_enabled: boolean
}): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient()
  
  try {
    const { error } = await supabase
      .from('slack_settings')
      .update({
        webhook_url: settings.webhook_url,
        channel: settings.channel,
        is_enabled: settings.is_enabled,
        updated_at: new Date().toISOString()
      })
      .eq('id', (await getSlackSettings())?.id)
    
    if (error) {
      return { success: false, error: error.message }
    }
    
    return { success: true }
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : '不明なエラー' 
    }
  }
}

export async function postToSlack(message: {
  sender_name: string
  recipient_name: string
  content: string
  type: 'thanks' | 'honesty'
}): Promise<{ success: boolean; error?: string }> {
  try {
    const settings = await getSlackSettings()
    
    if (!settings || !settings.is_enabled || !settings.webhook_url) {
      return { success: false, error: 'Slack設定が無効または未設定です' }
    }
    
    const emoji = message.type === 'thanks' ? '💚' : '💭'
    const typeText = message.type === 'thanks' ? 'ありがとう' : '本音'
    
    const slackMessage = {
      channel: settings.channel,
      username: 'Heartfelt Bot',
      icon_emoji: ':heart:',
      text: `${emoji} ${message.sender_name}さんから${message.recipient_name}さんへ「${typeText}メッセージ」が届いたよ！\n\n内容はこれだよ：\n> ${message.content}`
    }
    
    const response = await fetch(settings.webhook_url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(slackMessage)
    })
    
    if (!response.ok) {
      return { success: false, error: `Slack投稿エラー: ${response.statusText}` }
    }
    
    return { success: true }
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : '不明なエラー' 
    }
  }
}