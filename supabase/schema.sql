-- Create sessions table
CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  story TEXT NOT NULL,
  revealed BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '1 hour')
);

-- Create participants table
CREATE TABLE IF NOT EXISTS participants (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  is_host BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create votes table
CREATE TABLE IF NOT EXISTS votes (
  participant_id TEXT PRIMARY KEY REFERENCES participants(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  value TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_participants_session_id ON participants(session_id);
CREATE INDEX IF NOT EXISTS idx_votes_session_id ON votes(session_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);

-- Enable row level security
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (for demo purposes)
-- In a production environment, you would want more restrictive policies
CREATE POLICY "Allow public read access to sessions" ON sessions
FOR SELECT USING (true);

CREATE POLICY "Allow public insert access to sessions" ON sessions
FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update access to sessions" ON sessions
FOR UPDATE USING (true);

CREATE POLICY "Allow public read access to participants" ON participants
FOR SELECT USING (true);

CREATE POLICY "Allow public insert access to participants" ON participants
FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public read access to votes" ON votes
FOR SELECT USING (true);

CREATE POLICY "Allow public insert access to votes" ON votes
FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update access to votes" ON votes
FOR UPDATE USING (true);

CREATE POLICY "Allow public delete access to votes" ON votes
FOR DELETE USING (true);

