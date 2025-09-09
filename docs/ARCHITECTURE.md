# Heartfelt アプリケーション - 完全アーキテクチャ解説書

## 🎯 このドキュメントの目的
このドキュメントは、コードが読めない方でも理解できるように、Heartfeltアプリケーションの仕組みと作り方を詳しく解説します。

---

## 📱 アプリケーション概要

### このアプリは何？
**Heartfelt**は、職場でのコミュニケーションを良くするためのWebアプリケーションです。

主な機能：
- 💌 **感謝メッセージ機能** - 同僚に「ありがとう」を送る
- 💭 **本音メッセージ機能** - 匿名で改善提案や意見を送る
- ✨ **ポジティブライター** - AIがメッセージを優しい表現に添削
- 📚 **ワードライブラリー** - よく使う言葉やフレーズを保存

---

## 🏗️ 技術スタック（使っている技術）

### フロントエンド（見た目の部分）
- **Next.js 15** - Webサイトを作るための最新フレームワーク
- **React 19** - 画面を動的に作るライブラリ
- **TypeScript** - より安全にコードを書くための言語
- **Tailwind CSS** - デザインを簡単にするツール
- **shadcn/ui** - きれいなボタンやフォームの部品集

### バックエンド（裏側の処理）
- **Supabase** - データベースと認証を提供するサービス
  - PostgreSQL（データベース）
  - 認証システム（ログイン機能）
  - リアルタイムデータ同期
- **Claude AI (Anthropic)** - メッセージ添削AI
- **Vercel** - アプリを公開するためのホスティングサービス

### 開発ツール
- **Claude Code** - AIがコードを書いてくれるツール
- **Git/GitHub** - コードのバージョン管理
- **npm** - パッケージ（部品）管理ツール
- **MCP (Model Context Protocol)** - AIツールとの連携

---

## 🤖 MCP（Model Context Protocol）の役割

### MCPとは？
MCPは、Claude CodeなどのAIツールが外部サービスと連携するための仕組みです。

### このプロジェクトで使用しているMCP

#### 1. Supabase MCP
- **役割**：データベースとの直接連携
- **できること**：
  - テーブルの一覧表示（`list_tables`）
  - SQLの実行（`execute_sql`）
  - マイグレーションの適用（`apply_migration`）
  - プロジェクト一覧の取得（`list_projects`）

#### 2. Linear MCP（プロジェクト管理）
- **役割**：タスク管理ツールとの連携
- **できること**：
  - チーム一覧の取得（`list_teams`）
  - イシュー（タスク）の作成（`create_issue`）

#### 3. IDE MCP（VS Code連携）
- **役割**：エディタとの連携
- **できること**：
  - コードの診断（`getDiagnostics`）
  - Jupyterノートブックでのコード実行（`executeCode`）

### MCPの使い方（Claude Codeでの設定）
Claude Codeは自動的にこれらのMCPツールを使用しますが、設定は以下のように行います：

1. Claude Codeの設定画面を開く
2. MCPサーバーの追加
3. 必要な認証情報の入力

---

## 📂 フォルダ構造の詳細説明

```
heartfelt/
├── app/                    # ページファイル（画面）
│   ├── page.tsx           # トップページ
│   ├── auth/              # ログイン関連ページ
│   │   ├── login/         # ログイン画面
│   │   ├── sign-up/       # 新規登録画面
│   │   ├── forgot-password/ # パスワード忘れ
│   │   └── update-password/ # パスワード更新
│   ├── protected/         # ログイン必須ページ
│   │   └── library/       # ワードライブラリー
│   ├── positive-writer/   # ポジティブライター
│   └── api/               # API（データのやり取り）
│       ├── positive-writer/ # AI添削API
│       └── claude-assistant/ # Claude汎用API
│
├── components/            # 再利用できる部品
│   ├── ui/               # 基本的なUI部品
│   │   ├── button.tsx    # ボタン
│   │   ├── input.tsx     # 入力欄
│   │   ├── card.tsx      # カード
│   │   ├── label.tsx     # ラベル
│   │   ├── textarea.tsx  # テキストエリア
│   │   └── avatar.tsx    # アバター
│   ├── profile/          # プロフィール関連
│   └── debug/            # デバッグツール
│
├── lib/                   # 便利な機能をまとめたファイル
│   └── supabase/         # Supabase関連
│       ├── client.ts     # ブラウザ用の設定
│       ├── server.ts     # サーバー用の設定
│       ├── middleware.ts # 認証チェック
│       └── *-actions.ts  # 各種データ操作
│
├── docs/                 # ドキュメント
│   └── ARCHITECTURE.md   # このファイル
│
├── public/               # 画像などの静的ファイル
├── .env.local           # 環境変数（秘密の設定）
├── package.json         # プロジェクトの設定
├── vercel.json         # Vercelの設定
├── CLAUDE.md           # Claude Code用の指示書
└── middleware.ts       # 認証ミドルウェア
```

