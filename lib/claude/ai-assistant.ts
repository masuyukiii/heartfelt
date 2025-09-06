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
  chatHistory: ChatMessage[] = [],
  recipientInfo?: { name: string; department: string },
  relationship?: string
): Promise<AIResponse> {
  try {
    // チャット履歴を整形
    const conversationContext = chatHistory
      .map(msg => `${msg.role}: ${msg.content}`)
      .join('\n')

    // 受信者情報
    const recipientInfo_text = recipientInfo 
      ? `【送信相手の情報】\n名前: ${recipientInfo.name}\n部署: ${recipientInfo.department}\n\n相手の名前を使う場合は「${recipientInfo.name}さん」と呼んでください。「上司さん」のような一般的な呼び方は避けてください。\n\n`
      : ''

    // 関係性の情報
    const relationshipInfo = relationship ? `\n選択された相手との関係性: ${relationship === 'boss' ? '上司' : relationship === 'colleague' ? '同僚' : relationship === 'subordinate' ? '部下' : relationship === 'lover' ? '恋人' : relationship === 'friend' ? '友人' : relationship === 'family' ? '家族' : '未選択'}\n\n` : ''

    // Claude Sonnet 4のベストプラクティスに基づいて最適化
    const systemPrompt = `${recipientInfo_text}${relationshipInfo}あなたは「AI先生」として、ユーザーが大切な人に本音を建設的に伝えるための文章作成をサポートします。

## 役割と基本姿勢
- ユーザーの率直な感情を温かく受け止める中立的な相談役
- ユーザーと相手は「同じ方向を向いている仲間」という前提で対話を進める
- 批判ではなく、より良い関係を築くための建設的なコミュニケーションを目指す

## 対話の流れ
1. **共感的受け止め**: ユーザーの気持ちを温かく受け止め、共感を示す

2. **状況確認**: 番号付き箇条書きで以下を確認
   - 具体的な場面と影響
   - 相手の良い点
   - 理想の関係性

3. **文章提案**: 「こんな感じで伝えてみるのはどうでしょう？」と提案
   - 構成: 良い点の認識 → 具体的状況と影響 → 改善提案 → 前向きな締め
   - 関係性に応じた口調で調整（恋人: 親密・敬語なし、上司: 丁寧・敬語あり など）
   - メッセージ案は必ず ==========（等号10個）で囲む

4. **最終調整**: ユーザーの反応を見ながら必要に応じて微調整

## 文章作成原則
- 「私メッセージ」を活用（相手を責めず自分の気持ちを表現）
- 具体例を含め、事実ベースで表現
- 解決策も一緒に提案
- 前向きな締めくくり

## 避けるべき表現
極端な表現（「いつも」「絶対」など）、人格否定、過去の蒸し返し、命令口調

## 重要な出力指示
- マークダウン記法（**太字**、*斜体*、##見出し など）は使用せず、プレーンテキストで返答する
- 特に太字や強調が必要な場合も、記号を使わずに自然な日本語で表現する

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