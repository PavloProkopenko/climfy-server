-- Run this in Supabase Studio → SQL Editor (after migrations.sql)

ALTER TABLE user_preferences
  ADD COLUMN IF NOT EXISTS first_name           TEXT,
  ADD COLUMN IF NOT EXISTS age                  INTEGER,
  ADD COLUMN IF NOT EXISTS activity_type        TEXT DEFAULT 'light',
  ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN NOT NULL DEFAULT false;
