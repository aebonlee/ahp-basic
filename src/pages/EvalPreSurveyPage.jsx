import { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../hooks/useAuth';
import { useEvaluators } from '../hooks/useEvaluators';
import { useSurveyQuestions, useSurveyConfig, useSurveyResponses, useConsentRecords } from '../hooks/useSurvey';
import { EVAL_METHOD } from '../lib/constants';
import { findEvaluatorId } from '../lib/evaluatorUtils';
import { useToast } from '../contexts/ToastContext';
import PageLayout from '../components/layout/PageLayout';
import LoadingSpinner from '../components/common/LoadingSpinner';
import Button from '../components/common/Button';
import styles from './EvalPreSurveyPage.module.css';

const STEP_LABELS = ['연구 소개', '동의서', '설문 응답'];

export default function EvalPreSurveyPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { evaluators } = useEvaluators(id);
  const { questions, loading: qLoading } = useSurveyQuestions(id);
  const { config, loading: cLoading } = useSurveyConfig(id);
  const { submitResponses } = useSurveyResponses(id);
  const { submitConsent, hasConsented } = useConsentRecords(id);

  const toast = useToast();
  const [step, setStep] = useState(0); // 0: 연구소개, 1: 동의, 2: 설문
  const [agreed, setAgreed] = useState(false);
  const [answers, setAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});

  const evaluatorId = useMemo(() => {
    return findEvaluatorId(evaluators, user, id);
  }, [evaluators, user?.id, id]);

  // 프로젝트 eval_method 로드
  const [evalMethod, setEvalMethod] = useState(null);
  useEffect(() => {
    if (!id) return;
    supabase.from('projects').select('eval_method').eq('id', id).single()
      .then(({ data }) => { if (data) setEvalMethod(data.eval_method); });
  }, [id]);

  // 이미 설문 완료한 경우 스킵
  useEffect(() => {
    if (!evaluatorId || qLoading) return;

    const checkCompleted = async () => {
      const { data } = await supabase
        .from('survey_responses')
        .select('id')
        .eq('project_id', id)
        .eq('evaluator_id', evaluatorId)
        .limit(1);

      if (data && data.length > 0) {
        navigateToEval();
      }
    };
    checkCompleted();
  }, [evaluatorId, qLoading, id]);

  const navigateToEval = useCallback(() => {
    if (evalMethod === EVAL_METHOD.DIRECT_INPUT) {
      navigate(`/eval/project/${id}/direct`, { replace: true });
    } else {
      navigate(`/eval/project/${id}`, { replace: true });
    }
  }, [navigate, id, evalMethod]);

  const handleConsent = async () => {
    if (!evaluatorId) return;
    setSubmitting(true);
    try {
      await submitConsent(evaluatorId);
      setStep(2);
    } catch (e) {
      toast.error('동의 저장 실패: ' + e.message);
    }
    setSubmitting(false);
  };

  const handleAnswer = (questionId, value) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
    setValidationErrors(prev => ({ ...prev, [questionId]: null }));
  };

  const validate = () => {
    const errors = {};
    for (const q of questions) {
      if (!q.required) continue;
      const ans = answers[q.id];
      if (ans === undefined || ans === null || ans === '') {
        errors[q.id] = '필수 항목입니다';
      } else if (Array.isArray(ans) && ans.length === 0) {
        errors[q.id] = '하나 이상 선택해주세요';
      }
    }
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmitSurvey = async () => {
    if (!validate() || !evaluatorId) return;
    setSubmitting(true);
    try {
      await submitResponses(evaluatorId, answers);
      navigateToEval();
    } catch (e) {
      toast.error('설문 제출 실패: ' + e.message);
    }
    setSubmitting(false);
  };

  if (qLoading || cLoading) {
    return <PageLayout><LoadingSpinner message="설문 로딩 중..." /></PageLayout>;
  }

  // 설문이 없으면 바로 스킵
  if (questions.length === 0 && !config.research_description && !config.consent_text) {
    navigateToEval();
    return <PageLayout><LoadingSpinner message="평가 페이지로 이동 중..." /></PageLayout>;
  }

  // 동의서가 없으면 2단계 스킵
  const hasConsent = !!config.consent_text;
  // 연구 소개가 없으면 1단계 스킵
  const hasIntro = !!config.research_description;

  const effectiveSteps = [];
  if (hasIntro) effectiveSteps.push(0);
  if (hasConsent) effectiveSteps.push(1);
  if (questions.length > 0) effectiveSteps.push(2);

  // 현재 단계가 없는 단계면 다음으로
  if (!effectiveSteps.includes(step)) {
    const next = effectiveSteps.find(s => s > step) ?? effectiveSteps[0];
    if (next !== undefined && next !== step) {
      setTimeout(() => setStep(next), 0);
    }
  }

  return (
    <PageLayout>
      <div className={styles.container}>
        {/* 스텝 인디케이터 */}
        <div className={styles.steps}>
          {STEP_LABELS.map((label, i) => {
            if (!effectiveSteps.includes(i)) return null;
            return (
              <div key={i} className={styles.step} data-active={step === i ? 'true' : 'false'} data-done={step > i ? 'true' : 'false'}>
                <span className={styles.stepDot}>{step > i ? '✓' : i + 1}</span>
                {label}
              </div>
            );
          })}
        </div>

        {/* Step 0: 연구 소개 */}
        {step === 0 && hasIntro && (
          <div className={styles.card}>
            <h2 className={styles.sectionTitle}>연구 소개</h2>
            <div className={styles.descriptionBox}>
              {config.research_description}
            </div>
            <div className={styles.actions}>
              <Button onClick={() => {
                const next = effectiveSteps.find(s => s > 0);
                setStep(next !== undefined ? next : 0);
              }}>
                다음
              </Button>
            </div>
          </div>
        )}

        {/* Step 1: 동의서 */}
        {step === 1 && hasConsent && (
          <div className={styles.card}>
            <h2 className={styles.sectionTitle}>개인정보 수집 동의</h2>
            <div className={styles.consentBox}>
              {config.consent_text}
            </div>
            <label className={styles.consentCheck}>
              <input
                type="checkbox"
                checked={agreed}
                onChange={e => setAgreed(e.target.checked)}
              />
              위 내용을 읽었으며, 이에 동의합니다.
            </label>
            <div className={styles.actions}>
              {hasIntro && (
                <Button variant="secondary" onClick={() => setStep(0)}>이전</Button>
              )}
              <Button onClick={handleConsent} disabled={!agreed} loading={submitting}>
                동의합니다
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: 설문 */}
        {step === 2 && questions.length > 0 && (
          <>
            <div className={styles.card}>
              <h2 className={styles.sectionTitle}>인구통계학적 설문</h2>
              <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: 'var(--spacing-sm)' }}>
                * 표시는 필수 항목입니다.
              </p>
            </div>

            {questions.map((q, idx) => (
              <div key={q.id} className={styles.questionBlock}>
                <div className={styles.questionLeftBar} />
                <div className={styles.questionInner}>
                  <div className={styles.questionLabel}>
                    {q.question_text}
                    {q.required && <span className={styles.required}> *</span>}
                  </div>
                  <QuestionInput
                    question={q}
                    value={answers[q.id]}
                    onChange={val => handleAnswer(q.id, val)}
                  />
                  {validationErrors[q.id] && (
                    <div className={styles.validationMsg}>{validationErrors[q.id]}</div>
                  )}
                </div>
              </div>
            ))}

            <div className={styles.actions}>
              {(hasConsent || hasIntro) && (
                <Button variant="secondary" onClick={() => {
                  const prev = [...effectiveSteps].reverse().find(s => s < 2);
                  if (prev !== undefined) setStep(prev);
                }}>
                  이전
                </Button>
              )}
              <Button onClick={handleSubmitSurvey} loading={submitting}>
                제출 후 평가 시작
              </Button>
            </div>
          </>
        )}
      </div>
    </PageLayout>
  );
}