---

## 🔄 データの流れ

### 1. ユーザーがページにアクセス
```
ブラウザ → Vercel → Next.js → ページ表示
```

### 2. ログイン処理
```
ログインフォーム → Supabase認証 → セッション作成 → ダッシュボード
```

### 3. メッセージ送信
```
メッセージ入力 → Supabaseデータベース → 相手に通知
```

### 4. AI添削
```
テキスト入力 → Claude API → 添削結果 → 画面表示
```

---

## 🚀 ゼロから作る完全手順（ステップバイステップ）

### 準備編

#### 必要なアカウント（全部無料で始められます）
1. **GitHub** - https://github.com
2. **Vercel** - https://vercel.com
3. **Supabase** - https://supabase.com
4. **Anthropic** - https://console.anthropic.com （AI機能を使う場合）
5. **Linear** - https://linear.app （タスク管理を使う場合・オプション）

#### 必要なツール
1. **VS Code** - コードエディタ
2. **Node.js** - JavaScriptを動かすツール（バージョン18以上）
3. **Claude Code** - AIコーディングアシスタント
4. **Git** - バージョン管理ツール

---

### 第1章：プロジェクトの作成

#### 1. Next.jsプロジェクトを作る
```bash
# ターミナルで実行
npx create-next-app@latest heartfelt --typescript --tailwind --app
cd heartfelt
```

このコマンドで聞かれること：
- ESLint（コードチェッカー）を使う？ → **Yes**
- `src/`ディレクトリを使う？ → **No**
- カスタムインポートエイリアスを使う？ → **Yes**（デフォルトの`@/`）

#### 2. 必要なパッケージをインストール
```bash
# Supabase関連
npm install @supabase/supabase-js @supabase/ssr

# UI部品（shadcn/ui関連）
npm install @radix-ui/react-slot @radix-ui/react-label
npm install @radix-ui/react-dropdown-menu @radix-ui/react-checkbox
npm install @radix-ui/react-avatar
npm install class-variance-authority clsx tailwind-merge lucide-react

# テーマ切り替え
npm install next-themes

# 開発ツール
npm install -D tailwindcss-animate
```

---

### 第2章：Supabaseの設定

#### 1. Supabaseプロジェクトを作成
1. https://supabase.com にアクセス
2. 「Start your project」をクリック
3. GitHubでログイン
4. 「New project」をクリック
5. プロジェクト名：`heartfelt`
6. データベースパスワード：自動生成されたものを保存（重要！）
7. リージョン：`Northeast Asia (Tokyo)`を選択
8. 「Create new project」をクリック

#### 2. 環境変数を設定
Supabaseダッシュボード → Settings → API から以下をコピー：

`.env.local`ファイルを作成：
```env
# Supabase設定
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY=your_anon_key_here

# AI設定（オプション）
ANTHROPIC_API_KEY=your_anthropic_api_key_here

# アプリケーション設定
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

#### 3. データベーステーブルを作成
Supabaseダッシュボード → SQL Editor で`setup-database.sql`の内容を実行：

```sql
-- 1. プロファイルテーブルの作成
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE,
  email TEXT,
  name TEXT,
  department TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  PRIMARY KEY (id)
);

-- 2. メッセージテーブルの作成
CREATE TABLE IF NOT EXISTS messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  recipient_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('thanks', 'honesty')),
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Row Level Security（データ保護）を有効化
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- ポリシーの作成（誰がデータを見れるか設定）
CREATE POLICY "Public profiles are viewable by everyone." 
ON profiles FOR SELECT USING (true);

CREATE POLICY "Users can update own profile." 
ON profiles FOR UPDATE USING (auth.uid() = id);

-- 新規ユーザー登録時の自動処理
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1))
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- トリガーの作成
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

