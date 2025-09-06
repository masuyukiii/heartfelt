-- 既存ユーザーをprofilesテーブルに挿入
INSERT INTO profiles (id, email, name)
SELECT 
  id, 
  email,
  COALESCE(raw_user_meta_data->>'name', split_part(email, '@', 1))
FROM auth.users 
WHERE id NOT IN (SELECT id FROM profiles);