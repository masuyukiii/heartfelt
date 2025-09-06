import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Heart, MessageCircle, TreePine, Gift, CloudRain, Send } from "lucide-react";

export default async function ProtectedPage() {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims) {
    redirect("/auth/login");
  }

  // TODO: これらは実際のデータベースから取得する
  const mockData = {
    thanksPoints: 127,
    honestyPoints: 43,
    teamPoints: 285,
    userEmail: data.claims?.email || "ユーザー",
    // 成長ポイント（デモ用の仮値）
    growthPoints: 17,
    recentMessages: [
      { type: "thanks", message: "プレゼンの資料作成、お疲れ様でした！", from: "田中さん", time: "2時間前" },
      { type: "honest", message: "次回のミーティング、もう少し早めに準備を始めませんか？", to: "佐藤さん", time: "5時間前" }
    ]
  };

  // 6段階の成長システム（0, 1-3, 4-8, 9-15, 16-25, 25-30）
  const growthGoal = 30;
  const growthStages = [
    { label: "種", min: 0, max: 0 },
    { label: "芽", min: 1, max: 3 },
    { label: "小木", min: 4, max: 8 },
    { label: "大木", min: 9, max: 15 },
    { label: "花", min: 16, max: 25 },
    { label: "花・実", min: 26, max: 30 },
  ];
  const currentPoints = mockData.growthPoints;
  const clampedPoints = Math.max(0, Math.min(currentPoints, growthGoal));
  const currentStage = growthStages.find(s => clampedPoints >= s.min && clampedPoints <= s.max) || growthStages[growthStages.length - 1];
  const progressPercent = Math.round((clampedPoints / growthGoal) * 100);
  const currentIndex = growthStages.findIndex(s => s.label === currentStage.label);
  const pointsToNextStage = currentIndex >= growthStages.length - 1
    ? 0
    : Math.max(0, growthStages[currentIndex + 1].min - clampedPoints);

  return (
    <div className="flex-1 w-full px-4 py-6 max-w-md mx-auto">
      {/* モバイル向けヘッダー */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground mb-1">
          おかえりなさい、{mockData.userEmail.split('@')[0]}さん！
        </h1>
        <p className="text-sm text-muted-foreground">今日も心を通わせる一日にしましょう</p>
      </div>

      {/* ポイント状況（上部に配置） */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="space-y-2">
              <div className="flex items-center justify-center">
                <Heart className="text-pink-500" size={24} />
              </div>
              <div className="text-2xl font-bold text-pink-600">{mockData.thanksPoints}</div>
              <div className="text-xs text-muted-foreground">サンクス</div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-center">
                <MessageCircle className="text-blue-500" size={24} />
              </div>
              <div className="text-2xl font-bold text-blue-600">{mockData.honestyPoints}</div>
              <div className="text-xs text-muted-foreground">オネスティ</div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-center">
                <TreePine className="text-green-500" size={24} />
              </div>
              <div className="text-2xl font-bold text-green-600">{mockData.teamPoints}</div>
              <div className="text-xs text-muted-foreground">チーム</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* メインアクションボタン */}
      <div className="mb-6">
        <div className="grid grid-cols-2 gap-4">
          <Button size="lg" className="h-24 flex flex-col gap-2 bg-pink-500 hover:bg-pink-600 text-white">
            <Heart size={28} />
            <span className="text-base font-semibold">ありがとう</span>
          </Button>
          <Button size="lg" variant="outline" className="h-24 flex flex-col gap-2 border-2">
            <MessageCircle size={28} />
            <span className="text-base font-semibold">本音を伝える</span>
          </Button>
        </div>
      </div>

      {/* シンボルツリー（30点ゴール・6段階成長） */}
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <TreePine className="text-green-500" size={20} />
            みんなのシンボルツリー
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4">
            <div className="text-4xl">🌳</div>
            <div className="flex-1 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>現在の段階</span>
                <span className="font-semibold">{currentStage.label}</span>
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>成長度</span>
                <span>{clampedPoints}/{growthGoal}（{progressPercent}%）</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                <div className="bg-green-500 h-3 rounded-full" style={{ width: `${progressPercent}%` }}></div>
              </div>
              <div className="text-xs text-muted-foreground">次の段階まで {pointsToNextStage}点</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* AIアシスタント（縦積み） */}
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">AIアシスタント</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold">ココロポーター 🦉</h3>
              <Button size="sm" variant="outline">
                <Send size={14} className="mr-1" />
                依頼
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              伝えにくい気持ちを代わりにお届け
            </p>
          </div>
          <div className="p-4 bg-green-50 dark:bg-green-950 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold">ポジティブライター ✨</h3>
              <Button size="sm" variant="outline">
                <MessageCircle size={14} className="mr-1" />
                添削
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              メッセージをより良い表現に
            </p>
          </div>
        </CardContent>
      </Card>

      {/* ご褒美（ゴール30点に統一） */}
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Gift className="text-orange-500" size={20} />
            ご褒美
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">個人：カフェタイム</span>
              <Badge variant="outline" className="text-xs">30点</Badge>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div className="bg-orange-500 h-2 rounded-full" style={{ width: `${progressPercent}%` }}></div>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">チーム：ランチ会</span>
              <Badge variant="outline" className="text-xs">30点</Badge>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div className="bg-purple-500 h-2 rounded-full" style={{ width: `${progressPercent}%` }}></div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 最近の活動 */}
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">最近の活動</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {mockData.recentMessages.map((msg, index) => (
              <div key={index} className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                <div className={`p-1.5 rounded-full ${msg.type === 'thanks' ? 'bg-pink-100 dark:bg-pink-900' : 'bg-blue-100 dark:bg-blue-900'}`}>
                  {msg.type === 'thanks' ? <Heart size={14} className="text-pink-600" /> : <MessageCircle size={14} className="text-blue-600" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm leading-relaxed">{msg.message}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {msg.from ? `from ${msg.from}` : `to ${msg.to}`} • {msg.time}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 心の天気予報 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <CloudRain className="text-sky-500" size={20} />
            心の天気予報
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center space-y-3">
            <div className="text-5xl">☀️</div>
            <div className="space-y-2">
              <p className="text-base font-medium">今日の心の天気：快晴</p>
              <p className="text-sm text-muted-foreground">
                今日もポジティブな気持ちで過ごせそうです
              </p>
            </div>
            <Button size="sm" variant="outline" className="w-full">
              お守り言葉を見る
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
