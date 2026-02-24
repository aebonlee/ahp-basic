import { useState, useCallback, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useSurveyQuestions, useSurveyConfig } from '../hooks/useSurvey';
import ProjectLayout from '../components/layout/ProjectLayout';
import LoadingSpinner from '../components/common/LoadingSpinner';
import common from '../styles/common.module.css';
import styles from './SurveyBuilderPage.module.css';

/* ── 상수 ── */
const STEPS = [
  { key: 'intro',       num: 1, label: '연구 소개' },
  { key: 'consent',     num: 2, label: '개인정보 동의 안내' },
  { key: 'demographic', num: 3, label: '인구통계학적 설문' },
  { key: 'custom',      num: 4, label: '연구자 설문항목' },
];

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

/* ── 기본 템플릿 ── */
const DEFAULT_INTRO = `본 연구는 [연구 주제]에 관한 전문가 의견을 수렴하기 위해 AHP(Analytic Hierarchy Process, 계층분석과정) 기법을 활용합니다.

■ 연구 목적
- [구체적인 연구 목적을 작성하세요]

■ 연구 방법
- AHP 기법을 활용한 쌍대비교 설문
- 전문가 패널을 통한 가중치 도출

■ 소요 시간
- 약 15~20분

■ 기대 효과
- [연구 결과의 활용 방안을 작성하세요]

본 설문에 참여해 주셔서 진심으로 감사드립니다.`;

const DEFAULT_CONSENT = `[개인정보 수집 및 이용 동의서]

1. 수집 항목: 성명, 소속, 연락처, 전문 분야 등 설문 응답 내용
2. 수집 목적: 연구 데이터 분석 및 전문가 패널 구성
3. 보유 기간: 연구 종료 후 3년간 보관 후 파기
4. 동의 거부 시 불이익: 설문 참여가 제한될 수 있습니다.

귀하는 위 개인정보 수집·이용에 대한 동의를 거부할 권리가 있으며, 동의 거부 시 설문 참여가 제한됩니다.`;

