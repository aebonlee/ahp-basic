import { useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { useSurveyQuestions, useSurveyConfig } from '../hooks/useSurvey';
import ProjectLayout from '../components/layout/ProjectLayout';
import LoadingSpinner from '../components/common/LoadingSpinner';
import common from '../styles/common.module.css';
import styles from './SurveyBuilderPage.module.css';

const QUESTION_TYPES = [
  { value: 'short_text', label: '단답형' },
  { value: 'long_text', label: '장문형' },
  { value: 'radio', label: '객관식 (단일)' },
  { value: 'checkbox', label: '체크박스 (복수)' },
  { value: 'dropdown', label: '드롭다운' },
  { value: 'number', label: '숫자' },
  { value: 'likert', label: '리커트 척도' },
];

const NEEDS_OPTIONS = ['radio', 'checkbox', 'dropdown', 'likert'];

export default function SurveyBuilderPage() {
  const { id } = useParams();
  const { questions, loading: qLoading, addQuestion, updateQuestion, deleteQuestion, reorderQuestions } = useSurveyQuestions(id);
  const { config, loading: cLoading, saveConfig } = useSurveyConfig(id);
  const [savingField, setSavingField] = useState(null);

  const handleConfigBlur = useCallback(async (field, value) => {
    setSavingField(field);
    try {
      await saveConfig({ [field]: value });
    } catch (e) {
      console.error(e);
    }
    setTimeout(() => setSavingField(null), 1000);
  }, [saveConfig]);

  const handleQuestionUpdate = useCallback(async (qId, updates) => {
    try {
      await updateQuestion(qId, updates);
    } catch (e) {
      console.error(e);
    }
  }, [updateQuestion]);

  const handleAddQuestion = useCallback(async () => {
    try {
      await addQuestion({ question_text: '', question_type: 'short_text', options: [], required: true });
    } catch (e) {
      console.error(e);
    }
  }, [addQuestion]);

  const handleMove = useCallback(async (index, direction) => {
    const ids = questions.map(q => q.id);
    const target = index + direction;
    if (target < 0 || target >= ids.length) return;
    [ids[index], ids[target]] = [ids[target], ids[index]];
    await reorderQuestions(ids);
  }, [questions, reorderQuestions]);

  if (qLoading || cLoading) {
    return <ProjectLayout><LoadingSpinner message="설문 설정 로딩 중..." /></ProjectLayout>;
  }

  return (
    <ProjectLayout>
      <h1 className={common.pageTitle}>설문 설계</h1>

      {/* 섹션 1: 연구 소개 */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>
          <span className={styles.sectionNum}>1</span>
          연구 소개
          {savingField === 'research_description' && <span className={styles.savedMsg}>저장됨</span>}
        </h2>
        <p className={styles.sectionDesc}>평가자에게 보여줄 연구 배경 및 목적을 작성합니다.</p>
        <textarea
          className={styles.textarea}
          defaultValue={config.research_description}
          placeholder="연구의 배경, 목적, 기대 효과 등을 작성하세요..."
          onBlur={e => handleConfigBlur('research_description', e.target.value)}
        />
      </div>

      {/* 섹션 2: 개인정보 동의서 */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>
          <span className={styles.sectionNum}>2</span>
          개인정보 동의서
          {savingField === 'consent_text' && <span className={styles.savedMsg}>저장됨</span>}
        </h2>
        <p className={styles.sectionDesc}>평가자가 동의해야 평가를 진행할 수 있습니다. 동의서 내용을 작성하세요.</p>
        <textarea
          className={styles.textarea}
          defaultValue={config.consent_text}
          placeholder="개인정보 수집 및 이용에 대한 동의서 내용을 작성하세요..."
          onBlur={e => handleConfigBlur('consent_text', e.target.value)}
        />
      </div>

      {/* 섹션 3: 인구통계학적 질문 */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>
          <span className={styles.sectionNum}>3</span>
          인구통계학적 질문
        </h2>
        <p className={styles.sectionDesc}>평가 전 응답받을 인구통계학적 질문을 설계합니다.</p>

        {questions.map((q, idx) => (
          <QuestionCard
            key={q.id}
            question={q}
            index={idx}
            total={questions.length}
            onUpdate={handleQuestionUpdate}
            onDelete={deleteQuestion}
            onMove={handleMove}
          />
        ))}

        <button className={styles.addQuestionBtn} onClick={handleAddQuestion}>
          + 질문 추가
        </button>
      </div>
    </ProjectLayout>
  );
}

function QuestionCard({ question, index, total, onUpdate, onDelete, onMove }) {
  const [text, setText] = useState(question.question_text);
  const [options, setOptions] = useState(question.options || []);
  const needsOptions = NEEDS_OPTIONS.includes(question.question_type);

  const handleTextBlur = () => {
    if (text !== question.question_text) {
      onUpdate(question.id, { question_text: text });
    }
  };

  const handleTypeChange = (e) => {
    const newType = e.target.value;
    const updates = { question_type: newType };
    if (NEEDS_OPTIONS.includes(newType) && options.length === 0) {
      const defaultOpts = newType === 'likert'
        ? ['매우 그렇지 않다', '그렇지 않다', '보통이다', '그렇다', '매우 그렇다']
        : ['옵션 1', '옵션 2'];
      updates.options = defaultOpts;
      setOptions(defaultOpts);
    }
    onUpdate(question.id, updates);
  };

  const handleRequiredChange = (e) => {
    onUpdate(question.id, { required: e.target.checked });
  };

  const handleOptionChange = (optIdx, value) => {
    const next = [...options];
    next[optIdx] = value;
    setOptions(next);
  };

  const handleOptionBlur = () => {
    onUpdate(question.id, { options });
  };

  const handleAddOption = () => {
    const next = [...options, `옵션 ${options.length + 1}`];
    setOptions(next);
    onUpdate(question.id, { options: next });
  };

  const handleRemoveOption = (optIdx) => {
    const next = options.filter((_, i) => i !== optIdx);
    setOptions(next);
    onUpdate(question.id, { options: next });
  };

  return (
    <div className={styles.questionCard}>
      <div className={styles.questionHeader}>
        <span className={styles.questionNum}>Q{index + 1}</span>
        <input
          className={styles.questionInput}
          value={text}
          onChange={e => setText(e.target.value)}
          onBlur={handleTextBlur}
          placeholder="질문을 입력하세요"
        />
      </div>

      <div className={styles.questionBody}>
        <select
          className={styles.typeSelect}
          value={question.question_type}
          onChange={handleTypeChange}
        >
          {QUESTION_TYPES.map(t => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>

        <label className={styles.requiredToggle}>
          <input
            type="checkbox"
            checked={question.required}
            onChange={handleRequiredChange}
          />
          필수
        </label>

        <div className={styles.questionActions}>
          <button className={styles.iconBtn} onClick={() => onMove(index, -1)} disabled={index === 0} title="위로">
            ▲
          </button>
          <button className={styles.iconBtn} onClick={() => onMove(index, 1)} disabled={index === total - 1} title="아래로">
            ▼
          </button>
          <button className={styles.iconBtnDanger} onClick={() => onDelete(question.id)} title="삭제">
            ✕
          </button>
        </div>
      </div>

      {needsOptions && (
        <div className={styles.optionsEditor}>
          <p className={styles.optionsLabel}>
            {question.question_type === 'likert' ? '척도 라벨' : '선택지'}
          </p>
          {options.map((opt, optIdx) => (
            <div key={optIdx} className={styles.optionRow}>
              <input
                className={styles.optionInput}
                value={opt}
                onChange={e => handleOptionChange(optIdx, e.target.value)}
                onBlur={handleOptionBlur}
              />
              <button
                className={styles.removeOptionBtn}
                onClick={() => handleRemoveOption(optIdx)}
                title="삭제"
              >
                ×
              </button>
            </div>
          ))}
          <button className={styles.addOptionBtn} onClick={handleAddOption}>
            + 선택지 추가
          </button>
        </div>
      )}
    </div>
  );
}
