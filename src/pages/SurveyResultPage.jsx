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
  const { responses, loading: rLoading, getResponsesByQuestion } = useSurveyResponses(id);
  const { evaluators } = useEvaluators(id);
  const { criteria } = useCriteria(id);
  const { alternatives } = useAlternatives(id);
  const { currentProject } = useProject(id);
  const [smsModalOpen, setSmsModalOpen] = useState(false);
  const [rawCompData, setRawCompData] = useState([]);
  const [expandedEval, setExpandedEval] = useState(null);

  const isDirectInput = currentProject?.eval_method === EVAL_METHOD.DIRECT_INPUT;

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
    const inProgress = evaluators.filter(e => {
      const c = evalProgress[e.id] || 0;
      return c > 0 && c < totalRequired;
    }).length;
    return { total, surveyed, completed, inProgress, notStarted: total - completed - inProgress };
  }, [evaluators, respondedIds, evalProgress, totalRequired]);

  if (qLoading || rLoading) {
    return <ProjectLayout><LoadingSpinner message="설문 집계 로딩 중..." /></ProjectLayout>;
  }

  const surveyPct = stats.total > 0 ? Math.round((stats.surveyed / stats.total) * 100) : 0;
  const evalPct = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;

  return (
    <ProjectLayout>
      <h1 className={common.pageTitle}>설문 집계</h1>

      {/* ── 요약 카드 ── */}
      <div className={styles.summaryGrid}>
        <div className={styles.summaryCard}>
          <div className={styles.summaryNum}>{stats.total}</div>
          <div className={styles.summaryLabel}>전체 평가자</div>
        </div>
        {questions.length > 0 && (
          <div className={styles.summaryCard}>
            <div className={styles.summaryNum}>{stats.surveyed}<span className={styles.summaryOf}>/{stats.total}</span></div>
            <div className={styles.summaryLabel}>설문 응답 ({surveyPct}%)</div>
            <ProgressBar value={stats.surveyed} max={stats.total || 1} color="var(--color-primary)" />
          </div>
        )}
        <div className={styles.summaryCard}>
          <div className={styles.summaryNum}>{stats.completed}<span className={styles.summaryOf}>/{stats.total}</span></div>
          <div className={styles.summaryLabel}>평가 완료 ({evalPct}%)</div>
          <ProgressBar value={stats.completed} max={stats.total || 1} color="var(--color-success)" />
        </div>
        <div className={styles.summaryCard}>
          <div className={styles.summaryNumSmall}>
            <span className={styles.numHighlight}>{stats.inProgress}</span> 진행중
            <span className={styles.numDivider}>/</span>
            <span className={styles.numMuted}>{stats.notStarted}</span> 미시작
          </div>
          <div className={styles.summaryLabel}>잔여 현황</div>
        </div>
      </div>

      {/* ── 평가자별 현황 (컴팩트 그리드 + 개인 상세) ── */}
      {evaluators.length > 0 && (
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <h3 className={styles.sectionTitle}>평가자별 현황 <span className={styles.badge}>{stats.total}명</span></h3>
            <button className={styles.smsBtn} onClick={() => setSmsModalOpen(true)}>SMS 발송</button>
          </div>
          <div className={styles.evalGrid}>
            {evaluators.map((ev, idx) => {
              const count = evalProgress[ev.id] || 0;
              const isDone = totalRequired > 0 && count >= totalRequired;
              const hasSurvey = respondedIds.has(ev.id);
              const isOpen = expandedEval === ev.id;
              return (
                <div key={ev.id} className={`${styles.evalChip} ${isDone ? styles.evalChipDone : count > 0 ? styles.evalChipProgress : ''}`}>
                  <div className={styles.evalChipMain} onClick={() => setExpandedEval(isOpen ? null : ev.id)}>
                    <span className={styles.evalIdx}>{idx + 1}</span>
                    <span className={styles.evalChipName}>{ev.name || ev.email}</span>
                    <span className={styles.evalDots}>
                      {questions.length > 0 && <span className={hasSurvey ? styles.dotDone : styles.dotPending} title={hasSurvey ? '설문 완료' : '설문 미응답'} />}
                      <span className={isDone ? styles.dotDone : count > 0 ? styles.dotProgress : styles.dotPending} title={`평가 ${count}/${totalRequired}`} />
                    </span>
                    <button className={styles.evalDetailBtn} title="상세 보기">{isOpen ? '▾' : '▸'}</button>
                  </div>
                  {isOpen && (
                    <div className={styles.evalDetail}>
                      {questions.length > 0 && (
                        <div className={styles.evalDetailRow}>
                          <span className={styles.evalDetailLabel}>설문</span>
                          <span className={hasSurvey ? styles.statusDone : styles.statusPending}>
                            {hasSurvey ? '완료' : '미응답'}
                          </span>
                        </div>
                      )}
                      <div className={styles.evalDetailRow}>
                        <span className={styles.evalDetailLabel}>평가</span>
                        <span className={isDone ? styles.statusDone : styles.statusPending}>
                          {count} / {totalRequired}{isDone ? ' (완료)' : ''}
                        </span>
                      </div>
                      <ProgressBar value={count} max={totalRequired || 1} color={isDone ? 'var(--color-success)' : 'var(--color-primary)'} />
                    </div>
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

      {/* ── 설문 결과 (2열 그리드) ── */}
      {questions.length === 0 ? (
        <div className={styles.emptyMsg}>설계된 설문 질문이 없습니다.</div>
      ) : (
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <h3 className={styles.sectionTitle}>설문 응답 결과</h3>
          </div>
          <div className={styles.questionGrid}>
            {questions.map((q, idx) => (
              <QuestionCard
                key={q.id}
                question={q}
                index={idx}
                responses={getResponsesByQuestion(q.id)}
              />
            ))}
          </div>
        </div>
      )}
    </ProjectLayout>
  );
}

function QuestionCard({ question, index, responses }) {
  const { question_type } = question;
  return (
    <div className={styles.questionCard}>
      <div className={styles.qCardHeader}>
        <span className={styles.qLabel}>Q{index + 1}</span>
        <span className={styles.questionType}>{TYPE_LABELS[question_type]}</span>
        <span className={styles.qResCount}>{responses.length}명</span>
      </div>
      <p className={styles.qCardText}>{question.question_text || '(질문 없음)'}</p>
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
    <div className={styles.statsRow}>
      <div className={styles.statBox}><span className={styles.statValue}>{stats.min}</span><span className={styles.statLabel}>최솟값</span></div>
      <div className={styles.statBox}><span className={styles.statValue}>{stats.max}</span><span className={styles.statLabel}>최댓값</span></div>
      <div className={styles.statBox}><span className={styles.statValue}>{stats.avg}</span><span className={styles.statLabel}>평균</span></div>
      <div className={styles.statBox}><span className={styles.statValue}>{stats.median}</span><span className={styles.statLabel}>중앙값</span></div>
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
        for (const v of val) counts[v] = (counts[v] || 0) + 1;
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
        <BarChart data={data} layout="vertical" margin={{ left: 80, right: 20, top: 5, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" horizontal={false} />
          <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
          <YAxis type="category" dataKey="name" width={70} tick={{ fontSize: 11 }} />
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
