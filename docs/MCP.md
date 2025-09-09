## MCP / AI運用ガイド

このドキュメントは、AI連携（OpenAI/Anthropic/将来のMCPツール）と、開発アシスタント運用の方針をまとめたものです。

### 現状の実装状況
- OpenAI: `POST /api/positive-writer` で `OPENAI_API_KEY` を利用（任意）
- Anthropic (Claude):
  - `POST /api/positive-writer` で `ANTHROPIC_API_KEY` を利用（任意）
  - `POST /api/claude-assistant` でテンプレ付き呼び出し
- システムプロンプト: `honne_prompt.md` に雛形
- 開発支援ガイド: `CLAUDE.md`（自動コミット/プッシュ方針を明記）

### 将来の MCP（Model Context Protocol）導入方針
MCP は「AI から外部ツールを安全に叩くための標準的な窓口」を提供します。導入時は以下の指針で進めます。

1. 対象ツールの洗い出し
   - 例: Linear（課題管理）、GitHub（PR/Issues）、Supabase（DB/Storage）、Slack（通知）

2. 認証と権限設計
   - 各ツールごとに最小権限の API キー/トークンを発行
   - Vercel/Supabase の環境変数として保存（Secret スコープ）

3. API ラッパ（Route Handler or Edge Function）
   - `app/api/tools/<tool>/route.ts` にラッパを定義
   - 入出力スキーマ定義（zod）と詳細なエラーハンドリング
   - 監査ログ（誰が・いつ・何を実行したか）を Supabase に保存

4. AI からの安全な呼び出し
   - AI にはラッパ API のみを公開
   - 明示的な操作単位（例: create_issue, update_issue）だけ許容
   - レート制限と CSRF 対策

5. 失敗時の回復戦略
   - 冪等化（同一 `requestId` で重複実行防止）
   - リトライ/バックオフ
   - エラー詳細は監査ログに記録、ユーザー向けには簡潔なメッセージ

### 参考実装（疑似コード）
```ts
// app/api/tools/linear/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const Body = z.object({ action: z.enum(['create_issue','update_issue','create_comment']), payload: z.any() })

export async function POST(req: NextRequest) {
  const { action, payload } = Body.parse(await req.json())
  // TODO: 認証/レート制限/監査ログ
  switch(action){
    case 'create_issue': /* call Linear REST */ break
    case 'update_issue': /* ... */ break
    case 'create_comment': /* ... */ break
  }
  return NextResponse.json({ ok: true })
}
```

### 運用メモ
- プロンプト改善や方針変更は `CLAUDE.md`/`honne_prompt.md` に追記
- 重要な判断は PR に記録（ラベル: `architecture` / `decision`）
- バグは `bug` ラベル、ドキュメント更新は `documentation` ラベル


