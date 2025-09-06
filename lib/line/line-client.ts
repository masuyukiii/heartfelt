import { Client, TextMessage } from '@line/bot-sdk';

export interface LineConfig {
  channelAccessToken: string;
  channelSecret: string;
}

export interface LineSendMessageParams {
  userId: string;
  message: string;
  senderName?: string;
  messageType?: 'thanks' | 'honesty';
}

export class LineService {
  private client: Client;

  constructor(config: LineConfig) {
    this.client = new Client({
      channelAccessToken: config.channelAccessToken,
      channelSecret: config.channelSecret,
    });
  }

  async sendMessage(params: LineSendMessageParams): Promise<{ success: boolean; error?: string }> {
    try {
      const { userId, message, senderName = 'Heartfelt', messageType = 'honesty' } = params;
      
      // メッセージタイプに応じたプレフィックスを追加
      const emoji = messageType === 'thanks' ? '💖' : '💭';
      const typeText = messageType === 'thanks' ? 'ありがとうメッセージ' : '本音メッセージ';
      
      const fullMessage = `${emoji} ${typeText} from ${senderName}\n\n${message}`;

      const textMessage: TextMessage = {
        type: 'text',
        text: fullMessage
      };

      await this.client.pushMessage(userId, textMessage);

      return { success: true };
    } catch (error: any) {
      console.error('LINE送信エラー:', error);
      return { 
        success: false, 
        error: error?.message || 'LINE送信に失敗しました' 
      };
    }
  }

  async sendRichMessage(params: LineSendMessageParams): Promise<{ success: boolean; error?: string }> {
    try {
      const { userId, message, senderName = 'Heartfelt', messageType = 'honesty' } = params;
      
      const emoji = messageType === 'thanks' ? '💖' : '💭';
      const typeText = messageType === 'thanks' ? 'ありがとうメッセージ' : '本音メッセージ';
      const color = messageType === 'thanks' ? '#ff6b9d' : '#4dabf7';

      // Flex Messageを使用したリッチなメッセージ
      const flexMessage = {
        type: 'flex' as const,
        altText: `${typeText} from ${senderName}`,
        contents: {
          type: 'bubble',
          header: {
            type: 'box',
            layout: 'vertical',
            contents: [
              {
                type: 'text',
                text: `${emoji} ${typeText}`,
                weight: 'bold',
                color: '#ffffff',
                size: 'lg'
              },
              {
                type: 'text',
                text: `from ${senderName}`,
                color: '#ffffff',
                size: 'sm',
                margin: 'xs'
              }
            ],
            backgroundColor: color,
            paddingAll: 'lg'
          },
          body: {
            type: 'box',
            layout: 'vertical',
            contents: [
              {
                type: 'text',
                text: message,
                wrap: true,
                size: 'md',
                color: '#333333'
              }
            ],
            paddingAll: 'lg'
          },
          footer: {
            type: 'box',
            layout: 'vertical',
            contents: [
              {
                type: 'text',
                text: 'Sent via Heartfelt App',
                size: 'xs',
                color: '#aaaaaa',
                align: 'center'
              }
            ],
            paddingAll: 'sm'
          }
        }
      };

      await this.client.pushMessage(userId, flexMessage);

      return { success: true };
    } catch (error: any) {
      console.error('LINEリッチメッセージ送信エラー:', error);
      return { 
        success: false, 
        error: error?.message || 'LINEリッチメッセージ送信に失敗しました' 
      };
    }
  }

  // ユーザープロフィール取得（将来的にユーザーIDの検証に使用）
  async getUserProfile(userId: string): Promise<{ success: boolean; profile?: any; error?: string }> {
    try {
      const profile = await this.client.getProfile(userId);
      return { success: true, profile };
    } catch (error: any) {
      console.error('LINEプロフィール取得エラー:', error);
      return { 
        success: false, 
        error: error?.message || 'プロフィール取得に失敗しました' 
      };
    }
  }
}

// Singletonインスタンス用のファクトリ関数
let lineServiceInstance: LineService | null = null;

export function getLineService(): LineService | null {
  if (!process.env.LINE_CHANNEL_ACCESS_TOKEN || !process.env.LINE_CHANNEL_SECRET) {
    console.warn('LINE環境変数が設定されていません');
    return null;
  }

  if (!lineServiceInstance) {
    lineServiceInstance = new LineService({
      channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
      channelSecret: process.env.LINE_CHANNEL_SECRET,
    });
  }

  return lineServiceInstance;
}