const DEMOGRAPHIC_TEMPLATE = [
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

const CUSTOM_TEMPLATE = [
  { question_text: '본 연구 주제에 대한 사전 인지 여부', question_type: 'radio', options: ['잘 알고 있다', '어느 정도 알고 있다', '잘 모른다'], required: true },
  { question_text: '본 연구 주제와 관련된 업무/연구 경험', question_type: 'long_text', options: [], required: false },
  { question_text: '평가 기준에 대해 추가로 고려해야 할 사항이 있다면 자유롭게 작성해 주세요.', question_type: 'long_text', options: [], required: false },
];

/* ============================================
   메인 컴포넌트
   ============================================ */
export default function SurveyBuilderPage() {
  const { id } = useParams();
  const { questions, loading: qLoading, addQuestion, updateQuestion, deleteQuestion, reorderQuestions } = useSurveyQuestions(id);
  const { config, loading: cLoading, saveConfig } = useSurveyConfig(id);

  const [step, setStep] = useState(0); // 0~3
  const [savingField, setSavingField] = useState(null);
  const [activeId, setActiveId] = useState(null);
  const [templateLoading, setTemplateLoading] = useState(false);

  // 카테고리별 질문 분리
  const demographicQs = useMemo(() => questions.filter(q => (q.category || 'demographic') === 'demographic'), [questions]);
  const customQs = useMemo(() => questions.filter(q => q.category === 'custom'), [questions]);

  /* ── 핸들러 ── */
  const handleConfigBlur = useCallback(async (field, value) => {
    setSavingField(field);
    try { await saveConfig({ [field]: value }); } catch (e) { console.error(e); }
    setTimeout(() => setSavingField(null), 1500);
  }, [saveConfig]);

  const handleQuestionUpdate = useCallback(async (qId, updates) => {
    try { await updateQuestion(qId, updates); } catch (e) { console.error(e); }
  }, [updateQuestion]);

  const handleAddQuestion = useCallback(async (category) => {
    try {
      const newQ = await addQuestion({ question_text: '', question_type: 'short_text', options: [], required: true, category });
      if (newQ?.id) setActiveId(newQ.id);
    } catch (e) { console.error(e); }
  }, [addQuestion]);

  const handleDuplicate = useCallback(async (q) => {
    try {
      await addQuestion({
        question_text: q.question_text,
        question_type: q.question_type,
        options: q.options || [],
        required: q.required,
        category: q.category || 'demographic',
      });
    } catch (e) { console.error(e); }
  }, [addQuestion]);

  const handleMove = useCallback(async (index, direction, list) => {
    // list 내에서의 이동 → 전체 questions 기준으로 reorder
    const target = index + direction;
    if (target < 0 || target >= list.length) return;
    const allIds = questions.map(q => q.id);
    const aId = list[index].id;
    const bId = list[target].id;
    const ai = allIds.indexOf(aId);
    const bi = allIds.indexOf(bId);
    [allIds[ai], allIds[bi]] = [allIds[bi], allIds[ai]];
    await reorderQuestions(allIds);
  }, [questions, reorderQuestions]);

  const handleLoadTemplate = useCallback(async (template, category) => {
    setTemplateLoading(true);
    try {
      for (const tmpl of template) {
        await addQuestion({ ...tmpl, category });
      }
    } catch (e) { console.error(e); }
    setTemplateLoading(false);
  }, [addQuestion]);

  const handleLoadIntroTemplate = useCallback(async () => {
    setSavingField('research_description');
    try { await saveConfig({ research_description: DEFAULT_INTRO }); } catch (e) { console.error(e); }
    setTimeout(() => setSavingField(null), 1500);
  }, [saveConfig]);

  const handleLoadConsentTemplate = useCallback(async () => {
    setSavingField('consent_text');
    try { await saveConfig({ consent_text: DEFAULT_CONSENT }); } catch (e) { console.error(e); }
    setTimeout(() => setSavingField(null), 1500);
  }, [saveConfig]);

  if (qLoading || cLoading) {
    return <ProjectLayout><LoadingSpinner message="설문 설정 로딩 중..." /></ProjectLayout>;
  }

  const currentStep = STEPS[step];

  return (
    <ProjectLayout>
      <h1 className={common.pageTitle}>설문 설계</h1>

      {/* ── 스텝 탭 네비게이션 ── */}
      <div className={styles.stepTabs}>
        {STEPS.map((s, i) => (
          <button
            key={s.key}
            className={`${styles.stepTab} ${i === step ? styles.stepTabActive : ''}`}
            onClick={() => setStep(i)}
          >
            <span className={styles.stepNum}>{s.num}</span>
            <span className={styles.stepLabel}>{s.label}</span>
          </button>
        ))}
      </div>

      {/* ── 스텝 콘텐츠 ── */}
      <div className={styles.stepContent}>

        {/* STEP 1: 연구 소개 */}
        {step === 0 && (
          <StepIntro
            config={config}
            savingField={savingField}
            onBlur={handleConfigBlur}
            onLoadTemplate={handleLoadIntroTemplate}
          />
        )}

        {/* STEP 2: 개인정보 동의 안내 */}
        {step === 1 && (
          <StepConsent
            config={config}
            savingField={savingField}
            onBlur={handleConfigBlur}
            onLoadTemplate={handleLoadConsentTemplate}
          />
        )}

        {/* STEP 3: 인구통계학적 설문 */}
        {step === 2 && (
          <StepQuestions
            title="인구통계학적 설문"
            desc="평가자의 배경 정보를 수집하는 기본 질문입니다. 기본 템플릿을 로드하거나 직접 추가할 수 있습니다."
            category="demographic"
            questions={demographicQs}
            allQuestions={questions}
            templateData={DEMOGRAPHIC_TEMPLATE}
            templateLabel="인구통계 기본 템플릿 로드 (11개)"
            templateLoading={templateLoading}
            activeId={activeId}
            setActiveId={setActiveId}
            onUpdate={handleQuestionUpdate}
            onDelete={deleteQuestion}
            onDuplicate={handleDuplicate}
            onMove={handleMove}
            onAdd={handleAddQuestion}
            onLoadTemplate={handleLoadTemplate}
          />
        )}

        {/* STEP 4: 연구자 설문항목 */}
        {step === 3 && (
          <StepQuestions
            title="연구자 설문항목"
            desc="연구 주제에 맞는 추가 질문을 자유롭게 설계하세요. 기본 예시 템플릿도 제공됩니다."
            category="custom"
            questions={customQs}
            allQuestions={questions}
            templateData={CUSTOM_TEMPLATE}
            templateLabel="연구자 설문 예시 템플릿 로드 (3개)"
            templateLoading={templateLoading}
            activeId={activeId}
            setActiveId={setActiveId}
            onUpdate={handleQuestionUpdate}
            onDelete={deleteQuestion}
            onDuplicate={handleDuplicate}
            onMove={handleMove}
            onAdd={handleAddQuestion}
            onLoadTemplate={handleLoadTemplate}
          />
        )}
      </div>

      {/* ── 하단 네비게이션 ── */}
      <div className={styles.stepNav}>
        <button
          className={styles.navBtn}
          onClick={() => setStep(s => s - 1)}
          disabled={step === 0}
        >
          ← 이전
        </button>
        <span className={styles.navIndicator}>{step + 1} / {STEPS.length}</span>
        <button
          className={`${styles.navBtn} ${styles.navBtnPrimary}`}
          onClick={() => setStep(s => s + 1)}
          disabled={step === STEPS.length - 1}
        >
          다음 →
        </button>
      </div>
    </ProjectLayout>
  );
}

/* ============================================
   STEP 1: 연구 소개
   ============================================ */
function StepIntro({ config, savingField, onBlur, onLoadTemplate }) {
  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <div className={styles.cardHeaderLeft}>
          <span className={styles.cardBadge}>STEP 1</span>
          <h2 className={styles.cardTitle}>연구 소개</h2>
        </div>
        {savingField === 'research_description' && <span className={styles.savedMsg}>저장됨</span>}
      </div>
      <p className={styles.cardDesc}>
        평가자에게 보여줄 연구의 배경, 목적, 기대 효과 등을 작성합니다.
        평가자는 이 내용을 먼저 읽은 후 설문을 시작합니다.
      </p>

      {!config.research_description && (
        <div className={styles.templateBanner}>
          <span>기본 양식을 불러와서 시작해 보세요</span>
          <button className={styles.templateBannerBtn} onClick={onLoadTemplate}>
            기본 양식 불러오기
          </button>
        </div>
      )}

      <textarea
        className={styles.textarea}
        key={config.research_description}
        defaultValue={config.research_description}
        placeholder="연구의 배경, 목적, 기대 효과 등을 작성하세요..."
        onBlur={e => onBlur('research_description', e.target.value)}
        rows={12}
      />
    </div>
  );
}

