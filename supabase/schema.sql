-- ============================================================
-- SAP NOW 웨비나 플랫폼 — Supabase Schema
-- ============================================================

-- ──────────────────────────────────────
-- 1. 등록자 테이블
-- ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS registrants (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                  TEXT NOT NULL,
  company               TEXT NOT NULL,
  email                 TEXT NOT NULL UNIQUE,
  phone                 TEXT NOT NULL,
  department            TEXT,
  title                 TEXT,
  privacy_agreed        BOOLEAN NOT NULL DEFAULT false,
  privacy_agreed_at     TIMESTAMPTZ,
  marketing_agreed      BOOLEAN NOT NULL DEFAULT false,
  marketing_agreed_at   TIMESTAMPTZ,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_registrants_email   ON registrants (email);
CREATE INDEX IF NOT EXISTS idx_registrants_created ON registrants (created_at DESC);

-- updated_at 자동 갱신 함수
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_registrants_updated_at
  BEFORE UPDATE ON registrants
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ──────────────────────────────────────
-- 2. 로그인 로그 테이블
-- ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS login_logs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  registrant_id   UUID NOT NULL REFERENCES registrants (id) ON DELETE CASCADE,
  login_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  ip_address      TEXT,
  user_agent      TEXT
);

CREATE INDEX IF NOT EXISTS idx_login_logs_registrant ON login_logs (registrant_id);
CREATE INDEX IF NOT EXISTS idx_login_logs_at         ON login_logs (login_at DESC);

-- ──────────────────────────────────────
-- 3. 시청 로그 테이블 (등록자 1인 1행)
-- ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS watch_logs (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  registrant_id         UUID NOT NULL UNIQUE REFERENCES registrants (id) ON DELETE CASCADE,
  first_access_at       TIMESTAMPTZ,
  last_access_at        TIMESTAMPTZ,
  total_watch_seconds   INTEGER NOT NULL DEFAULT 0,
  ip_address            TEXT,
  user_agent            TEXT,
  device_type           TEXT CHECK (device_type IN ('desktop', 'mobile', 'tablet', 'unknown'))
);

CREATE INDEX IF NOT EXISTS idx_watch_logs_registrant ON watch_logs (registrant_id);
CREATE INDEX IF NOT EXISTS idx_watch_logs_first      ON watch_logs (first_access_at DESC);
CREATE INDEX IF NOT EXISTS idx_watch_logs_seconds    ON watch_logs (total_watch_seconds);

-- ──────────────────────────────────────
-- 4. 관리자 계정 테이블
-- ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS admin_users (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email           TEXT NOT NULL UNIQUE,
  password_hash   TEXT NOT NULL,
  name            TEXT NOT NULL,
  role            TEXT NOT NULL CHECK (role IN ('super_admin', 'manager')),
  is_active       BOOLEAN NOT NULL DEFAULT true,
  last_login_at   TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_admin_users_email ON admin_users (email);

CREATE TRIGGER trg_admin_users_updated_at
  BEFORE UPDATE ON admin_users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ──────────────────────────────────────
-- 5. 행사 설정 테이블 (싱글 로우)
-- ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS event_settings (
  id                    INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  event_name            TEXT NOT NULL DEFAULT '웨비나',
  event_date            DATE,
  vimeo_video_id        TEXT,
  video_open_at         TIMESTAMPTZ,
  video_close_at        TIMESTAMPTZ,
  survey_url            TEXT,
  material_url          TEXT,
  contact_email         TEXT,
  contact_phone         TEXT,
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 초기 행 삽입 (이미 존재하면 무시)
INSERT INTO event_settings (id)
VALUES (1)
ON CONFLICT (id) DO NOTHING;

-- ──────────────────────────────────────
-- 6. Heartbeat RPC 함수
-- ──────────────────────────────────────
CREATE OR REPLACE FUNCTION increment_watch_seconds(
  p_registrant_id UUID,
  p_elapsed       INTEGER,
  p_now           TIMESTAMPTZ
)
RETURNS VOID AS $$
BEGIN
  UPDATE watch_logs
  SET
    total_watch_seconds = total_watch_seconds + p_elapsed,
    last_access_at      = p_now
  WHERE registrant_id = p_registrant_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ──────────────────────────────────────
-- 7. RLS 활성화
-- ──────────────────────────────────────
ALTER TABLE registrants    ENABLE ROW LEVEL SECURITY;
ALTER TABLE login_logs     ENABLE ROW LEVEL SECURITY;
ALTER TABLE watch_logs     ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users    ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_settings ENABLE ROW LEVEL SECURITY;

-- ──────────────────────────────────────
-- 7. RLS 정책: anon / authenticated 전면 차단
--    service_role은 RLS를 bypass하므로 API Route에서 정상 동작
-- ──────────────────────────────────────
DROP POLICY IF EXISTS "deny_all_registrants"    ON registrants;
DROP POLICY IF EXISTS "deny_all_login_logs"     ON login_logs;
DROP POLICY IF EXISTS "deny_all_watch_logs"     ON watch_logs;
DROP POLICY IF EXISTS "deny_all_admin_users"    ON admin_users;
DROP POLICY IF EXISTS "deny_all_event_settings" ON event_settings;

CREATE POLICY "deny_all_registrants"
  ON registrants FOR ALL TO anon, authenticated USING (false);

CREATE POLICY "deny_all_login_logs"
  ON login_logs FOR ALL TO anon, authenticated USING (false);

CREATE POLICY "deny_all_watch_logs"
  ON watch_logs FOR ALL TO anon, authenticated USING (false);

CREATE POLICY "deny_all_admin_users"
  ON admin_users FOR ALL TO anon, authenticated USING (false);

CREATE POLICY "deny_all_event_settings"
  ON event_settings FOR ALL TO anon, authenticated USING (false);
