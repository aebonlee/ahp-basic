import { useState, useCallback, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';

export function useEvaluators(projectId) {
  const [evaluators, setEvaluators] = useState([]);
  const [loading, setLoading] = useState(!!projectId);
  const [error, setError] = useState(null);

  const fetchEvaluators = useCallback(async () => {
    if (!projectId) { setLoading(false); return; }
    setLoading(true);
    setError(null);
    const { data, error: fetchError } = await supabase
      .from('evaluators')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at');
    if (fetchError) {
      setError(fetchError.message);
    } else {
      setEvaluators(data || []);
    }
    setLoading(false);
  }, [projectId]);

  useEffect(() => {
    fetchEvaluators();
  }, [fetchEvaluators]);

  const addEvaluator = useCallback(async (evaluator) => {
    // 이메일로 기존 가입 유저 찾아서 user_id 자동 연결
    let userId = null;
    if (evaluator.email) {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('email', evaluator.email)
        .single();
      if (profile) userId = profile.id;
    }
    const { data, error } = await supabase
      .from('evaluators')
      .insert({ ...evaluator, project_id: projectId, user_id: userId })
      .select()
      .single();
    if (error) throw error;
    setEvaluators(prev => [...prev, data]);
    return data;
  }, [projectId]);

  const updateEvaluator = useCallback(async (id, updates) => {
    const { data, error } = await supabase
      .from('evaluators')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    setEvaluators(prev => prev.map(e => e.id === id ? data : e));
    return data;
  }, []);

  const deleteEvaluator = useCallback(async (id) => {
    const { error } = await supabase.from('evaluators').delete().eq('id', id);
    if (error) throw error;
    setEvaluators(prev => prev.filter(e => e.id !== id));
  }, []);

  return { evaluators, loading, error, fetchEvaluators, addEvaluator, updateEvaluator, deleteEvaluator };
}
