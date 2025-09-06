import { createClient } from '@/lib/supabase/client'

export async function updateProfile(data: { name: string; department?: string; slackWebhookUrl?: string }) {
  const supabase = createClient()
  
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      throw new Error('ユーザーが見つかりません')
    }

    const { error } = await supabase
      .from('profiles')
      .update({
        name: data.name.trim(),
        department: data.department?.trim() || null,
        slack_webhook_url: data.slackWebhookUrl?.trim() || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id)

    if (error) {
      throw new Error(`プロフィール更新エラー: ${error.message}`)
    }

    return { success: true }
  } catch (error) {
    console.error('Profile update error:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : '不明なエラー' 
    }
  }
}

export async function getCurrentUserProfile() {
  const supabase = createClient()
  
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return null
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (profileError) {
      console.error('Profile fetch error:', profileError)
      return null
    }

    return profile
  } catch (error) {
    console.error('Get profile error:', error)
    return null
  }
}