interface SlackNotificationParams {
  senderName: string
  messageType: 'thanks' | 'honesty'
  content: string
  appUrl?: string
}

export class SlackService {
  static async sendNotification(
    webhookUrl: string, 
    params: SlackNotificationParams
  ): Promise<{ success: boolean; error?: string }> {
    if (!webhookUrl || !webhookUrl.startsWith('https://hooks.slack.com/')) {
      return { success: false, error: 'Invalid Slack webhook URL' }
    }

    try {
      const messageTypeEmoji = params.messageType === 'thanks' ? '✨' : '💬'
      const messageTypeText = params.messageType === 'thanks' ? '感謝のメッセージ' : '本音メッセージ'
      
      const message = {
        text: `🎯 Heartfeltから通知`,
        blocks: [
          {
            type: "header",
            text: {
              type: "plain_text",
              text: "🎯 Heartfelt - 新しいメッセージ",
              emoji: true
            }
          },
          {
            type: "section",
            fields: [
              {
                type: "mrkdwn",
                text: `*送信者:* ${params.senderName}`
              },
              {
                type: "mrkdwn",
                text: `*種類:* ${messageTypeText} ${messageTypeEmoji}`
              }
            ]
          },
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: `*メッセージ内容:*\n> ${params.content}`
            }
          }
        ]
      }

      if (params.appUrl) {
        message.blocks.push({
          type: "actions",
          elements: [
            {
              type: "button",
              text: {
                type: "plain_text",
                text: "📱 アプリで確認",
                emoji: true
              },
              url: params.appUrl,
              style: "primary"
            }
          ]
        })
      }

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(message)
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Slack webhook error:', errorText)
        return { success: false, error: `Slack API error: ${response.status}` }
      }

      return { success: true }
    } catch (error) {
      console.error('Slack notification error:', error)
      return { success: false, error: 'Failed to send Slack notification' }
    }
  }

  static async testNotification(webhookUrl: string): Promise<{ success: boolean; error?: string }> {
    return this.sendNotification(webhookUrl, {
      senderName: 'テストユーザー',
      messageType: 'thanks',
      content: 'Slack連携のテスト通知です。設定が正常に完了しました！',
      appUrl: process.env.NEXT_PUBLIC_APP_URL || 'https://your-app.vercel.app'
    })
  }
}