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

const DEFAULT_TEMPLATE = [
  { question_text: '성별', question_type: 'radio', options: ['남성', '여성', '기타'], required: true },
  { question_text: '연령대', question_type: 'dropdown', options: ['20대', '30대', '40대', '50대', '60대 이상'], required: true },
  { question_text: '최종 학력', question_type: 'dropdown', options: ['고졸 이하', '전문대졸', '대졸', '석사', '박사'], required: true },
  { question_text: '직업', question_type: 'short_text', options: [], required: false },
  { question_text: '전문 분야', question_type: 'short_text', options: [], required: false },
  { question_text: '관련 경력', question_type: 'dropdown', options: ['5년 미만', '5~10년', '10~15년', '15~20년', '20년 이상'], required: true },
  { question_text: '소속 기관 유형', question_type: 'radio', options: ['학계', '산업계', '공공기관', '연구기관', '기타'], required: true },
  { question_text: '해당 분야 전문성 자가 평가', question_type: 'likert', options: ['매우 낮음', '낮음', '보통', '높음', '매우 높음'], required: true },
  { question_text: 'AHP 평가 경험', question_type: 'radio', options: ['있음', '없음'], required: true },
  { question_text: '소속 기관명', question_type: 'short_text', options: [], required: false },
  { question_text: '연락처 (이메일 또는 전화번호)', question_type: 'short_text', options: [], required: false },
];

