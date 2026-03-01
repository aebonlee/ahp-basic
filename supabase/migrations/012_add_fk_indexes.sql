-- 012_add_fk_indexes.sql
-- 외래 키 컬럼에 인덱스 추가 — JOIN/WHERE 성능 개선
-- Supabase Dashboard SQL Editor에서 실행

-- projects
CREATE INDEX IF NOT EXISTS idx_projects_owner_id ON projects(owner_id);

-- criteria
CREATE INDEX IF NOT EXISTS idx_criteria_project_id ON criteria(project_id);
CREATE INDEX IF NOT EXISTS idx_criteria_parent_id ON criteria(parent_id);

-- alternatives
CREATE INDEX IF NOT EXISTS idx_alternatives_project_id ON alternatives(project_id);
CREATE INDEX IF NOT EXISTS idx_alternatives_parent_id ON alternatives(parent_id);

-- evaluators
CREATE INDEX IF NOT EXISTS idx_evaluators_project_id ON evaluators(project_id);
CREATE INDEX IF NOT EXISTS idx_evaluators_user_id ON evaluators(user_id);

-- pairwise_comparisons
CREATE INDEX IF NOT EXISTS idx_pairwise_comparisons_project_id ON pairwise_comparisons(project_id);
CREATE INDEX IF NOT EXISTS idx_pairwise_comparisons_evaluator_id ON pairwise_comparisons(evaluator_id);
CREATE INDEX IF NOT EXISTS idx_pairwise_comparisons_criterion_id ON pairwise_comparisons(criterion_id);

-- direct_input_values
CREATE INDEX IF NOT EXISTS idx_direct_input_values_project_id ON direct_input_values(project_id);
CREATE INDEX IF NOT EXISTS idx_direct_input_values_evaluator_id ON direct_input_values(evaluator_id);

-- survey_questions
CREATE INDEX IF NOT EXISTS idx_survey_questions_project_id ON survey_questions(project_id);

-- survey_responses
CREATE INDEX IF NOT EXISTS idx_survey_responses_project_id ON survey_responses(project_id);
CREATE INDEX IF NOT EXISTS idx_survey_responses_evaluator_id ON survey_responses(evaluator_id);

-- brainstorming_items
CREATE INDEX IF NOT EXISTS idx_brainstorming_items_project_id ON brainstorming_items(project_id);

-- consent_records
CREATE INDEX IF NOT EXISTS idx_consent_records_project_id ON consent_records(project_id);
