-- ことばライブラリテーブルを作成
CREATE TABLE IF NOT EXISTS word_library (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    message_content TEXT NOT NULL,
    message_type VARCHAR(20) NOT NULL CHECK (message_type IN ('thanks', 'honesty')),
    saved_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    original_sender_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- インデックスを作成（パフォーマンス向上のため）
CREATE INDEX IF NOT EXISTS word_library_user_id_idx ON word_library(user_id);
CREATE INDEX IF NOT EXISTS word_library_saved_at_idx ON word_library(saved_at DESC);
CREATE INDEX IF NOT EXISTS word_library_message_type_idx ON word_library(message_type);

-- Row Level Security (RLS) ポリシーを有効にする
ALTER TABLE word_library ENABLE ROW LEVEL SECURITY;

-- 既存のポリシーがある場合は削除（重複を避けるため）
DROP POLICY IF EXISTS "Users can only access their own word library" ON word_library;

-- 完全プライベート：ユーザーは自分のことばライブラリのみアクセス可能
CREATE POLICY "Users can only access their own word library" ON word_library
    FOR ALL USING (auth.uid() = user_id);

-- 更新時刻を自動更新するトリガー
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 既存のトリガーがある場合は削除（重複を避けるため）
DROP TRIGGER IF EXISTS update_word_library_updated_at ON word_library;

CREATE TRIGGER update_word_library_updated_at
    BEFORE UPDATE ON word_library
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 確認用のコメント
COMMENT ON TABLE word_library IS 'ユーザーが保存したメッセージのライブラリ。完全にプライベートで、各ユーザーは自分の保存したメッセージのみアクセス可能。';
COMMENT ON COLUMN word_library.message_content IS '保存されたメッセージの内容';
COMMENT ON COLUMN word_library.message_type IS 'メッセージの種類（thanks: ありがとう、honesty: 本音）';
COMMENT ON COLUMN word_library.original_sender_name IS '元のメッセージの送信者名（参考情報）';