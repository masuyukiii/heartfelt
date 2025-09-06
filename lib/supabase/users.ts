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
    // まずauth.usersからユーザー一覧を取得してみる
    const { data: authData, error: authError } = await supabase.auth.admin.listUsers()
    
    if (authError || !authData) {
      console.log('Auth users not accessible, trying profiles table...')
      
      // profilesテーブルからの取得を試行
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: true })

      if (error) {
        console.log('Profiles table not found or empty, returning empty array')
        return []
      }

      return data || []
    }

    // auth.usersが利用可能な場合はそちらを使用
    return authData.users.map(user => ({
      id: user.id,
      email: user.email || '',
      name: user.user_metadata?.name || user.email?.split('@')[0] || '匿名ユーザー',
      department: user.user_metadata?.department,
      avatar_url: user.user_metadata?.avatar_url,
      created_at: user.created_at
    }))
  } catch (error) {
    console.log('Error fetching users, returning empty array:', error)
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