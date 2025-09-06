import { createClient } from '@/lib/supabase/client'

export interface RewardGoal {
  id: string
  goal_name: string
  required_points: number
  start_date: string
  achieved_date: string | null
  is_active: boolean
  created_at: string
}

// 現在のアクティブなゴールを取得
export async function getActiveGoal(): Promise<RewardGoal | null> {
  const supabase = createClient()
  
  try {
    const { data, error } = await supabase
      .from('reward_goals')
      .select('*')
      .eq('is_active', true)
      .order('start_date', { ascending: false })
      .limit(1)
      .single()

    if (error) {
      if (error.code === 'PGRST116' || error.message.includes('no rows')) {
        console.log('No active goal found')
        return null
      }
      console.error('Failed to fetch active goal:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('Get active goal error:', error)
    return null
  }
}

// 新しいゴールを作成（古いゴールを非アクティブにする）
export async function createNewGoal(data: {
  goalName: string
  requiredPoints: number
}) {
  const supabase = createClient()
  
  try {
    // まず既存のアクティブなゴールを非アクティブにする
    const { error: updateError } = await supabase
      .from('reward_goals')
      .update({ is_active: false })
      .eq('is_active', true)

    if (updateError) {
      console.error('Failed to deactivate old goals:', updateError)
    }

    // 新しいゴールを作成
    const { data: newGoal, error } = await supabase
      .from('reward_goals')
      .insert({
        goal_name: data.goalName,
        required_points: data.requiredPoints,
        is_active: true
      })
      .select()
      .single()

    if (error) {
      console.error('Failed to create new goal:', error)
      throw new Error(`ゴール作成エラー: ${error.message}`)
    }

    return { success: true, data: newGoal }
  } catch (error) {
    console.error('Create goal error:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : '不明なエラー' 
    }
  }
}

// ゴールを達成済みにする
export async function achieveGoal(goalId: string) {
  const supabase = createClient()
  
  try {
    const { error } = await supabase
      .from('reward_goals')
      .update({ 
        achieved_date: new Date().toISOString(),
        is_active: false
      })
      .eq('id', goalId)

    if (error) {
      console.error('Failed to achieve goal:', error)
      throw new Error(`ゴール達成エラー: ${error.message}`)
    }

    return { success: true }
  } catch (error) {
    console.error('Achieve goal error:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : '不明なエラー' 
    }
  }
}

// 現在のゴールに対してカウント済みのメッセージ数を取得
export async function getCurrentGoalProgress(): Promise<{
  thanksPoints: number
  honestyPoints: number
  startDate: string | null
}> {
  const supabase = createClient()
  
  try {
    // 現在のアクティブなゴールを取得
    const activeGoal = await getActiveGoal()
    
    if (!activeGoal) {
      // ゴールがない場合は0を返す
      return { thanksPoints: 0, honestyPoints: 0, startDate: null }
    }

    // ゴール開始日以降のメッセージをカウント
    const { data: messages, error } = await supabase
      .from('messages')
      .select('type')
      .gte('created_at', activeGoal.start_date)

    if (error) {
      console.error('Failed to fetch goal progress:', error)
      return { thanksPoints: 0, honestyPoints: 0, startDate: activeGoal.start_date }
    }

    const thanksPoints = messages?.filter(m => m.type === 'thanks').length || 0
    const honestyPoints = messages?.filter(m => m.type === 'honesty').length || 0

    return { thanksPoints, honestyPoints, startDate: activeGoal.start_date }
  } catch (error) {
    console.error('Get goal progress error:', error)
    return { thanksPoints: 0, honestyPoints: 0, startDate: null }
  }
}

// ゴール履歴を取得
export async function getGoalHistory(): Promise<RewardGoal[]> {
  const supabase = createClient()
  
  try {
    const { data, error } = await supabase
      .from('reward_goals')
      .select('*')
      .order('start_date', { ascending: false })
      .limit(10)

    if (error) {
      console.error('Failed to fetch goal history:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Get goal history error:', error)
    return []
  }
}