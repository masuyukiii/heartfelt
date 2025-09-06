import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { message } = await request.json();

    if (!message || typeof message !== "string") {
      return NextResponse.json(
        { error: "メッセージが必要です" },
        { status: 400 }
      );
    }

    // OpenAI API呼び出し（環境変数が設定されている場合）
    if (process.env.OPENAI_API_KEY) {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content: `あなたは「ポジティブライター」という名前のAI添削アシスタントです。
ユーザーからのメッセージを受け取り、以下の観点でより良い表現に添削してください：

1. より丁寧で相手への配慮が感じられる表現
2. ポジティブで建設的な印象を与える文章
3. 誤解を生みにくい明確な表現
4. 相手との関係性を大切にする言い回し

必ず以下の形式で回答してください：

📝 **添削案：**
[改善されたメッセージ]

✨ **ポイント：**
- [改善点1]
- [改善点2]
- [改善点3]

日本語で回答し、親しみやすい口調で説明してください。`
            },
            {
              role: "user",
              content: `以下のメッセージを添削してください：\n\n${message}`
            }
          ],
          max_tokens: 1000,
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data = await response.json();
      const assistantMessage = data.choices[0]?.message?.content;

      if (!assistantMessage) {
        throw new Error("APIからの応答が不正です");
      }

      return NextResponse.json({ message: assistantMessage });
    }

    // Claude API呼び出し（Anthropic API）
    if (process.env.ANTHROPIC_API_KEY) {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": process.env.ANTHROPIC_API_KEY,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-3-haiku-20240307",
          max_tokens: 1000,
          messages: [
            {
              role: "user",
              content: `あなたは「ポジティブライター」という名前のAI添削アシスタントです。
以下のメッセージをより良い表現に添削してください：

${message}

以下の観点で改善してください：
1. より丁寧で相手への配慮が感じられる表現
2. ポジティブで建設的な印象を与える文章
3. 誤解を生みにくい明確な表現
4. 相手との関係性を大切にする言い回し

必ず以下の形式で回答してください：

📝 **添削案：**
[改善されたメッセージ]

✨ **ポイント：**
- [改善点1]
- [改善点2]
- [改善点3]

日本語で回答し、親しみやすい口調で説明してください。`
            }
          ],
        }),
      });

      if (!response.ok) {
        throw new Error(`Claude API error: ${response.status}`);
      }

      const data = await response.json();
      const assistantMessage = data.content[0]?.text;

      if (!assistantMessage) {
        throw new Error("APIからの応答が不正です");
      }

      return NextResponse.json({ message: assistantMessage });
    }

    // API keyが設定されていない場合のフォールバック
    const fallbackResponse = `「${message}」を以下のようにより良い表現に添削しました：

📝 **添削案：**
「お疲れ様です。${message.length > 20 ? "お話しいただいた件" : "先ほどの件"}についてご相談があります。お時間のあるときに、少しお話しさせていただけますでしょうか。」

✨ **ポイント：**
- より丁寧で相手を配慮した表現に変更
- 相手の都合を考慮した伝え方
- ポジティブな印象を与える文章構成

⚠️ **注意：** APIが設定されていないため、模擬的な添削結果を表示しています。実際の添削機能を利用するには、環境変数にOPENAI_API_KEYまたはANTHROPIC_API_KEYを設定してください。`;

    return NextResponse.json({ message: fallbackResponse });

  } catch (error) {
    console.error("Positive writer API error:", error);
    return NextResponse.json(
      { 
        error: "申し訳ございません。添削中にエラーが発生しました。もう一度お試しください。",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}