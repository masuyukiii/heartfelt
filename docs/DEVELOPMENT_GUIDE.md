## 開発手順ガイド（ステップバイステップ）

初心者でも同じ環境を再現できるよう、日常の開発フローを手順化しました。

### 0. 最初に一度だけ
1. リポジトリをクローン
2. `npm ci` で依存関係を導入
3. `.env.local` を作成して Supabase/AI のキーを設定（詳細は `docs/SETUP.md`）

### 1. ローカル開発を始める
```bash
npm run dev
```
- ブラウザで `http://localhost:3000` を開く

### 2. 新しいページを作る（UI）
1. `app/your-page/page.tsx` を作成
2. `components/ui/*` から必要なコンポーネントをインポート
3. 必要に応じて `use client` を先頭に記述（クライアント側で動かすとき）

### 3. API を追加する（サーバ側）
1. `app/api/your-api/route.ts` を作成
2. `export async function POST(request: NextRequest)` など HTTP メソッドを実装
3. 外部 API を叩く際は `fetch` を使用し、例外処理とエラー応答を実装
4. 認証が必要なら `lib/supabase/server.ts` のクライアントを生成し、ユーザー確認

### 4. Supabase を使う
```ts
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data, error } = await supabase.from('your_table').select('*')
  // エラーハンドリングを忘れずに
}
```

### 5. 認証が必要なページを守る
- 既に `middleware.ts` が未ログイン時に `/auth/login` へ誘導
- 一部だけ例外にする場合は `middleware.ts` の `config.matcher` を調整

### 6. AI 機能を呼ぶ
- 既存例: `POST /api/positive-writer`（OpenAI/Claude）
- 既存例: `POST /api/claude-assistant`（systemPrompt を渡す汎用）
- `.env.local` に API キーを設定。未設定でもフォールバック動作あり

### 7. 変更をコミット・プッシュ
```bash
git add -A
git commit -m "feat: ..."
git push origin main
```

### 8. よくあるエラーと対策
- 401/403: セッションが無効。ログインや Cookie 設定を確認
- 500: 外部 API 応答不正。レスポンステキストを `console.error` で確認
- 型エラー: `npm run lint` で検出、型の明示と null チェックを徹底

### 9. フォルダ構成の小さなルール
- UI は `components/`、状態/ロジックは `app/..` または `lib/..`
- ファイル名・関数名は「意味が分かる英語」で統一


