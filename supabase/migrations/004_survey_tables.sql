-- 004: 인구통계학적 설문 기능 테이블

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
  created_at TIMESTAMPTZ DEFAULT now()
);

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

-- survey_questions: 프로젝트 소유자 CRUD + 누구나 SELECT
CREATE POLICY "survey_questions_owner_all" ON survey_questions
  FOR ALL USING (
    project_id IN (SELECT id FROM projects WHERE owner_id = auth.uid())
  );

CREATE POLICY "survey_questions_read" ON survey_questions
  FOR SELECT USING (true);

-- survey_responses: 프로젝트 소유자 SELECT + 평가자 본인 INSERT/SELECT
CREATE POLICY "survey_responses_owner_read" ON survey_responses
  FOR SELECT USING (
    project_id IN (SELECT id FROM projects WHERE owner_id = auth.uid())
  );

CREATE POLICY "survey_responses_evaluator_insert" ON survey_responses
  FOR INSERT WITH CHECK (
    evaluator_id IN (SELECT id FROM evaluators WHERE user_id = auth.uid())
  );

CREATE POLICY "survey_responses_evaluator_read" ON survey_responses
  FOR SELECT USING (
    evaluator_id IN (SELECT id FROM evaluators WHERE user_id = auth.uid())
  );

-- consent_records: 프로젝트 소유자 SELECT + 평가자 본인 INSERT/SELECT
CREATE POLICY "consent_records_owner_read" ON consent_records
  FOR SELECT USING (
    project_id IN (SELECT id FROM projects WHERE owner_id = auth.uid())
  );

CREATE POLICY "consent_records_evaluator_insert" ON consent_records
  FOR INSERT WITH CHECK (
    evaluator_id IN (SELECT id FROM evaluators WHERE user_id = auth.uid())
  );

CREATE POLICY "consent_records_evaluator_read" ON consent_records
  FOR SELECT USING (
    evaluator_id IN (SELECT id FROM evaluators WHERE user_id = auth.uid())
  );
