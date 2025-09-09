## セットアップ手順（ローカル開発）

このドキュメントは、本プロジェクトを初回セットアップから起動まで最短で再現するための手順です。

### 1. 前提条件
- Node.js 20 以降（推奨）
- npm 10 以降
- Supabase プロジェクト（無料枠で可）

### 2. 依存関係をインストール
```bash
npm ci
```

### 3. 環境変数を設定
`.env.local` をプロジェクトルートに作成し、以下を設定します。
```env
NEXT_PUBLIC_SUPABASE_URL=https://<your-project-id>.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY=<anon-or-publishable-key>

# 任意（利用する場合）
OPENAI_API_KEY=<your-openai-api-key>
ANTHROPIC_API_KEY=<your-anthropic-api-key>
```

補足:
- 値は Supabase ダッシュボードの「Project Settings > API」から取得できます。
- サーバ側でも同名を参照します。`lib/supabase/server.ts` と `lib/supabase/middleware.ts` は値未設定時に安全にフェイルします。

### 4. データベース初期化（任意）
`setup-database.sql` に初期化 SQL がある場合は Supabase SQL Editor で実行します。

### 5. 開発サーバを起動
```bash
npm run dev
```
デフォルトで `http://localhost:3000` で起動します。ポート 3000 が塞がっている場合は `-p` オプションで変更できます。

### 6. 認証フローの確認
- `/auth/sign-up` でユーザ作成
- `/auth/login` でログイン
- `/protected` 等にアクセスするとミドルウェアにより未ログイン時は `/auth/login` へ誘導されます。

### 7. 機能の確認（ポジティブライター）
- `/positive-writer` へアクセス
- テキストを入力して送信
- API キーが設定されていれば OpenAI または Claude で添削、未設定時はフォールバック応答

### 8. ビルド・本番起動
```bash
npm run build
npm run start
```

## デプロイ（Vercel の例）
1. リポジトリを GitHub にプッシュ
2. Vercel プロジェクトを作成し、リポジトリを接続
3. 環境変数に以下を設定
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY`
   - 任意で `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`
4. デプロイ開始

## トラブルシュート
- ミドルウェアでリダイレクトループする: 環境変数が未設定/URL 不正で `updateSession` が早期 return していないか確認。
- 3000 番ポート競合: `npm run dev -p 3001` などで回避。
- Supabase セッションが維持されない: Cookie のブロック、または `createServerClient` 周辺でレスポンスを差し替えていないか確認。