---

### 第3章：基本的なファイル作成

#### 1. Supabaseクライアントの設定

`lib/supabase/client.ts`:
```typescript
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY!
  )
}
```

`lib/supabase/server.ts`:
```typescript
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()
  
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        },
      },
    }
  )
}
```

#### 2. 認証ミドルウェアの設定

`middleware.ts`:
```typescript
import { updateSession } from '@/lib/supabase/middleware'
import { type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
```

---

### 第4章：Claude Codeの設定（重要！）

#### 1. CLAUDE.mdファイルの作成
プロジェクトルートに`CLAUDE.md`ファイルを作成：

```markdown
# CLAUDE.md

このファイルはClaude Codeへの指示書です。

## 重要：自動コミット＆プッシュの設定
修正が終わったら、commitとpushを自動でしてください

## 開発コマンド
- `npm run dev` - 開発サーバー起動（localhost:3000）
- `npm run build` - 本番ビルド
- `npm run lint` - コードチェック

## 作業時の注意点
1. 必ずテストを実行してから修正を完了する
2. エラーが出たら修正してから次に進む
3. 環境変数は.env.localに記載する
4. 機能追加時は必ずTypeScriptの型を定義する
```

#### 2. Claude CodeでMCPを設定

Claude Codeの設定でMCPサーバーを追加：

1. **Supabase MCP**
   - プロジェクトのURLとAPIキーを設定
   - データベース操作が可能に

2. **Linear MCP**（オプション）
   - APIキーを設定
   - タスク管理が可能に

3. **IDE連携**
   - VS Codeとの連携を有効化

---

### 第5章：UIコンポーネントの設定

#### 1. shadcn/uiをインストール
```bash
npx shadcn@latest init
```

設定で聞かれること：
- Which style would you like to use? → **New York**
- Which color would you like to use as base color? → **Neutral**
- Would you like to use CSS variables for colors? → **Yes**

#### 2. 必要なコンポーネントを追加
```bash
# 基本コンポーネント
npx shadcn@latest add button
npx shadcn@latest add input
npx shadcn@latest add card
npx shadcn@latest add label
npx shadcn@latest add textarea
npx shadcn@latest add dropdown-menu
npx shadcn@latest add checkbox
npx shadcn@latest add avatar
npx shadcn@latest add badge
```

---

### 第6章：ページの作成

#### 1. ログインページ
`app/auth/login/page.tsx`を作成

#### 2. ダッシュボード
`app/protected/page.tsx`を作成

#### 3. ポジティブライター
`app/positive-writer/page.tsx`を作成

---

### 第7章：Vercelへのデプロイ（公開）

#### 1. GitHubリポジトリの作成
```bash
# Gitの初期化
git init
git add .
git commit -m "Initial commit"

# GitHubで新しいリポジトリを作成してから
git remote add origin https://github.com/あなたのユーザー名/heartfelt.git
git branch -M main
git push -u origin main
```

#### 2. Vercelでデプロイ
1. https://vercel.com にアクセス
2. 「Import Project」をクリック
3. GitHubリポジトリを選択
4. 環境変数を設定（`.env.local`の内容をコピー）
5. 「Deploy」をクリック

#### 3. 自動デプロイの設定
`vercel.json`:
```json
{
  "git": {
    "deploymentEnabled": {
      "main": true
    }
  },
  "framework": "nextjs",
  "buildCommand": "rm -rf .next && npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm install --force",
  "outputDirectory": ".next"
}
```

#### 4. 自動コミット＆プッシュの設定

Claude Codeで作業する際の重要な設定：

1. **CLAUDE.mdに記載**（上記参照）
2. **Gitの認証設定**
   ```bash
   # GitHubのPersonal Access Tokenを設定
   git config --global user.name "あなたの名前"
   git config --global user.email "あなたのメール"
   ```

3. **Claude Codeでの作業フロー**
   - 修正を依頼
   - Claude Codeが自動で修正
   - 自動でgit add → commit → push
   - Vercelが自動でデプロイ

---

## 🎓 学習のポイント

### コードが読めなくても大丈夫！
1. **Claude Code**を使えば、日本語で指示するだけでコードを書いてくれます
2. **コピー＆ペースト**で基本的な部分は作れます
3. **エラーが出たら**Claude Codeに聞けば解決してくれます

