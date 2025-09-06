# LINE連携機能セットアップガイド

Heartfeltアプリケーションで本音メッセージやありがとうメッセージをLINEにも送信する機能の設定方法です。

## 前提条件

- LINE Developers コンソールへのアクセス
- LINE Official Account の作成
- Node.js 18+ の環境

## 1. LINE Official Account の作成

1. [LINE Business ID](https://www.linebiz.com/jp/) にアクセスしてアカウントを作成
2. [LINE Developers](https://developers.line.biz/) にログイン
3. 新しいプロバイダーを作成
4. Messaging API チャンネルを作成

## 2. Messaging API の設定

1. LINE Developers コンソールで作成したチャンネルを開く
2. **Messaging API** タブに移動
3. 以下の情報を取得：
   - **Channel access token (long-lived)** を発行
   - **Channel secret** をメモ

## 3. 環境変数の設定

プロジェクトの `.env.local` ファイルに以下を追加：

```bash
# LINE Messaging API 設定
LINE_CHANNEL_ACCESS_TOKEN=your_channel_access_token_here
LINE_CHANNEL_SECRET=your_channel_secret_here

# デモ用のLINE User ID（オプション）
LINE_DEFAULT_USER_ID=your_line_user_id_for_testing
```

### LINE User IDの取得方法

LINE User IDは以下の方法で取得できます：

1. **テスト用ユーザーIDの取得**
   - LINE Developers コンソールの「Messaging API」タブ
   - 「Your user ID」セクションからコピー

2. **実際のユーザーIDの取得**
   - WebhookでメッセージイベントからユーザーIDを取得
   - LINE Login APIを使用してユーザー情報を取得

## 4. 機能の使用方法

### 基本的な送信

1. 本音メッセージ送信モーダルを開く
2. メッセージを入力
3. **「LINEでも送信する」** にチェックを入れる
4. 送信ボタンをクリック

### 送信される内容

LINEには以下の形式でメッセージが送信されます：

```
💭 本音メッセージ from ユーザー名

[実際のメッセージ内容]
```

リッチメッセージ（Flex Message）として送信され、見た目も美しく表示されます。

## 5. トラブルシューティング

### よくあるエラー

1. **「LINE設定が不完全です」**
   - 環境変数が正しく設定されているか確認
   - アプリケーションを再起動

2. **「LINE送信に失敗しました」**
   - Channel Access Token が有効か確認
   - User ID が正しいか確認
   - LINE APIの利用制限に達していないか確認

3. **メッセージは送信されたがLINEに届かない**
   - User IDが正しいか確認
   - ユーザーがボットをブロックしていないか確認

### デバッグモード

開発者コンソールでLINE送信のログを確認：

```javascript
// ブラウザの開発者ツールで以下を確認
console.log('LINE送信結果:', result);
```

## 6. セキュリティ注意事項

- Channel Access Token は絶対に公開しない
- `.env.local` ファイルを `.gitignore` に追加済みか確認
- 本番環境では環境変数を安全に管理

## 7. 今後の拡張予定

- [ ] ユーザー別のLINE連携設定
- [ ] LINE Webhook受信機能
- [ ] グループチャット対応
- [ ] リッチメニュー連携

## サポート

LINE連携機能で問題が発生した場合は、以下を含めて報告してください：

1. エラーメッセージ
2. 設定した環境変数（トークン等は除く）
3. 送信しようとしたメッセージの種類
4. ブラウザの開発者コンソールのログ