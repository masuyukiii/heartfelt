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
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Failed to fetch users:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error fetching users:', error)
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