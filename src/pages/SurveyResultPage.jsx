import { useMemo, useState, useCallback, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { supabase } from '../lib/supabaseClient';
import { useSurveyQuestions, useSurveyResponses } from '../hooks/useSurvey';
import { useEvaluators } from '../hooks/useEvaluators';
import { useCriteria } from '../hooks/useCriteria';
import { useAlternatives } from '../hooks/useAlternatives';
import { useProject } from '../hooks/useProjects';
import { buildPageSequence } from '../lib/pairwiseUtils';
import { EVAL_METHOD } from '../lib/constants';
import ProjectLayout from '../components/layout/ProjectLayout';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ProgressBar from '../components/common/ProgressBar';
import SmsModal from '../components/admin/SmsModal';
import common from '../styles/common.module.css';
import styles from './SurveyResultPage.module.css';

const TYPE_LABELS = {
  short_text: '단답형',
  long_text: '장문형',
  radio: '객관식',
  checkbox: '체크박스',
  dropdown: '드롭다운',
  number: '숫자',
  likert: '리커트',
};

const COLORS = ['#6366f1', '#8b5cf6', '#a78bfa', '#c4b5fd', '#818cf8', '#7c3aed', '#4f46e5'];

export default function SurveyResultPage() {
  const { id } = useParams();
  const { questions, loading: qLoading } = useSurveyQuestions(id);
  const { responses, loading: rLoading, getResponsesByQuestion, getResponsesByEvaluator } = useSurveyResponses(id);
  const { evaluators } = useEvaluators(id);
  const { criteria } = useCriteria(id);
  const { alternatives } = useAlternatives(id);
  const { currentProject } = useProject(id);
  const [smsModalOpen, setSmsModalOpen] = useState(false);
  const [expandedEval, setExpandedEval] = useState(null);
  const [rawCompData, setRawCompData] = useState([]);

  const isDirectInput = currentProject?.eval_method === EVAL_METHOD.DIRECT_INPUT;

  // 평가 데이터 로드
  const loadCompData = useCallback(async () => {
    if (isDirectInput) {
      const { data } = await supabase
        .from('direct_input_values')
        .select('evaluator_id, criterion_id, item_id')
        .eq('project_id', id)
        .limit(10000);
      setRawCompData(data || []);
    } else {
      const { data } = await supabase
        .from('pairwise_comparisons')
        .select('evaluator_id, criterion_id, row_id, col_id')
        .eq('project_id', id)
        .limit(10000);
      setRawCompData(data || []);
    }
  }, [id, isDirectInput]);

  useEffect(() => {
    if (currentProject) loadCompData();
  }, [currentProject, loadCompData]);

  const respondedIds = useMemo(
    () => new Set(responses.map(r => r.evaluator_id)),
    [responses],
  );

  // 필요한 총 비교 수 & 유효 키
  const { totalRequired, validKeys } = useMemo(() => {
    if (criteria.length === 0) return { totalRequired: 0, validKeys: new Set() };
    const pages = buildPageSequence(criteria, alternatives, id);
    const keys = new Set();
    if (isDirectInput) {
      for (const page of pages) {
        for (const item of page.items) keys.add(`${page.parentId}:${item.id}`);
      }
    } else {
      for (const page of pages) {
        for (const pair of page.pairs) keys.add(`${page.parentId}:${pair.left.id}:${pair.right.id}`);
      }
    }
    return { totalRequired: keys.size, validKeys: keys };
  }, [criteria, alternatives, id, isDirectInput]);

  // 평가자별 진행률
  const evalProgress = useMemo(() => {
    const counts = {};
    for (const row of rawCompData) {
      const key = isDirectInput
        ? `${row.criterion_id}:${row.item_id}`
        : `${row.criterion_id}:${row.row_id}:${row.col_id}`;
      if (validKeys.has(key)) {
        counts[row.evaluator_id] = (counts[row.evaluator_id] || 0) + 1;
      }
    }
    return counts;
  }, [rawCompData, validKeys, isDirectInput]);

  const stats = useMemo(() => {
    const total = evaluators.length;
    const surveyed = evaluators.filter(e => respondedIds.has(e.id)).length;
    const completed = evaluators.filter(e => totalRequired > 0 && (evalProgress[e.id] || 0) >= totalRequired).length;
    return { total, surveyed, completed };
  }, [evaluators, respondedIds, evalProgress, totalRequired]);

  if (qLoading || rLoading) {
    return <ProjectLayout><LoadingSpinner message="설문 집계 로딩 중..." /></ProjectLayout>;
  }

  return (
    <ProjectLayout>
      <h1 className={common.pageTitle}>설문 집계</h1>

      <div className={styles.summary}>
        {questions.length > 0 && (
          <div>
            <div className={styles.summaryNum}>{stats.surveyed} / {stats.total}</div>
            <div className={styles.summaryLabel}>설문 응답</div>
          </div>
        )}
        <div>
          <div className={styles.summaryNum}>{stats.completed} / {stats.total}</div>
          <div className={styles.summaryLabel}>평가 완료</div>
        </div>
      </div>

      {/* ── 평가자별 현황 (4열 넘버링 + 클릭 상세) ── */}
      {evaluators.length > 0 && (
        <div className={styles.statusCard}>
          <div className={styles.statusHeader}>
            <h3 className={styles.statusTitle}>평가자별 현황</h3>
            <button className={styles.smsBtn} onClick={() => setSmsModalOpen(true)}>
              SMS 발송
            </button>
          </div>
          <div className={styles.statusGrid}>
            {evaluators.map((ev, idx) => {
              const hasSurvey = respondedIds.has(ev.id);
              const count = evalProgress[ev.id] || 0;
              const isDone = totalRequired > 0 && count >= totalRequired;
              const isOpen = expandedEval === ev.id;
              return (
                <div key={ev.id} className={styles.statusItem}>
                  <div
                    className={styles.statusMain}
                    onClick={() => setExpandedEval(isOpen ? null : ev.id)}
                  >
                    <span className={styles.statusIdx}>{idx + 1}</span>
                    <span className={styles.statusName}>{ev.name || ev.email}</span>
                    <span className={styles.statusArrow}>{isOpen ? '▾' : '▸'}</span>
                  </div>
                  <div className={styles.statusBadges}>
                    {questions.length > 0 && (
                      <span className={hasSurvey ? styles.statusDone : styles.statusPending}>
                        설문 {hasSurvey ? '완료' : '미응답'}
                      </span>
                    )}
                    <span className={isDone ? styles.statusDone : styles.statusPending}>
                      평가 {isDone ? '완료' : `${count}/${totalRequired}`}
                    </span>
                  </div>

                  {/* 펼침 상세 */}
                  {isOpen && (
                    <EvalDetail
                      evaluator={ev}
                      questions={questions}
                      getResponsesByEvaluator={getResponsesByEvaluator}
                      evalCount={count}
                      totalRequired={totalRequired}
                      isDone={isDone}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      <SmsModal
        isOpen={smsModalOpen}
        onClose={() => setSmsModalOpen(false)}
        evaluators={evaluators}
        projectId={id}
        respondedIds={respondedIds}
        projectName={currentProject?.name}
      />

      {/* ── 설문 결과 (전체 집계) ── */}
      {questions.length === 0 ? (
        <div className={styles.emptyMsg}>설계된 설문 질문이 없습니다.</div>
      ) : (
        questions.map((q, idx) => (
          <QuestionResult
            key={q.id}
            question={q}
            index={idx}
            responses={getResponsesByQuestion(q.id)}
          />
        ))
      )}
    </ProjectLayout>
  );
}

/* ── 개인 상세 패널 ── */
function EvalDetail({ evaluator, questions, getResponsesByEvaluator, evalCount, totalRequired, isDone }) {
  const myResponses = useMemo(
    () => getResponsesByEvaluator(evaluator.id),
    [getResponsesByEvaluator, evaluator.id],
  );

  const answerMap = useMemo(() => {
    const map = {};
    for (const r of myResponses) {
      map[r.question_id] = r.answer;
    }
    return map;
  }, [myResponses]);

  return (
    <div className={styles.evalDetail}>
      {/* 평가 진행률 */}
      <div className={styles.detailSection}>
        <div className={styles.detailLabel}>평가 진행</div>
        <div className={styles.detailRow}>
          <span className={isDone ? styles.statusDone : styles.statusPending}>
            {evalCount} / {totalRequired}{isDone ? ' (완료)' : ''}
          </span>
        </div>
        <ProgressBar value={evalCount} max={totalRequired || 1} color={isDone ? 'var(--color-success)' : 'var(--color-primary)'} />
      </div>

      {/* 설문 응답 */}
      {questions.length > 0 && (
        <div className={styles.detailSection}>
          <div className={styles.detailLabel}>설문 응답</div>
          {myResponses.length === 0 ? (
            <div className={styles.detailEmpty}>미응답</div>
          ) : (
            <div className={styles.detailAnswers}>
              {questions.map((q, qi) => {
                const ans = answerMap[q.id];
                return (
                  <div key={q.id} className={styles.detailAnswer}>
                    <span className={styles.detailQ}>Q{qi + 1}.</span>
                    <span className={styles.detailA}>
                      {ans ? formatAnswer(ans) : <span className={styles.detailNoAns}>-</span>}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function formatAnswer(answer) {
  if (answer?.value !== undefined) {
    const v = answer.value;
    if (Array.isArray(v)) return v.join(', ');
    return String(v);
  }
  if (Array.isArray(answer)) return answer.join(', ');
  if (typeof answer === 'object') return JSON.stringify(answer);
  return String(answer);
}

/* ── 전체 집계 카드 (기존 유지) ── */
function QuestionResult({ question, index, responses }) {
  const { question_type } = question;

  return (
    <div className={styles.questionCard}>
      <h3 className={styles.questionTitle}>
        Q{index + 1}. {question.question_text || '(질문 없음)'}
        <span className={styles.questionType}>{TYPE_LABELS[question_type]}</span>
      </h3>
      <p className={styles.responseCount}>{responses.length}명 응답</p>

      {question_type === 'short_text' || question_type === 'long_text' ? (
        <TextResults responses={responses} />
      ) : question_type === 'number' ? (
        <NumberResults responses={responses} />
      ) : (
        <ChoiceResults question={question} responses={responses} />
      )}
    </div>
  );
}

function TextResults({ responses }) {
  if (responses.length === 0) return <p className={styles.emptyMsg}>응답 없음</p>;
  return (
    <ul className={styles.textList}>
      {responses.map(r => (
        <li key={r.id} className={styles.textItem}>
          {r.answer?.value ?? JSON.stringify(r.answer)}
        </li>
      ))}
    </ul>
  );
}

function NumberResults({ responses }) {
  const stats = useMemo(() => {
    const values = responses.map(r => Number(r.answer?.value ?? 0)).filter(v => !isNaN(v));
    if (values.length === 0) return null;
    const sorted = [...values].sort((a, b) => a - b);
    const sum = values.reduce((a, b) => a + b, 0);
    return {
      min: sorted[0],
      max: sorted[sorted.length - 1],
      avg: (sum / values.length).toFixed(1),
      median: sorted.length % 2 === 0
        ? ((sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2).toFixed(1)
        : sorted[Math.floor(sorted.length / 2)],
    };
  }, [responses]);

  if (!stats) return <p className={styles.emptyMsg}>응답 없음</p>;

  return (
    <div className={styles.statsGrid}>
      <div className={styles.statBox}>
        <div className={styles.statValue}>{stats.min}</div>
        <div className={styles.statLabel}>최솟값</div>
      </div>
      <div className={styles.statBox}>
        <div className={styles.statValue}>{stats.max}</div>
        <div className={styles.statLabel}>최댓값</div>
      </div>
      <div className={styles.statBox}>
        <div className={styles.statValue}>{stats.avg}</div>
        <div className={styles.statLabel}>평균</div>
      </div>
      <div className={styles.statBox}>
        <div className={styles.statValue}>{stats.median}</div>
        <div className={styles.statLabel}>중앙값</div>
      </div>
    </div>
  );
}

function ChoiceResults({ question, responses }) {
  const data = useMemo(() => {
    const options = question.options || [];
    const counts = {};
    for (const opt of options) counts[opt] = 0;

    for (const r of responses) {
      const val = r.answer?.value !== undefined ? r.answer.value : (Array.isArray(r.answer) ? r.answer : undefined);
      if (Array.isArray(val)) {
        for (const v of val) {
          counts[v] = (counts[v] || 0) + 1;
        }
      } else if (val !== undefined) {
        counts[val] = (counts[val] || 0) + 1;
      }
    }

    return options.map(opt => ({
      name: opt,
      count: counts[opt] || 0,
      pct: responses.length > 0 ? ((counts[opt] || 0) / responses.length * 100).toFixed(1) : '0',
    }));
  }, [question, responses]);

  if (data.length === 0) return <p className={styles.emptyMsg}>선택지 없음</p>;

  return (
    <div className={styles.chartWrap}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ left: 100, right: 30, top: 5, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" horizontal={false} />
          <XAxis type="number" allowDecimals={false} />
          <YAxis type="category" dataKey="name" width={90} tick={{ fontSize: 12 }} />
          <Tooltip formatter={(value, name, props) => [`${value}명 (${props.payload.pct}%)`, '응답 수']} />
          <Bar dataKey="count" radius={[0, 4, 4, 0]}>
            {data.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
