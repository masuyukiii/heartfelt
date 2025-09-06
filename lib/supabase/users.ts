import { createClient } from '@/lib/supabase/client'

export interface User {
  id: string
  email: string
  name?: string
  department?: string
  avatar_url?: string
  created_at: string
}

export async function getUsers(): Promise<User[]> {
  const supabase = createClient()
  
  try {
    console.log('Attempting to fetch users...')
    
    // 現在のユーザーを取得
    const { data: { user: currentUser }, error: currentUserError } = await supabase.auth.getUser()
    
    if (currentUserError || !currentUser) {
      console.log('Current user not found:', currentUserError)
      return []
    }

    console.log('Current user found:', currentUser.email)

    // profilesテーブルが存在するかチェック
    let profiles: any[] = [];
    try {
      const { data: profilesData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .neq('id', currentUser.id) // 自分以外のユーザーのみ取得
        .order('created_at', { ascending: true })

      if (!profileError && profilesData) {
        profiles = profilesData;
        console.log('Found profiles (excluding self):', profiles.length)
      }
    } catch (profileError) {
      console.log('Profiles table does not exist or is not accessible:', profileError)
    }

    // profilesテーブルからのデータを使用（自分を除く）
    return profiles.map(profile => ({
      id: profile.id,
      email: profile.email || '',
      name: profile.name || profile.email?.split('@')[0] || '匿名ユーザー',
      department: profile.department,
      avatar_url: profile.avatar_url,
      created_at: profile.created_at
    }))

  } catch (error) {
    console.log('Error fetching users:', error)
    return []
  }
}

export async function getCurrentUser() {
  const supabase = createClient()
  
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return null
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (profileError) {
      console.error('Failed to fetch user profile:', profileError)
      return null
    }

    return profile
  } catch (error) {
    console.error('Error fetching current user:', error)
    return null
  }
}