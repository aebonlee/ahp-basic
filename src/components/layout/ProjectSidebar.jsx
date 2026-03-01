import { useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import styles from './ProjectSidebar.module.css';

const STEPS = [
  { key: 'model',         path: '',               label: '모델 구축',     step: 1  },
  { key: 'brain',         path: '/brain',         label: '브레인스토밍',  step: 2  },
  { key: 'confirm',       path: '/confirm',       label: '모델 확정',     step: 3  },
  { key: 'survey',        path: '/survey',        label: '설문 설계',     step: 4  },
  { key: 'eval',          path: '/eval',          label: '평가자 관리',   step: 5  },
  { key: 'workshop',      path: '/workshop',      label: '실시간 워크숍', step: 6  },
  { key: 'result',        path: '/result',        label: '집계 결과',     step: 7  },
  { key: 'survey-result', path: '/survey-result', label: '설문 집계',     step: 8  },
  { key: 'sensitivity',   path: '/sensitivity',   label: '민감도 분석',   step: 9  },
  { key: 'resource',      path: '/resource',      label: '자원 배분',     step: 10 },
  { key: 'statistics',   path: '/statistics',   label: '통계 분석',     step: 11 },
];

const STAT_SUBS = [
  { key: 'descriptive',  label: '기술통계' },
  { key: 'independentT', label: '독립표본 T검정' },
  { key: 'pairedT',      label: '대응표본 T검정' },
  { key: 'anova',        label: '일원분산분석' },
  { key: 'chiSquare',    label: '카이제곱 검정' },
  { key: 'correlation',  label: '상관분석' },
  { key: 'regression',   label: '단순선형회귀' },
  { key: 'cronbach',     label: '크론바흐 알파' },
  { key: 'crossTab',     label: '교차분석' },
  { key: 'spearman',     label: 'Spearman 순위상관' },
];

export default function ProjectSidebar({ projectName, collapsed }) {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const currentPath = location.pathname;
  const search = location.search;
  const hasProject = !!id;
  const basePath = hasProject ? `/admin/project/${id}` : '';
  const statsPath = basePath + '/statistics';
  const isOnStats = hasProject && currentPath === statsPath;

  const [statsOpen, setStatsOpen] = useState(isOnStats);

  return (
    <aside className={`${styles.sidebar} ${collapsed ? styles.collapsed : ''}`}>
      {/* 프로젝트 목록 */}
      <button
        className={`${styles.dashboardItem} ${currentPath === '/admin' ? styles.active : ''}`}
        onClick={() => navigate('/admin')}
        title="프로젝트 목록"
      >
        <span className={styles.dashboardIcon}>☰</span>
        {!collapsed && <span className={styles.menuLabel}>프로젝트 목록</span>}
      </button>

      {/* 프로젝트명 */}
      {hasProject && !collapsed && (
        <div className={styles.projectName} title={projectName}>
          <span className={styles.name}>{projectName || '프로젝트'}</span>
        </div>
      )}

      {/* 단계별 메뉴 */}
      <nav className={styles.nav}>
        {STEPS.map((s) => {
          const fullPath = basePath + s.path;
          const isActive = s.key === 'statistics'
            ? isOnStats
            : hasProject && currentPath === fullPath;

          if (s.key === 'statistics') {
            return (
              <div key={s.key}>
                <button
                  className={`${styles.menuItem} ${isActive ? styles.active : ''} ${!hasProject ? styles.disabled : ''}`}
                  onClick={() => {
                    if (!hasProject) return;
                    if (isOnStats) {
                      setStatsOpen(v => !v);
                    } else {
                      navigate(fullPath);
                      setStatsOpen(true);
                    }
                  }}
                  disabled={!hasProject}
                  title={collapsed ? s.label : undefined}
                >
                  <span className={styles.stepNum}>{s.step}</span>
                  {!collapsed && (
                    <>
                      <span className={styles.menuLabel}>{s.label}</span>
                      <span className={`${styles.arrow} ${statsOpen && isOnStats ? styles.arrowOpen : ''}`}>&#9656;</span>
                    </>
                  )}
                </button>
                {/* 하위 메뉴 */}
                {!collapsed && statsOpen && isOnStats && (
                  <div className={styles.subMenu}>
                    {STAT_SUBS.map((sub, idx) => {
                      const subActive = search === `?type=${sub.key}`;
                      return (
                        <button
                          key={sub.key}
                          className={`${styles.subItem} ${subActive ? styles.subActive : ''}`}
                          onClick={() => navigate(`${statsPath}?type=${sub.key}`)}
                        >
                          <span className={styles.subNum}>{idx + 1}</span>
                          <span>{sub.label}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          }

          return (
            <button
              key={s.key}
              className={`${styles.menuItem} ${isActive ? styles.active : ''} ${!hasProject ? styles.disabled : ''}`}
              onClick={() => hasProject && navigate(fullPath)}
              disabled={!hasProject}
              title={collapsed ? s.label : undefined}
            >
              <span className={styles.stepNum}>{s.step}</span>
              {!collapsed && <span className={styles.menuLabel}>{s.label}</span>}
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
