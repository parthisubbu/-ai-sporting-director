-- ============================================================
-- ROW LEVEL SECURITY — Users only see their own data
-- ============================================================

ALTER TABLE profiles         ENABLE ROW LEVEL SECURITY;
ALTER TABLE careers          ENABLE ROW LEVEL SECURITY;
ALTER TABLE career_uploads   ENABLE ROW LEVEL SECURITY;
ALTER TABLE clubs            ENABLE ROW LEVEL SECURITY;
ALTER TABLE players          ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports          ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations    ENABLE ROW LEVEL SECURITY;

-- profiles
CREATE POLICY "own_profile" ON profiles FOR ALL
  USING (auth.uid() = id);

-- careers
CREATE POLICY "own_careers" ON careers FOR ALL
  USING (auth.uid() = user_id);

-- career_uploads (via career)
CREATE POLICY "own_uploads" ON career_uploads FOR ALL
  USING (career_id IN (SELECT id FROM careers WHERE user_id = auth.uid()));

-- clubs
CREATE POLICY "own_clubs" ON clubs FOR ALL
  USING (career_id IN (SELECT id FROM careers WHERE user_id = auth.uid()));

-- players
CREATE POLICY "own_players" ON players FOR ALL
  USING (career_id IN (SELECT id FROM careers WHERE user_id = auth.uid()));

-- reports
CREATE POLICY "own_reports" ON reports FOR ALL
  USING (career_id IN (SELECT id FROM careers WHERE user_id = auth.uid()));

-- conversations
CREATE POLICY "own_conversations" ON conversations FOR ALL
  USING (career_id IN (SELECT id FROM careers WHERE user_id = auth.uid()));

-- ── Storage bucket policy ────────────────────────────────────
CREATE POLICY "own_files" ON storage.objects FOR ALL
  USING (bucket_id = 'career-saves' AND auth.uid()::text = (storage.foldername(name))[1])
  WITH CHECK (bucket_id = 'career-saves' AND auth.uid()::text = (storage.foldername(name))[1]);
