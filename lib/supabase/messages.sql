-- メッセージテーブルを作成
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

-- インデックスを作成（パフォーマンス向上）
CREATE INDEX IF NOT EXISTS messages_recipient_id_idx ON messages(recipient_id);
CREATE INDEX IF NOT EXISTS messages_sender_id_idx ON messages(sender_id);
CREATE INDEX IF NOT EXISTS messages_created_at_idx ON messages(created_at DESC);

-- Row Level Security (RLS) を有効化
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- ポリシーを作成
-- 受信者は自分宛のメッセージを閲覧可能
CREATE POLICY "Users can view messages sent to them" 
ON messages FOR SELECT 
USING (auth.uid() = recipient_id);

-- 送信者は自分が送ったメッセージを閲覧可能
CREATE POLICY "Users can view messages they sent" 
ON messages FOR SELECT 
USING (auth.uid() = sender_id);

-- ユーザーはメッセージを送信可能
CREATE POLICY "Users can send messages" 
ON messages FOR INSERT 
WITH CHECK (auth.uid() = sender_id);

-- 受信者は自分宛のメッセージの既読状態を更新可能
CREATE POLICY "Recipients can update read status" 
ON messages FOR UPDATE 
USING (auth.uid() = recipient_id) 
WITH CHECK (auth.uid() = recipient_id);