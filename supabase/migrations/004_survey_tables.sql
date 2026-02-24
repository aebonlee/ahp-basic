-- ============================================
-- 004: 인구통계학적 설문 기능 테이블
-- ============================================
-- ※ Supabase 자동 마이그레이션이 아닌, SQL Editor에서 수동 실행 필요
-- ※ Supabase Dashboard → SQL Editor → 이 파일 내용 붙여넣기 → Run
-- ============================================

-- projects 테이블에 연구 소개/동의서 컬럼 추가
ALTER TABLE projects ADD COLUMN IF NOT EXISTS research_description TEXT DEFAULT '';
ALTER TABLE projects ADD COLUMN IF NOT EXISTS consent_text TEXT DEFAULT '';

-- 설문 질문
CREATE TABLE IF NOT EXISTS survey_questions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  question_type TEXT NOT NULL CHECK (question_type IN
    ('short_text','long_text','radio','checkbox','dropdown','number','likert')),
  options JSONB DEFAULT '[]',
  required BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  category TEXT NOT NULL DEFAULT 'demographic' CHECK (category IN ('demographic','custom')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ※ 기존 테이블이 이미 존재하는 경우 category 컬럼만 추가
ALTER TABLE survey_questions ADD COLUMN IF NOT EXISTS
  category TEXT NOT NULL DEFAULT 'demographic' CHECK (category IN ('demographic','custom'));

-- 설문 응답
CREATE TABLE IF NOT EXISTS survey_responses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  evaluator_id UUID REFERENCES evaluators(id) ON DELETE CASCADE,
  question_id UUID REFERENCES survey_questions(id) ON DELETE CASCADE,
  answer JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(project_id, evaluator_id, question_id)
);

-- 동의 기록
CREATE TABLE IF NOT EXISTS consent_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  evaluator_id UUID REFERENCES evaluators(id) ON DELETE CASCADE,
  agreed BOOLEAN NOT NULL DEFAULT false,
  agreed_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(project_id, evaluator_id)
);

-- RLS 활성화
ALTER TABLE survey_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE survey_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE consent_records ENABLE ROW LEVEL SECURITY;

-- ============================================
-- survey_questions: 프로젝트 소유자 CRUD + 누구나 SELECT
-- ============================================
DROP POLICY IF EXISTS "survey_questions_owner_all" ON public.survey_questions;
DROP POLICY IF EXISTS "survey_questions_read" ON public.survey_questions;

CREATE POLICY "sq_owner_select" ON public.survey_questions
  FOR SELECT USING (public.is_project_owner(project_id));

CREATE POLICY "sq_owner_insert" ON public.survey_questions
  FOR INSERT WITH CHECK (public.is_project_owner(project_id));

CREATE POLICY "sq_owner_update" ON public.survey_questions
  FOR UPDATE USING (public.is_project_owner(project_id));

CREATE POLICY "sq_owner_delete" ON public.survey_questions
  FOR DELETE USING (public.is_project_owner(project_id));

-- 평가자(누구나 인증된 사용자)도 질문 조회 가능
CREATE POLICY "sq_authenticated_select" ON public.survey_questions
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- ============================================
-- survey_responses: 소유자 SELECT + 평가자 본인 CRUD
-- ============================================
DROP POLICY IF EXISTS "survey_responses_owner_read" ON public.survey_responses;
DROP POLICY IF EXISTS "survey_responses_evaluator_insert" ON public.survey_responses;
DROP POLICY IF EXISTS "survey_responses_evaluator_read" ON public.survey_responses;

CREATE POLICY "sr_owner_select" ON public.survey_responses
  FOR SELECT USING (public.is_project_owner(project_id));

CREATE POLICY "sr_evaluator_select" ON public.survey_responses
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.evaluators
      WHERE evaluators.id = survey_responses.evaluator_id
      AND evaluators.user_id = auth.uid()
    )
  );

CREATE POLICY "sr_evaluator_insert" ON public.survey_responses
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.evaluators
      WHERE evaluators.id = survey_responses.evaluator_id
      AND evaluators.user_id = auth.uid()
    )
  );

CREATE POLICY "sr_evaluator_update" ON public.survey_responses
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.evaluators
      WHERE evaluators.id = survey_responses.evaluator_id
      AND evaluators.user_id = auth.uid()
    )
  );

CREATE POLICY "sr_evaluator_delete" ON public.survey_responses
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.evaluators
      WHERE evaluators.id = survey_responses.evaluator_id
      AND evaluators.user_id = auth.uid()
    )
  );

-- ============================================
-- consent_records: 소유자 SELECT + 평가자 본인 CRUD
-- ============================================
DROP POLICY IF EXISTS "consent_records_owner_read" ON public.consent_records;
DROP POLICY IF EXISTS "consent_records_evaluator_insert" ON public.consent_records;
DROP POLICY IF EXISTS "consent_records_evaluator_read" ON public.consent_records;

CREATE POLICY "cr_owner_select" ON public.consent_records
  FOR SELECT USING (public.is_project_owner(project_id));

CREATE POLICY "cr_evaluator_select" ON public.consent_records
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.evaluators
      WHERE evaluators.id = consent_records.evaluator_id
      AND evaluators.user_id = auth.uid()
    )
  );

CREATE POLICY "cr_evaluator_insert" ON public.consent_records
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.evaluators
      WHERE evaluators.id = consent_records.evaluator_id
      AND evaluators.user_id = auth.uid()
    )
  );

CREATE POLICY "cr_evaluator_update" ON public.consent_records
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.evaluators
      WHERE evaluators.id = consent_records.evaluator_id
      AND evaluators.user_id = auth.uid()
    )
  );

CREATE POLICY "cr_evaluator_delete" ON public.consent_records
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.evaluators
      WHERE evaluators.id = consent_records.evaluator_id
      AND evaluators.user_id = auth.uid()
    )
  );
