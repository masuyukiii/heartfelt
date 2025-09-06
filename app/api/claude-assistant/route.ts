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

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307', // 高速で安価なモデル
        max_tokens: 1000,
        messages: [
          {
            role: 'user',
            content: systemPrompt
          }
        ]
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