/* ============================================
   STEP 2: 개인정보 동의 안내
   ============================================ */
function StepConsent({ config, savingField, onBlur, onLoadTemplate }) {
  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <div className={styles.cardHeaderLeft}>
          <span className={styles.cardBadge}>STEP 2</span>
          <h2 className={styles.cardTitle}>개인정보 동의 안내</h2>
        </div>
        {savingField === 'consent_text' && <span className={styles.savedMsg}>저장됨</span>}
      </div>
      <p className={styles.cardDesc}>
        평가자가 동의해야 설문 및 평가를 진행할 수 있습니다.
        개인정보 수집·이용 동의서 내용을 작성하세요.
      </p>

      {!config.consent_text && (
        <div className={styles.templateBanner}>
          <span>기본 동의서 양식을 불러와서 시작해 보세요</span>
          <button className={styles.templateBannerBtn} onClick={onLoadTemplate}>
            기본 양식 불러오기
          </button>
        </div>
      )}

      <textarea
        className={styles.textarea}
        key={config.consent_text}
        defaultValue={config.consent_text}
        placeholder="개인정보 수집 및 이용에 대한 동의서 내용을 작성하세요..."
        onBlur={e => onBlur('consent_text', e.target.value)}
        rows={12}
      />
    </div>
  );
}

/* ============================================
   STEP 3 & 4: 질문 빌더 (공용)
   ============================================ */
