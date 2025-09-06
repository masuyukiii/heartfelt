import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { message, systemPrompt, conversationContext } = await request.json()

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: 'ANTHROPIC_API_KEY is not configured' },
        { status: 500 }
      )
    }

    // 会話履歴をメッセージ配列に変換
    const messages = []
    
    // 既存の会話履歴がある場合は追加
    if (conversationContext) {
      const contextLines = conversationContext.split('\n').filter(line => line.trim())
      for (const line of contextLines) {
        if (line.startsWith('user: ')) {
          messages.push({
            role: 'user',
            content: line.substring(6)
          })
        } else if (line.startsWith('assistant: ')) {
          messages.push({
            role: 'assistant',
            content: line.substring(11)
          })
        }
      }
    }

    // 新しいユーザーメッセージを追加
    messages.push({
      role: 'user',
      content: message
    })

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2000,
        system: systemPrompt, // 正しいsystemプロンプトの設定
        messages: messages
      })
    })

    if (!response.ok) {
      const errorData = await response.text()
      console.error('Anthropic API Error:', errorData)
      return NextResponse.json(
        { error: 'AI service unavailable' },
        { status: 500 }
      )
    }

    const data = await response.json()
    const aiMessage = data.content[0]?.text || 'すみません、うまく返答できませんでした。'

    return NextResponse.json({ message: aiMessage })
  } catch (error) {
    console.error('Claude Assistant API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}