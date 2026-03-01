/**
 * 통계분석 변수 선택 UI
 * 분석 유형에 따라 적절한 변수 선택 폼 표시
 */
import { useState } from 'react';
import styles from './VariableSelector.module.css';

const ANALYSIS_CONFIG = {
  descriptive: {
    title: '기술통계',
    fields: [{ key: 'variable', label: '분석 변수', type: 'numeric', multi: false }],
  },
  independentT: {
    title: '독립표본 T검정',
    fields: [
      { key: 'groupVar', label: '그룹 변수 (2집단)', type: 'categorical', multi: false },
      { key: 'testVar', label: '검정 변수', type: 'numeric', multi: false },
    ],
  },
  pairedT: {
    title: '대응표본 T검정',
    fields: [
      { key: 'var1', label: '변수 1', type: 'numeric', multi: false },
      { key: 'var2', label: '변수 2', type: 'numeric', multi: false },
    ],
  },
  anova: {
    title: '일원분산분석 (ANOVA)',
    fields: [
      { key: 'groupVar', label: '그룹 변수 (3+집단)', type: 'categorical', multi: false },
      { key: 'testVar', label: '검정 변수', type: 'numeric', multi: false },
    ],
  },
  chiSquare: {
    title: '카이제곱 검정',
    fields: [
      { key: 'var1', label: '변수 1 (범주형)', type: 'categorical', multi: false },
      { key: 'var2', label: '변수 2 (범주형)', type: 'categorical', multi: false },
    ],
  },
  correlation: {
    title: '상관분석',
    fields: [{ key: 'variables', label: '분석 변수 (2개 이상)', type: 'numeric', multi: true }],
  },
  regression: {
    title: '단순선형회귀',
    fields: [
      { key: 'xVar', label: '독립변수 (X)', type: 'numeric', multi: false },
      { key: 'yVar', label: '종속변수 (Y)', type: 'numeric', multi: false },
    ],
  },
  cronbach: {
    title: '크론바흐 알파',
    fields: [{ key: 'items', label: '리커트 문항 (2개 이상)', type: 'numeric', multi: true }],
  },
  crossTab: {
    title: '교차분석',
    fields: [
      { key: 'var1', label: '행 변수 (범주형)', type: 'categorical', multi: false },
      { key: 'var2', label: '열 변수 (범주형)', type: 'categorical', multi: false },
    ],
  },
};

export default function VariableSelector({
  analysisType,
  variables,
  onRun,
  onBack,
}) {
  const config = ANALYSIS_CONFIG[analysisType];
  const [selections, setSelections] = useState({});

  if (!config) return null;

  const handleChange = (key, value, multi) => {
    if (multi) {
      setSelections(prev => {
        const current = prev[key] || [];
        const exists = current.includes(value);
        return {
          ...prev,
          [key]: exists ? current.filter(v => v !== value) : [...current, value],
        };
      });
    } else {
      setSelections(prev => ({ ...prev, [key]: value }));
    }
  };

  const isValid = () => {
    for (const field of config.fields) {
      const val = selections[field.key];
      if (field.multi) {
        if (!val || val.length < 2) return false;
      } else {
        if (!val) return false;
      }
    }
    return true;
  };

  const getOptions = (type) => {
    if (type === 'numeric') return variables.numeric;
    if (type === 'categorical') return variables.categorical;
    return variables.all;
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button className={styles.backBtn} onClick={onBack}>&larr; 돌아가기</button>
        <h2 className={styles.title}>{config.title}</h2>
        <p className={styles.subtitle}>분석에 사용할 변수를 선택하세요</p>
      </div>

      <div className={styles.fieldsWrap}>
        {config.fields.map(field => {
          const options = getOptions(field.type);
          return (
            <div key={field.key} className={styles.field}>
              <label className={styles.fieldLabel}>{field.label}</label>
              {field.multi ? (
                <div className={styles.checkboxGroup}>
                  {options.length === 0 && (
                    <p className={styles.noVars}>
                      {field.type === 'numeric' ? '수치/리커트형' : '범주형'} 변수가 없습니다
                    </p>
                  )}
                  {options.map(opt => (
                    <label key={opt.id} className={styles.checkItem}>
                      <input
                        type="checkbox"
                        checked={(selections[field.key] || []).includes(opt.id)}
                        onChange={() => handleChange(field.key, opt.id, true)}
                      />
                      <span>{opt.label}</span>
                    </label>
                  ))}
                </div>
              ) : (
                <select
                  className={styles.select}
                  value={selections[field.key] || ''}
                  onChange={e => handleChange(field.key, e.target.value, false)}
                >
                  <option value="">-- 선택 --</option>
                  {options.map(opt => (
                    <option key={opt.id} value={opt.id}>{opt.label}</option>
                  ))}
                </select>
              )}
            </div>
          );
        })}
      </div>

      <div className={styles.actions}>
        <button
          className={styles.runBtn}
          onClick={() => onRun(selections)}
          disabled={!isValid()}
        >
          분석 실행
        </button>
      </div>
    </div>
  );
}
