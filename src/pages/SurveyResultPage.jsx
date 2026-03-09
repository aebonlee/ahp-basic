import { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useSurveyQuestions, useSurveyResponses } from '../hooks/useSurvey';
import { useEvaluators } from '../hooks/useEvaluators';
import ProjectLayout from '../components/layout/ProjectLayout';
import LoadingSpinner from '../components/common/LoadingSpinner';
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

  const respondedIds = useMemo(
    () => new Set(responses.map(r => r.evaluator_id)),
    [responses],
  );

  const completedCount = useMemo(
    () => evaluators.filter(e => e.completed).length,
    [evaluators],
  );

  if (qLoading || rLoading) {
    return <ProjectLayout><LoadingSpinner message="설문 집계 로딩 중..." /></ProjectLayout>;
  }

  return (
    <ProjectLayout>
      <h1 className={common.pageTitle}>설문 집계</h1>

      <div className={styles.summary}>
        {questions.length > 0 && (
          <div>
            <div className={styles.summaryNum}>{respondedIds.size} / {evaluators.length}</div>
            <div className={styles.summaryLabel}>설문 응답</div>
          </div>
        )}
        <div>
          <div className={styles.summaryNum}>{completedCount} / {evaluators.length}</div>
          <div className={styles.summaryLabel}>평가 완료</div>
        </div>
      </div>

      {evaluators.length > 0 && (
        <div className={styles.statusCard}>
          <h3 className={styles.statusTitle}>평가자별 현황</h3>
          <div className={styles.statusGrid}>
            {evaluators.map(ev => (
              <div key={ev.id} className={styles.statusItem}>
                <div className={styles.statusName}>{ev.name || ev.email}</div>
                <div className={styles.statusBadges}>
                  {questions.length > 0 && (
                    <span className={respondedIds.has(ev.id) ? styles.statusDone : styles.statusPending}>
                      설문 {respondedIds.has(ev.id) ? '완료' : '미응답'}
                    </span>
                  )}
                  <span className={ev.completed ? styles.statusDone : styles.statusPending}>
                    평가 {ev.completed ? '완료' : '미완료'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

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
      // checkbox 응답이 배열로 직접 저장된 경우(legacy) 또는 { value: [...] }인 경우 모두 처리
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
