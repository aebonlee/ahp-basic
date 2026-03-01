/**
 * 통계분석용 데이터 준비 훅
 * 설문 질문/응답에서 변수 목록을 분류하고 데이터 배열을 추출
 */
import { useState, useMemo, useCallback } from 'react';
import { useSurveyQuestions, useSurveyResponses } from './useSurvey';

const NUMERIC_TYPES = ['number', 'likert'];
const CATEGORICAL_TYPES = ['radio', 'dropdown', 'checkbox'];

export function useStatisticalAnalysis(projectId) {
  const { questions, loading: qLoading } = useSurveyQuestions(projectId);
  const { responses, loading: rLoading } = useSurveyResponses(projectId);
  const [analysisType, setAnalysisType] = useState(null);

  const loading = qLoading || rLoading;

  // 변수 분류
  const variables = useMemo(() => {
    const numeric = [];
    const categorical = [];

    for (const q of questions) {
      const varInfo = {
        id: q.id,
        label: q.question_text || `질문 ${q.sort_order + 1}`,
        type: q.question_type,
        options: q.options || [],
        sortOrder: q.sort_order,
      };

      if (NUMERIC_TYPES.includes(q.question_type)) {
        numeric.push(varInfo);
      } else if (CATEGORICAL_TYPES.includes(q.question_type)) {
        categorical.push(varInfo);
      }
      // short_text, long_text는 분석 제외
    }

    return { numeric, categorical, all: [...numeric, ...categorical] };
  }, [questions]);

  // 응답자 수
  const respondentCount = useMemo(() => {
    const ids = new Set(responses.map(r => r.evaluator_id));
    return ids.size;
  }, [responses]);

  // 질문별 응답 수
  const responseCounts = useMemo(() => {
    const counts = {};
    for (const r of responses) {
      counts[r.question_id] = (counts[r.question_id] || 0) + 1;
    }
    return counts;
  }, [responses]);

  // 특정 질문의 수치 데이터 추출
  const getNumericValues = useCallback((questionId) => {
    return responses
      .filter(r => r.question_id === questionId)
      .map(r => {
        const v = r.answer?.value;
        return typeof v === 'number' ? v : Number(v);
      })
      .filter(v => !isNaN(v) && v !== null);
  }, [responses]);

  // 특정 질문의 범주형 데이터 추출
  const getCategoricalValues = useCallback((questionId) => {
    return responses
      .filter(r => r.question_id === questionId)
      .map(r => {
        const v = r.answer?.value;
        return Array.isArray(v) ? v.join(', ') : String(v ?? '');
      })
      .filter(v => v !== '' && v !== 'undefined' && v !== 'null');
  }, [responses]);

  // 그룹변수 기준으로 수치 데이터를 그룹별 분할
  const getGroupedNumericValues = useCallback((groupQuestionId, valueQuestionId) => {
    const evaluatorMap = {};

    // 그룹 변수 매핑
    for (const r of responses) {
      if (r.question_id === groupQuestionId) {
        const v = r.answer?.value;
        evaluatorMap[r.evaluator_id] = {
          ...evaluatorMap[r.evaluator_id],
          group: Array.isArray(v) ? [...v].sort().join(', ') : String(v ?? ''),
        };
      }
      if (r.question_id === valueQuestionId) {
        const v = r.answer?.value;
        const num = typeof v === 'number' ? v : Number(v);
        if (!isNaN(num)) {
          evaluatorMap[r.evaluator_id] = {
            ...evaluatorMap[r.evaluator_id],
            value: num,
          };
        }
      }
    }

    // 그룹별 분류
    const groups = {};
    for (const ev of Object.values(evaluatorMap)) {
      if (ev.group && ev.value !== undefined) {
        if (!groups[ev.group]) groups[ev.group] = [];
        groups[ev.group].push(ev.value);
      }
    }

    return Object.entries(groups).map(([label, values]) => ({ label, values }));
  }, [responses]);

  // 크론바흐 알파용: 여러 문항의 응답 행렬
  const getItemMatrix = useCallback((questionIds) => {
    // 응답자별 문항별 값
    const evaluatorMap = {};
    for (const r of responses) {
      if (questionIds.includes(r.question_id)) {
        if (!evaluatorMap[r.evaluator_id]) evaluatorMap[r.evaluator_id] = {};
        const v = r.answer?.value;
        const num = typeof v === 'number' ? v : Number(v);
        if (!isNaN(num)) {
          evaluatorMap[r.evaluator_id][r.question_id] = num;
        }
      }
    }

    // 모든 문항에 응답한 평가자만
    const matrix = [];
    for (const [, answers] of Object.entries(evaluatorMap)) {
      if (questionIds.every(qid => answers[qid] !== undefined)) {
        matrix.push(questionIds.map(qid => answers[qid]));
      }
    }
    return matrix;
  }, [responses]);

  // 두 변수의 대응 데이터 추출 (같은 평가자)
  const getPairedValues = useCallback((qId1, qId2) => {
    const map1 = {}, map2 = {};
    for (const r of responses) {
      if (r.question_id === qId1) {
        const v = r.answer?.value;
        const num = typeof v === 'number' ? v : Number(v);
        if (!isNaN(num)) map1[r.evaluator_id] = num;
      }
      if (r.question_id === qId2) {
        const v = r.answer?.value;
        const num = typeof v === 'number' ? v : Number(v);
        if (!isNaN(num)) map2[r.evaluator_id] = num;
      }
    }

    const vals1 = [], vals2 = [];
    for (const evId of Object.keys(map1)) {
      if (map2[evId] !== undefined) {
        vals1.push(map1[evId]);
        vals2.push(map2[evId]);
      }
    }
    return { values1: vals1, values2: vals2 };
  }, [responses]);

  return {
    loading,
    questions,
    responses,
    variables,
    respondentCount,
    responseCounts,
    analysisType,
    setAnalysisType,
    getNumericValues,
    getCategoricalValues,
    getGroupedNumericValues,
    getItemMatrix,
    getPairedValues,
  };
}
