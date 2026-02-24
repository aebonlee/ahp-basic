import { useState, useCallback, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';

/**
 * 설문 질문 CRUD
 */
export function useSurveyQuestions(projectId) {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(!!projectId);
  const questionsRef = useRef(questions);
  useEffect(() => { questionsRef.current = questions; }, [questions]);

  const fetchQuestions = useCallback(async () => {
    if (!projectId) { setLoading(false); return; }
    setLoading(true);
    const { data, error } = await supabase
      .from('survey_questions')
      .select('*')
      .eq('project_id', projectId)
      .order('sort_order');
    if (!error) setQuestions(data || []);
    setLoading(false);
  }, [projectId]);

  useEffect(() => { fetchQuestions(); }, [fetchQuestions]);

  const addQuestion = useCallback(async (question) => {
    const maxOrder = questionsRef.current.reduce((max, q) => Math.max(max, q.sort_order || 0), 0);
    const { data, error } = await supabase
      .from('survey_questions')
      .insert({
        project_id: projectId,
        question_text: question.question_text || '새 질문',
        question_type: question.question_type || 'short_text',
        options: question.options || [],
        required: question.required !== undefined ? question.required : true,
        sort_order: maxOrder + 1,
        ...(question.category ? { category: question.category } : {}),
      })
      .select()
      .single();
    if (error) throw error;
    setQuestions(prev => [...prev, data]);
    return data;
  }, [projectId]);

  const updateQuestion = useCallback(async (id, updates) => {
    const { data, error } = await supabase
      .from('survey_questions')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    setQuestions(prev => prev.map(q => q.id === id ? data : q));
    return data;
  }, []);

  const deleteQuestion = useCallback(async (id) => {
    const { error } = await supabase.from('survey_questions').delete().eq('id', id);
    if (error) throw error;
    setQuestions(prev => prev.filter(q => q.id !== id));
  }, []);

  const reorderQuestions = useCallback(async (reorderedIds) => {
    const updates = reorderedIds.map((id, idx) => ({ id, sort_order: idx }));
    await Promise.all(
      updates.map(u =>
        supabase.from('survey_questions').update({ sort_order: u.sort_order }).eq('id', u.id)
      )
    );
    setQuestions(prev => {
      const map = {};
      for (const q of prev) map[q.id] = q;
      return reorderedIds.map((id, idx) => ({ ...map[id], sort_order: idx }));
    });
  }, []);

  return { questions, loading, fetchQuestions, addQuestion, updateQuestion, deleteQuestion, reorderQuestions };
}

/**
 * 설문 응답 fetch (전체/평가자별)
 */
export function useSurveyResponses(projectId) {
  const [responses, setResponses] = useState([]);
  const [loading, setLoading] = useState(!!projectId);

  const fetchResponses = useCallback(async () => {
    if (!projectId) { setLoading(false); return; }
    setLoading(true);
    const { data, error } = await supabase
      .from('survey_responses')
      .select('*')
      .eq('project_id', projectId);
    if (!error) setResponses(data || []);
    setLoading(false);
  }, [projectId]);

  useEffect(() => { fetchResponses(); }, [fetchResponses]);

  const getResponsesByEvaluator = useCallback((evaluatorId) => {
    return responses.filter(r => r.evaluator_id === evaluatorId);
  }, [responses]);

  const getResponsesByQuestion = useCallback((questionId) => {
    return responses.filter(r => r.question_id === questionId);
  }, [responses]);

  const submitResponses = useCallback(async (evaluatorId, answers) => {
    // answers: { questionId: answerValue }
    const rows = Object.entries(answers).map(([questionId, answer]) => ({
      project_id: projectId,
      evaluator_id: evaluatorId,
      question_id: questionId,
      answer: typeof answer === 'object' ? answer : { value: answer },
    }));
    const { error } = await supabase
      .from('survey_responses')
      .upsert(rows, { onConflict: 'project_id,evaluator_id,question_id' });
    if (error) throw error;
    await fetchResponses();
  }, [projectId, fetchResponses]);

  return { responses, loading, fetchResponses, getResponsesByEvaluator, getResponsesByQuestion, submitResponses };
}

/**
 * 프로젝트 연구 소개/동의서 설정
 */
export function useSurveyConfig(projectId) {
  const [config, setConfig] = useState({ research_description: '', consent_text: '' });
  const [loading, setLoading] = useState(!!projectId);

  const fetchConfig = useCallback(async () => {
    if (!projectId) { setLoading(false); return; }
    setLoading(true);
    const { data, error } = await supabase
      .from('projects')
      .select('research_description, consent_text')
      .eq('id', projectId)
      .single();
    if (!error && data) {
      setConfig({
        research_description: data.research_description || '',
        consent_text: data.consent_text || '',
      });
    }
    setLoading(false);
  }, [projectId]);

  useEffect(() => { fetchConfig(); }, [fetchConfig]);

  const saveConfig = useCallback(async (updates) => {
    const { error } = await supabase
      .from('projects')
      .update(updates)
      .eq('id', projectId);
    if (error) throw error;
    setConfig(prev => ({ ...prev, ...updates }));
  }, [projectId]);

  return { config, loading, fetchConfig, saveConfig };
}

/**
 * 동의 기록 관리
 */
export function useConsentRecords(projectId) {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(!!projectId);

  const fetchRecords = useCallback(async () => {
    if (!projectId) { setLoading(false); return; }
    setLoading(true);
    const { data, error } = await supabase
      .from('consent_records')
      .select('*')
      .eq('project_id', projectId);
    if (!error) setRecords(data || []);
    setLoading(false);
  }, [projectId]);

  useEffect(() => { fetchRecords(); }, [fetchRecords]);

  const submitConsent = useCallback(async (evaluatorId) => {
    const { error } = await supabase
      .from('consent_records')
      .upsert({
        project_id: projectId,
        evaluator_id: evaluatorId,
        agreed: true,
        agreed_at: new Date().toISOString(),
      }, { onConflict: 'project_id,evaluator_id' });
    if (error) throw error;
    await fetchRecords();
  }, [projectId, fetchRecords]);

  const hasConsented = useCallback((evaluatorId) => {
    return records.some(r => r.evaluator_id === evaluatorId && r.agreed);
  }, [records]);

  return { records, loading, fetchRecords, submitConsent, hasConsented };
}
