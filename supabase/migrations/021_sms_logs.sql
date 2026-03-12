-- 021: SMS 발송 이력 테이블
-- 발송할 때마다 성공/실패 로그를 기록

CREATE TABLE IF NOT EXISTS sms_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id  UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  sender_id   UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient_name  TEXT NOT NULL DEFAULT '',
  recipient_phone TEXT NOT NULL,
  message     TEXT NOT NULL,
  sms_type    TEXT NOT NULL DEFAULT 'SMS' CHECK (sms_type IN ('SMS', 'LMS')),
  success     BOOLEAN NOT NULL DEFAULT true,
  error_message TEXT,
  sent_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS: 본인 발송 이력만 조회/삽입
ALTER TABLE sms_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sms_logs_select_own"
  ON sms_logs FOR SELECT
  USING (sender_id = auth.uid());

CREATE POLICY "sms_logs_insert_own"
  ON sms_logs FOR INSERT
  WITH CHECK (sender_id = auth.uid());

-- 프로젝트별 최신순 조회 인덱스
CREATE INDEX idx_sms_logs_project_sent
  ON sms_logs (project_id, sent_at DESC);
