import { NextRequest, NextResponse } from 'next/server'

const SLACK_CLIENT_ID = process.env.SLACK_CLIENT_ID
const SLACK_CLIENT_SECRET = process.env.SLACK_CLIENT_SECRET

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  
  if (!code) {
    // 認証URLにリダイレクト
    const authUrl = `https://slack.com/oauth/v2/authorize?` + new URLSearchParams({
      client_id: SLACK_CLIENT_ID || '',
      scope: 'incoming-webhook',
      user_scope: 'chat:write',
      redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/slack-auth`,
      state: 'heartfelt-slack-auth'
    })
    
    return NextResponse.redirect(authUrl)
  }

  // 認証コードをトークンに交換
  try {
    const tokenResponse = await fetch('https://slack.com/api/oauth.v2.access', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: SLACK_CLIENT_ID || '',
        client_secret: SLACK_CLIENT_SECRET || '',
        code,
        redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/slack-auth`,
      }),
    })

    const tokenData = await tokenResponse.json()
    
    if (tokenData.ok) {
      // Webhook URLを取得
      const webhookUrl = tokenData.incoming_webhook?.url
      
      if (webhookUrl) {
        // ユーザーのプロフィールにWebhook URLを保存
        // (実装は既存のupdateProfile機能を使用)
        
        return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/protected?slack_success=1&webhook_url=${encodeURIComponent(webhookUrl)}`)
      }
    }
    
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/protected?slack_error=1`)
  } catch (error) {
    console.error('Slack auth error:', error)
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/protected?slack_error=1`)
  }
}