function StepQuestions({
  title, desc, category, questions: filteredQs, allQuestions,
  templateData, templateLabel, templateLoading,
  activeId, setActiveId,
  onUpdate, onDelete, onDuplicate, onMove, onAdd, onLoadTemplate,
}) {
  const stepNum = category === 'demographic' ? 3 : 4;

  return (
    <>
      {/* 안내 카드 */}
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <div className={styles.cardHeaderLeft}>
            <span className={styles.cardBadge}>STEP {stepNum}</span>
            <h2 className={styles.cardTitle}>{title}</h2>
          </div>
          <span className={styles.questionCount}>{filteredQs.length}개 질문</span>
        </div>
        <p className={styles.cardDesc}>{desc}</p>
      </div>

      {/* 템플릿 로드 영역 (질문 없을 때) */}
      {filteredQs.length === 0 && (
        <div className={styles.templateArea}>
          <div className={styles.templateIcon}>{category === 'demographic' ? '👤' : '📝'}</div>
          <div className={styles.templateTitle}>아직 질문이 없습니다</div>
          <div className={styles.templateDesc}>
            기본 템플릿을 로드하거나, 하단의 "질문 추가" 버튼으로 직접 추가하세요.
          </div>
          <button
            className={styles.templateBtn}
            onClick={() => onLoadTemplate(templateData, category)}
            disabled={templateLoading}
          >
            {templateLoading ? '로딩 중...' : templateLabel}
          </button>
        </div>
      )}

      {/* 질문 카드 목록 */}
      {filteredQs.map((q, idx) => (
        <QuestionCard
          key={q.id}
          question={q}
          index={idx}
          total={filteredQs.length}
          isActive={activeId === q.id}
          onActivate={() => setActiveId(q.id)}
          onUpdate={onUpdate}
          onDelete={onDelete}
          onDuplicate={onDuplicate}
          onMove={(i, d) => onMove(i, d, filteredQs)}
        />
      ))}

      {/* 질문 추가 버튼 */}
      <div className={styles.addBtnArea}>
        <button className={styles.addBtn} onClick={() => onAdd(category)}>
          <span className={styles.addBtnIcon}>+</span>
          질문 추가
        </button>
      </div>
    </>
  );
}

/* ============================================
   질문 카드 컴포넌트
   ============================================ */
function QuestionCard({ question, index, total, isActive, onActivate, onUpdate, onDelete, onDuplicate, onMove }) {
  const [text, setText] = useState(question.question_text);
  const [options, setOptions] = useState(question.options || []);
  const needsOptions = NEEDS_OPTIONS.includes(question.question_type);

  const handleTextBlur = () => {
    if (text !== question.question_text) onUpdate(question.id, { question_text: text });
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

  const handleRequiredChange = (e) => onUpdate(question.id, { required: e.target.checked });

  const handleOptionChange = (optIdx, value) => {
    const next = [...options]; next[optIdx] = value; setOptions(next);
  };
  const handleOptionBlur = () => onUpdate(question.id, { options });
  const handleAddOption = () => {
    const next = [...options, `옵션 ${options.length + 1}`]; setOptions(next);
    onUpdate(question.id, { options: next });
  };
  const handleRemoveOption = (optIdx) => {
    const next = options.filter((_, i) => i !== optIdx); setOptions(next);
    onUpdate(question.id, { options: next });
  };

  return (
    <div className={`${styles.questionCard} ${isActive ? styles.active : ''}`} onClick={onActivate}>
      <div className={styles.leftBar} />
      <div className={styles.cardContent}>
        {/* 상단: 질문 텍스트 + 유형 */}
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

        {/* 하단 바 */}
        {isActive && (
          <div className={styles.bottomBar} onClick={e => e.stopPropagation()}>
            <button className={styles.bottomBarBtn} onClick={() => onDuplicate(question)} title="복제">⧉</button>
            <button className={styles.bottomBarBtnDanger} onClick={() => onDelete(question.id)} title="삭제">🗑</button>
            <button className={styles.bottomBarBtn} onClick={() => onMove(index, -1)} disabled={index === 0} title="위로">▲</button>
            <button className={styles.bottomBarBtn} onClick={() => onMove(index, 1)} disabled={index === total - 1} title="아래로">▼</button>
            <div className={styles.divider} />
            <label className={styles.requiredToggle}>
              필수
              <input type="checkbox" checked={question.required} onChange={handleRequiredChange} />
            </label>
          </div>
        )}
      </div>
    </div>
  );
}

/* ============================================
   질문 미리보기 (읽기 전용)
   ============================================ */
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
            <div key={i} className={styles.previewRadioItem}><div className={styles.previewDot} /><span>{opt}</span></div>
          ))}
        </div>
      );
    case 'checkbox':
      return (
        <div className={styles.previewCheckbox}>
          {options.map((opt, i) => (
            <div key={i} className={styles.previewCheckboxItem}><div className={styles.previewSquare} /><span>{opt}</span></div>
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