export default function SurveyBuilderPage() {
  const { id } = useParams();
  const { questions, loading: qLoading, addQuestion, updateQuestion, deleteQuestion, reorderQuestions } = useSurveyQuestions(id);
  const { config, loading: cLoading, saveConfig } = useSurveyConfig(id);
  const [savingField, setSavingField] = useState(null);
  const [activeId, setActiveId] = useState(null);
  const [templateLoading, setTemplateLoading] = useState(false);

  const handleConfigBlur = useCallback(async (field, value) => {
    setSavingField(field);
    try {
      await saveConfig({ [field]: value });
    } catch (e) {
      console.error(e);
    }
    setTimeout(() => setSavingField(null), 1500);
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
      const newQ = await addQuestion({ question_text: '', question_type: 'short_text', options: [], required: true });
      if (newQ?.id) setActiveId(newQ.id);
    } catch (e) {
      console.error(e);
    }
  }, [addQuestion]);

  const handleDuplicate = useCallback(async (q) => {
    try {
      await addQuestion({
        question_text: q.question_text,
        question_type: q.question_type,
        options: q.options || [],
        required: q.required,
      });
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

  const handleLoadTemplate = useCallback(async () => {
    setTemplateLoading(true);
    try {
      for (const tmpl of DEFAULT_TEMPLATE) {
        await addQuestion(tmpl);
      }
    } catch (e) {
      console.error(e);
    }
    setTemplateLoading(false);
  }, [addQuestion]);

  if (qLoading || cLoading) {
    return <ProjectLayout><LoadingSpinner message="설문 설정 로딩 중..." /></ProjectLayout>;
  }

  return (
    <ProjectLayout>
      <h1 className={common.pageTitle}>설문 설계</h1>

      {/* 타이틀 카드 (구글 폼 상단 배너) */}
      <div className={styles.titleCard}>
        <div className={styles.titleCardInner}>
          <div className={styles.titleCardTitle}>인구통계학적 사전설문</div>
          <div className={styles.titleCardDesc}>평가자가 AHP 평가 전에 응답할 사전 설문을 설계합니다.</div>

          <div className={styles.fieldGroup}>
            <div className={styles.fieldLabel}>
              연구 소개
              {savingField === 'research_description' && <span className={styles.savedMsg}>저장됨</span>}
            </div>
            <textarea
              className={styles.textarea}
              defaultValue={config.research_description}
              placeholder="연구의 배경, 목적, 기대 효과 등을 작성하세요..."
              onBlur={e => handleConfigBlur('research_description', e.target.value)}
            />
          </div>

          <div className={styles.fieldGroup}>
            <div className={styles.fieldLabel}>
              개인정보 동의서
              {savingField === 'consent_text' && <span className={styles.savedMsg}>저장됨</span>}
            </div>
            <textarea
              className={styles.textarea}
              defaultValue={config.consent_text}
              placeholder="개인정보 수집 및 이용에 대한 동의서 내용을 작성하세요..."
              onBlur={e => handleConfigBlur('consent_text', e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* 질문이 없을 때 템플릿 로드 영역 */}
      {questions.length === 0 && (
        <div className={styles.templateArea}>
          <div className={styles.templateIcon}>📋</div>
          <div className={styles.templateTitle}>아직 질문이 없습니다</div>
          <div className={styles.templateDesc}>
            기본 인구통계학적 질문 템플릿(11개)을 로드하거나, 직접 질문을 추가하세요.
          </div>
          <button
            className={styles.templateBtn}
            onClick={handleLoadTemplate}
            disabled={templateLoading}
          >
            {templateLoading ? '로딩 중...' : '기본 템플릿 로드'}
          </button>
        </div>
      )}

      {/* 질문 카드 목록 */}
      {questions.map((q, idx) => (
        <QuestionCard
          key={q.id}
          question={q}
          index={idx}
          total={questions.length}
          isActive={activeId === q.id}
          onActivate={() => setActiveId(q.id)}
          onUpdate={handleQuestionUpdate}
          onDelete={deleteQuestion}
          onDuplicate={handleDuplicate}
          onMove={handleMove}
        />
      ))}

      {/* 질문 추가 버튼 */}
      <div className={styles.addBtnArea}>
        <button className={styles.addBtn} onClick={handleAddQuestion}>
          <span className={styles.addBtnIcon}>+</span>
          질문 추가
        </button>
      </div>
    </ProjectLayout>
  );
}

/* ── 질문 카드 컴포넌트 ── */
function QuestionCard({ question, index, total, isActive, onActivate, onUpdate, onDelete, onDuplicate, onMove }) {
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

  const cardClass = `${styles.questionCard}${isActive ? ` ${styles.active}` : ''}`;

  return (
    <div className={cardClass} onClick={onActivate}>
      <div className={styles.leftBar} />
      <div className={styles.cardContent}>
        {/* 상단: 질문 텍스트 + 유형 드롭다운 */}
        <div className={styles.questionTop}>
          <input
            className={styles.questionInput}
            value={text}
            onChange={e => setText(e.target.value)}
            onBlur={handleTextBlur}
            placeholder={`질문 ${index + 1}`}
          />
          {isActive && (
            <select
              className={styles.typeSelect}
              value={question.question_type}
              onChange={handleTypeChange}
              onClick={e => e.stopPropagation()}
            >
              {QUESTION_TYPES.map(t => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          )}
        </div>

        {/* 미리보기 or 옵션 편집기 */}
        {isActive && needsOptions ? (
          <div className={styles.optionsEditor}>
            {options.map((opt, optIdx) => (
              <div key={optIdx} className={styles.optionRow}>
                {question.question_type === 'radio' && <div className={styles.optionDot} />}
                {question.question_type === 'checkbox' && <div className={styles.optionSquare} />}
                {(question.question_type === 'dropdown' || question.question_type === 'likert') && (
                  <span className={styles.optionNumber}>{optIdx + 1}.</span>
                )}
                <input
                  className={styles.optionInput}
                  value={opt}
                  onChange={e => handleOptionChange(optIdx, e.target.value)}
                  onBlur={handleOptionBlur}
                  onClick={e => e.stopPropagation()}
                />
                <button
                  className={styles.removeOptionBtn}
                  onClick={e => { e.stopPropagation(); handleRemoveOption(optIdx); }}
                  title="삭제"
                >
                  ✕
                </button>
              </div>
            ))}
            <div className={styles.addOptionRow}>
              {question.question_type === 'radio' && <div className={styles.optionDot} />}
              {question.question_type === 'checkbox' && <div className={styles.optionSquare} />}
              {(question.question_type === 'dropdown' || question.question_type === 'likert') && (
                <span className={styles.optionNumber}>{options.length + 1}.</span>
              )}
              <button className={styles.addOptionText} onClick={e => { e.stopPropagation(); handleAddOption(); }}>
                옵션 추가
              </button>
            </div>
          </div>
        ) : (
          <div className={styles.previewArea}>
            <QuestionPreview type={question.question_type} options={options} />
          </div>
        )}

        {/* 하단 바 (활성 시에만) */}
        {isActive && (
          <div className={styles.bottomBar} onClick={e => e.stopPropagation()}>
            <button className={styles.bottomBarBtn} onClick={() => onDuplicate(question)} title="복제">
              ⧉
            </button>
            <button className={styles.bottomBarBtnDanger} onClick={() => onDelete(question.id)} title="삭제">
              🗑
            </button>
            <button className={styles.bottomBarBtn} onClick={() => onMove(index, -1)} disabled={index === 0} title="위로 이동">
              ▲
            </button>
            <button className={styles.bottomBarBtn} onClick={() => onMove(index, 1)} disabled={index === total - 1} title="아래로 이동">
              ▼
            </button>
            <div className={styles.divider} />
            <label className={styles.requiredToggle}>
              필수
              <input
                type="checkbox"
                checked={question.required}
                onChange={handleRequiredChange}
              />
            </label>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── 질문 미리보기 (읽기 전용) ── */
function QuestionPreview({ type, options = [] }) {
  switch (type) {
    case 'short_text':
      return <div className={styles.previewPlaceholderShort}>단답형 텍스트</div>;
    case 'long_text':
      return <div className={styles.previewPlaceholderLong}>장문형 텍스트</div>;
    case 'number':
      return <div className={styles.previewPlaceholderShort}>숫자 입력</div>;
    case 'radio':
      return (
        <div className={styles.previewRadio}>
          {options.map((opt, i) => (
            <div key={i} className={styles.previewRadioItem}>
              <div className={styles.previewDot} />
              <span>{opt}</span>
            </div>
          ))}
        </div>
      );
    case 'checkbox':
      return (
        <div className={styles.previewCheckbox}>
          {options.map((opt, i) => (
            <div key={i} className={styles.previewCheckboxItem}>
              <div className={styles.previewSquare} />
              <span>{opt}</span>
            </div>
          ))}
        </div>
      );
    case 'dropdown':
      return <div className={styles.previewDropdown}>선택하세요 ▾</div>;
    case 'likert':
      return (
        <div className={styles.previewLikert}>
          {options.map((opt, i) => (
            <div key={i} className={styles.previewLikertItem}>
              <div className={styles.previewLikertDot} />
              <span className={styles.previewLikertLabel}>{opt}</span>
            </div>
          ))}
        </div>
      );
    default:
      return <div className={styles.previewPlaceholder}>텍스트 입력</div>;
  }
}
