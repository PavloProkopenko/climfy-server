-- 1. User preferences
CREATE TABLE IF NOT EXISTS user_preferences (
  user_id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  temperature_unit TEXT NOT NULL DEFAULT 'celsius',
  language         TEXT NOT NULL DEFAULT 'en',
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own preferences"
  ON user_preferences FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 2. Favorites
CREATE TABLE IF NOT EXISTS favorites (
  id        TEXT NOT NULL,
  user_id   UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  city_name TEXT NOT NULL,
  country   TEXT,
  state     TEXT,
  lat       DECIMAL NOT NULL,
  lon       DECIMAL NOT NULL,
  added_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (id, user_id)
);

ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own favorites"
  ON favorites FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 3. Search history
CREATE TABLE IF NOT EXISTS search_history (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  city_name   TEXT NOT NULL,
  country     TEXT,
  state       TEXT,
  lat         DECIMAL NOT NULL,
  lon         DECIMAL NOT NULL,
  searched_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE search_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own history"
  ON search_history FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX search_history_user_id_searched_at
  ON search_history(user_id, searched_at DESC);

-- 4. Recommendations cache
CREATE TABLE IF NOT EXISTS recommendations (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lat              DECIMAL NOT NULL,
  lon              DECIMAL NOT NULL,
  language         TEXT NOT NULL DEFAULT 'en',
  weather_snapshot JSONB NOT NULL,
  content          TEXT NOT NULL,
  is_ai            BOOLEAN NOT NULL DEFAULT false,
  generated_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at       TIMESTAMPTZ NOT NULL
);

ALTER TABLE recommendations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own recommendations"
  ON recommendations FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX recommendations_lookup
  ON recommendations(user_id, language, expires_at DESC);
