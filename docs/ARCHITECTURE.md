## Heartfelt アーキテクチャ概要

本リポジトリは Next.js App Router と Supabase を用いたフルスタックアプリです。Cookie ベースの Supabase 認証を `@supabase/ssr` で統合し、クライアント・サーバ・ミドルウェアの全層でセッションを透過的に利用できます。UI は Tailwind CSS と shadcn/ui を採用しています。

### 技術スタック
- Next.js 15 (App Router)
- React 19
- Supabase (`@supabase/ssr`, `@supabase/supabase-js`)
- Tailwind CSS + shadcn/ui
- TypeScript 5

### 主要ディレクトリ
- `app/`:
  - ルーティング（App Router）。`app/api/*` は Route Handlers（サーバのみ）、`app/**/page.tsx` は UI。
  - `app/protected` は認証ガード対象の例。
- `lib/supabase/`:
  - `client.ts`: ブラウザ向け Supabase クライアント生成。
  - `server.ts`: サーバ向け Supabase クライアント生成。Cookie ストア連携と環境変数検証を実施。
  - `middleware.ts`: リクエスト毎にセッション更新し、未認証ユーザを `/auth/login` へ誘導。
- `components/`: UI コンポーネント（shadcn/ui ベース）と認証フォーム等。
- `middleware.ts`: Next.js ミドルウェアのエントリ（`lib/supabase/middleware.updateSession` を利用）。
- `setup-database.sql`: Supabase 側のテーブル/ポリシー等の初期化スクリプト。

### 認証・セッションの流れ
1. ブラウザ: `lib/supabase/client.ts` の `createClient()` が `createBrowserClient(url, anonKey)` を生成。
2. サーバ/Route Handler/Server Component: `lib/supabase/server.ts` の `createClient()` が `createServerClient(url, anonKey, { cookies })` を生成。環境変数と URL 形式を検証。
3. ミドルウェア: `lib/supabase/middleware.ts` の `updateSession()` が `supabase.auth.getClaims()` を実行し、未認証時は `/auth/login` へリダイレクト。Cookie 同期を維持。

### ページ構成（例）
- `app/auth/*`: ログイン/サインアップ/パスワード関連の UI。
- `app/protected/*`: 認証が必要なページ。ミドルウェアでガード。
- `app/positive-writer/*`: アプリ固有機能の UI と API 例。

### 環境変数
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY`
これらはクライアント・サーバ双方で使用します。`server.ts`/`middleware.ts` で未設定や URL 不正を検知します。

### セキュリティと設計意図
- セッションは Cookie による SSR 互換モードで運用し、ブラウザ/サーバ間で一貫性を確保。
- ミドルウェアで認可の最低限のガードを行い、機密ページへの直接アクセスを防止。
- サーバ側クライアントは都度生成（Fluid compute でのグローバル状態汚染を回避）。

### 依存関係とビルド
- `next dev --turbopack` でローカル開発。
- shadcn/ui と Tailwind を採用。`components.json` を置き換えることでテーマ再構成可能。

### 今後の拡張ポイント
---

## はじめての人向け：このアプリの仕組み（やさしい説明）

### 1. Webアプリは「箱がいくつかある」イメージ
- ブラウザ（あなたが見る画面）
- サーバ（見えない裏側で動く脳みそ）
- データベース（アプリの記録ノート）

Heartfelt では、ブラウザとサーバの両方で Supabase というサービスを使っています。Supabase は「ログイン管理」と「データベース」をまとめて提供してくれる便利なサービスです。

### 2. ログインのながれ（ざっくり）
1. ログイン画面でメールとパスワードを入力
2. Supabase がユーザーを確認し、ログイン成功なら「Cookie（合言葉）」を発行
3. 次からはこの合言葉を使って、あなたが「本人」であることをアプリに伝えます

この合言葉は、ページの移動のたびにミドルウェアがチェックして、必要ならログイン画面に案内します。

### 3. フロント（見える部分）とバック（見えない部分）の役割
- 見える部分（`app/**/page.tsx`）は React の画面
- 見えない部分（`app/api/**/route.ts`）は API の入り口（AIの呼び出しなど）

### 4. コードの読む順番（迷子にならないコツ）
1. `app/page.tsx`（トップページ）
2. `app/auth/login/page.tsx`（ログイン）
3. `middleware.ts`（ログインチェック）
4. `lib/supabase/*`（Supabase の使い方が集まっている）
5. `app/positive-writer/*`（アプリ固有の機能例）

### 5. よくある質問
- どうしたらログイン必須にできる？→ 何もしなくてもミドルウェアが未ログイン時にログインへ誘導。特定ページだけ許可したいときは `middleware.ts` の `matcher` を調整。
- エラーが出たら？→ まず `.env.local` の URL/キーが正しいか、`lib/supabase/server.ts` のエラーメッセージを確認。
- API キーがなくても動く？→ はい。AI 機能はフォールバック動作があります（`app/api/positive-writer/route.ts`）。

---

## AI・外部APIの構成

### Positive Writer API（OpenAI / Claude フォールバック）
- エンドポイント: `POST /api/positive-writer`
- 役割: 入力メッセージをポジティブに添削
- キー設定: `OPENAI_API_KEY` または `ANTHROPIC_API_KEY`（どちらも未設定ならフォールバックで模擬応答）

### Claude Assistant API（テンプレ付き汎用呼び出し）
- エンドポイント: `POST /api/claude-assistant`
- 入力: `message`, `systemPrompt`, `conversationContext`
- モデル: `claude-sonnet-4-20250514`

---

## MCP（Model Context Protocol）と運用メモ

本リポジトリには直接の MCP 実装コードは含まれていませんが、以下の運用メモ・プロンプト設計ドキュメントが存在します。

- `CLAUDE.md`: 開発アシスタント（Claude Code）向けの作業方針。修正後は自動コミット/プッシュの運用を明記。
- `honne_prompt.md`: 「AI先生」用のシステムプロンプトテンプレート。関係性別の口調・構成・出力形式を定義。
- `heartfelt.md`: プロダクトのコンセプト/機能説明（非技術者向け）。

MCP（外部ツール統合）自体を導入する場合は、以下の方針が推奨です：
1. 使いたいツールを特定（例: Linear、GitHub、Database、Slack）
2. 実装場所の決定（Edge Functions や Route Handlers でのプロキシ）
3. 最小権限の API キー管理（Vercel / Supabase Config Vars）
4. 入出力の JSON スキーマ定義とバリデーション（zod 等）
5. 監査ログの保存（Supabase に操作ログテーブルを用意）

- 役割ベースの認可（RLS/Edge Functions 連携）。
- API ルートのサービス分割と入力バリデーション（zod 等）。
- 監視（ログ/メトリクス）とエラーハンドリングの標準化。


