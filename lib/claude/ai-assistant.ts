// Claude AI添削アシスタント

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

export interface AIResponse {
  success: boolean
  message?: string
  error?: string
}

export async function getAIFeedback(
  userMessage: string,
  chatHistory: ChatMessage[] = []
): Promise<AIResponse> {
  try {
    // チャット履歴を整形
    const conversationContext = chatHistory
      .map(msg => `${msg.role}: ${msg.content}`)
      .join('\n')

    const systemPrompt = `あなたは職場コミュニケーションの専門家です。ユーザーが本音で伝えたいことを、相手にとってポジティブで建設的に受け取ってもらえるよう添削してください。

【添削方針】
1. 相手への思いやりを示す
2. 具体的で建設的な提案にする
3. 関係性を良くする表現を使う
4. 心理的安全性を保つ丁寧な言葉遣い
5. 上司・部下関係でも言いやすい表現

【応答スタイル】
- 優しく親身な先生として返答
- 添削理由も簡潔に説明
- ユーザーが納得するまで対話継続
- 最終版では「【完成版】」をつけて提示

前の会話:
${conversationContext}

ユーザーの新しいメッセージ: ${userMessage}`

    const response = await fetch('/api/claude-assistant', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: userMessage,
        systemPrompt,
        conversationContext
      })
    })

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`)
    }

    const data = await response.json()
    
    return {
      success: true,
      message: data.message
    }
  } catch (error) {
    console.error('AI Feedback error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : '不明なエラー'
    }
  }
}