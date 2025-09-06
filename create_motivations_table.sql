-- Create motivations table
CREATE TABLE IF NOT EXISTS motivations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  user_name TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- Create RLS policy for motivations
ALTER TABLE motivations ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read all motivations (for team display)
CREATE POLICY "Users can read all motivations" ON motivations
  FOR SELECT USING (true);

-- Policy: Users can insert their own motivations
CREATE POLICY "Users can insert own motivations" ON motivations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own motivations
CREATE POLICY "Users can update own motivations" ON motivations
  FOR UPDATE USING (auth.uid() = user_id);

-- Policy: Users can delete their own motivations
CREATE POLICY "Users can delete own motivations" ON motivations
  FOR DELETE USING (auth.uid() = user_id);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc', NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_motivations_updated_at BEFORE UPDATE ON motivations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();