### 重要な概念
- **コンポーネント**：画面の部品（ボタン、フォームなど）
- **API**：データをやり取りする仕組み
- **データベース**：情報を保存する場所
- **認証**：ログインの仕組み
- **デプロイ**：作ったアプリを公開すること
- **MCP**：AIツールと外部サービスをつなぐ仕組み

---

## 🔧 トラブルシューティング

### よくあるエラーと対処法

#### 1. 「Module not found」エラー
→ パッケージをインストールし忘れている
```bash
npm install [パッケージ名]
```

#### 2. 「Environment variable not found」エラー
→ `.env.local`ファイルに設定を追加
```bash
# .env.localファイルを確認
NEXT_PUBLIC_SUPABASE_URL=xxx
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY=xxx
```

#### 3. Supabaseの接続エラー
→ URLとAPIキーを確認
- Supabaseダッシュボード → Settings → API

#### 4. ビルドエラー
→ TypeScriptの型エラーを修正
```bash
npm run build  # エラー内容を確認
npm run lint   # コードチェック
```

#### 5. Vercelデプロイエラー
→ 環境変数の設定確認
- Vercelダッシュボード → Settings → Environment Variables

---

## 📚 参考リンク

### 公式ドキュメント
- [Next.js](https://nextjs.org/docs)
- [Supabase](https://supabase.com/docs)
- [Vercel](https://vercel.com/docs)
- [shadcn/ui](https://ui.shadcn.com)
- [Claude Code](https://claude.ai/code)

### 学習リソース
- [Next.js チュートリアル（日本語）](https://nextjs.org/learn)
- [Supabase チュートリアル](https://supabase.com/docs/guides/getting-started)
- [Tailwind CSS](https://tailwindcss.com/docs)

---

## 💡 開発のコツ

### 1. 小さく始める
最初から全機能を作ろうとせず、ログイン機能だけ、メッセージ送信だけ、と機能を絞って作る

### 2. エラーを恐れない
エラーは学習のチャンス。Claude Codeに聞けば解決方法を教えてくれる

### 3. コピペOK
動くコードをコピーして、少しずつカスタマイズしていく

### 4. 定期的にコミット（Claude Codeなら自動！）
```bash
# 手動の場合
git add .
git commit -m "何を変更したか"
git push

# Claude Codeなら自動でやってくれる！
```

### 5. 環境変数は安全に
- `.env.local`ファイルは絶対にGitHubに上げない
- `.gitignore`に含まれているか確認
- Vercelには別途設定する

### 6. MCPを活用
- Supabase MCPでデータベース操作を簡単に
- Linear MCPでタスク管理
- IDE連携でコード診断

---

## 🚦 次のステップ

### 機能追加のアイデア
1. **通知機能** - メッセージが来たらメール通知
2. **いいね機能** - メッセージに反応できる
3. **統計機能** - 送受信したメッセージの統計
4. **チーム機能** - 部署ごとのグループ作成
5. **モバイルアプリ** - React Nativeで作成

### 学習を続けるために
1. **小さな機能から追加**していく
2. **Claude Code**と一緒に開発
3. **エラーが出たら調べる**習慣をつける
4. **他の人のコード**を読んでみる
5. **定期的にアップデート**する

---

## 📝 まとめ

このアプリケーションは、最新の技術を使いながらも、シンプルで理解しやすい構造になっています。

**重要なポイント：**
- Supabaseが認証とデータベースを担当
- Next.jsが画面表示を担当
- Vercelが公開を担当
- Claude AIがメッセージ添削を担当
- MCPが外部サービス連携を担当
- Claude Codeが開発を自動化

**特に重要な設定：**
1. **CLAUDE.md**ファイルで自動コミット＆プッシュを設定
2. **MCP**でSupabaseやLinearと連携
3. **環境変数**を正しく設定
4. **Vercel**で自動デプロイ

コードが読めなくても、これらのサービスを組み合わせることで、本格的なWebアプリケーションが作れます。

**困ったときは：**
1. Claude Codeに聞く（自動で修正してくれる）
2. 公式ドキュメントを見る
3. エラーメッセージをコピーして検索
4. 小さく分けて問題を解決

**Claude Codeを使うメリット：**
- 日本語で指示するだけ
- 自動でコミット＆プッシュ
- エラーも自動で修正
- MCPで外部サービスと連携

頑張って開発を続けてください！ 🎉