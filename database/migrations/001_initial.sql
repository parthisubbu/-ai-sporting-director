-- ============================================================
-- AI SPORTING DIRECTOR — INITIAL SCHEMA
-- ============================================================

-- Profiles (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email       TEXT NOT NULL,
  username    TEXT,
  avatar_url  TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Careers
CREATE TABLE IF NOT EXISTS careers (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  career_name  TEXT NOT NULL,
  club_name    TEXT,
  league       TEXT,
  season       TEXT,
  difficulty   TEXT,
  currency     TEXT DEFAULT 'EUR',
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

-- Career Uploads
CREATE TABLE IF NOT EXISTS career_uploads (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  career_id    UUID NOT NULL REFERENCES careers(id) ON DELETE CASCADE,
  filename     TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  file_size    BIGINT,
  status       TEXT DEFAULT 'uploaded' CHECK (status IN ('uploaded','processing','complete','failed')),
  error_msg    TEXT,
  uploaded_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Clubs
CREATE TABLE IF NOT EXISTS clubs (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  career_id      UUID NOT NULL REFERENCES careers(id) ON DELETE CASCADE,
  name           TEXT NOT NULL,
  league         TEXT,
  transfer_budget BIGINT DEFAULT 0,
  wage_budget    BIGINT DEFAULT 0,
  objectives     JSONB DEFAULT '[]',
  prestige       INTEGER DEFAULT 0,
  stadium        TEXT,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- Players (full universe — 18k+ per career)
CREATE TABLE IF NOT EXISTS players (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  career_id       UUID NOT NULL REFERENCES careers(id) ON DELETE CASCADE,
  ea_id           TEXT,                        -- original EA internal id
  name            TEXT NOT NULL,
  age             INTEGER,
  birth_date      DATE,
  nationality     TEXT,
  nationality2    TEXT,
  club_name       TEXT,
  league          TEXT,
  position        TEXT,
  alt_positions   TEXT[],
  overall         INTEGER,
  potential       INTEGER,
  value           BIGINT,
  wage            BIGINT,
  contract_end    TEXT,
  release_clause  BIGINT,
  weak_foot       INTEGER,
  skill_moves     INTEGER,
  work_rate_att   TEXT,
  work_rate_def   TEXT,
  foot            TEXT,
  height          INTEGER,
  weight          INTEGER,
  attributes      JSONB DEFAULT '{}',
  playstyles      JSONB DEFAULT '[]',
  playstyles_plus JSONB DEFAULT '[]',
  traits          JSONB DEFAULT '[]',
  development     JSONB DEFAULT '{}',
  injury          JSONB DEFAULT '{}',
  is_user_squad   BOOLEAN DEFAULT FALSE,
  is_youth        BOOLEAN DEFAULT FALSE,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- AI Reports
CREATE TABLE IF NOT EXISTS reports (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  career_id   UUID NOT NULL REFERENCES careers(id) ON DELETE CASCADE,
  type        TEXT NOT NULL CHECK (type IN ('squad','transfer','tactical','development','scouting','full')),
  title       TEXT,
  content     TEXT NOT NULL,
  metadata    JSONB DEFAULT '{}',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Conversations (AI Chat)
CREATE TABLE IF NOT EXISTS conversations (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  career_id    UUID NOT NULL REFERENCES careers(id) ON DELETE CASCADE,
  user_message TEXT NOT NULL,
  ai_response  TEXT NOT NULL,
  context_used JSONB DEFAULT '{}',
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ── Indexes ──────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_careers_user        ON careers(user_id);
CREATE INDEX IF NOT EXISTS idx_players_career      ON players(career_id);
CREATE INDEX IF NOT EXISTS idx_players_overall     ON players(career_id, overall DESC);
CREATE INDEX IF NOT EXISTS idx_players_potential   ON players(career_id, potential DESC);
CREATE INDEX IF NOT EXISTS idx_players_position    ON players(career_id, position);
CREATE INDEX IF NOT EXISTS idx_players_name        ON players USING gin(to_tsvector('english', name));
CREATE INDEX IF NOT EXISTS idx_players_squad       ON players(career_id, is_user_squad);
CREATE INDEX IF NOT EXISTS idx_clubs_career        ON clubs(career_id);
CREATE INDEX IF NOT EXISTS idx_reports_career      ON reports(career_id);
CREATE INDEX IF NOT EXISTS idx_conversations_career ON conversations(career_id);
CREATE INDEX IF NOT EXISTS idx_uploads_career      ON career_uploads(career_id);

-- ── Trigger: auto-create profile on signup ──────────────────
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email)
  VALUES (NEW.id, NEW.email)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ── Trigger: update careers.updated_at ──────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER careers_updated_at
  BEFORE UPDATE ON careers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
