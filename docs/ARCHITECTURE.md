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
- 役割ベースの認可（RLS/Edge Functions 連携）。
- API ルートのサービス分割と入力バリデーション（zod 等）。
- 監視（ログ/メトリクス）とエラーハンドリングの標準化。