function QuestionInput({ question, value, onChange }) {
  const { question_type, options = [] } = question;

  switch (question_type) {
    case 'short_text':
      return (
        <input
          type="text"
          className={styles.textInput}
          value={value || ''}
          onChange={e => onChange(e.target.value)}
          placeholder="내 답변"
        />
      );

    case 'long_text':
      return (
        <textarea
          className={styles.textArea}
          value={value || ''}
          onChange={e => onChange(e.target.value)}
          placeholder="내 답변"
        />
      );

    case 'radio':
      return (
        <div className={styles.radioGroup}>
          {options.map((opt, i) => (
            <label key={i} className={styles.radioLabel}>
              <input
                type="radio"
                name={question.id}
                checked={value === opt}
                onChange={() => onChange(opt)}
              />
              {opt}
            </label>
          ))}
        </div>
      );

    case 'checkbox':
      return (
        <div className={styles.checkboxGroup}>
          {options.map((opt, i) => {
            const selected = Array.isArray(value) ? value : [];
            return (
              <label key={i} className={styles.checkLabel}>
                <input
                  type="checkbox"
                  checked={selected.includes(opt)}
                  onChange={e => {
                    if (e.target.checked) {
                      onChange([...selected, opt]);
                    } else {
                      onChange(selected.filter(v => v !== opt));
                    }
                  }}
                />
                {opt}
              </label>
            );
          })}
        </div>
      );

    case 'dropdown':
      return (
        <select
          className={styles.selectInput}
          value={value || ''}
          onChange={e => onChange(e.target.value)}
        >
          <option value="">선택하세요</option>
          {options.map((opt, i) => (
            <option key={i} value={opt}>{opt}</option>
          ))}
        </select>
      );

    case 'number':
      return (
        <input
          type="number"
          className={styles.numberInput}
          value={value ?? ''}
          onChange={e => onChange(e.target.value)}
          placeholder="숫자를 입력하세요"
        />
      );

    case 'likert':
      return (
        <div className={styles.likertGroup} role="radiogroup" aria-label={question.question_text}>
          {options.map((opt, i) => (
            <label
              key={i}
              className={`${styles.likertOption}${value === opt ? ` ${styles.selected}` : ''}`}
            >
              <input
                type="radio"
                className={styles.srOnly}
                name={`likert-${question.id}`}
                checked={value === opt}
                onChange={() => onChange(opt)}
              />
              <div className={styles.likertCircle} aria-hidden="true">
                {value === opt && <div className={styles.likertCheck} />}
              </div>
              <span>{opt}</span>
            </label>
          ))}
        </div>
      );

    default:
      return <input type="text" className={styles.textInput} value={value || ''} onChange={e => onChange(e.target.value)} />;
  }
}
