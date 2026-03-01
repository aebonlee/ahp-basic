import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import PublicLayout from '../components/layout/PublicLayout';
import styles from './HomePage.module.css';

const FEATURES = [
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
        <rect x="3" y="6" width="22" height="16" rx="2" stroke="currentColor" strokeWidth="1.5" />
        <path d="M3 10h22" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="8" cy="18" r="2" stroke="currentColor" strokeWidth="1.5" />
        <path d="M12 16h8M12 20h5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
    title: '계층 모델 구축',
    desc: '기준과 대안을 트리 구조로 구성하여 의사결정 모델을 직관적으로 설계합니다.',
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
        <path d="M14 4v6M14 18v6M4 14h6M18 14h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="14" cy="14" r="4" stroke="currentColor" strokeWidth="1.5" />
        <path d="M7.5 7.5l3 3M17.5 17.5l3 3M7.5 20.5l3-3M17.5 10.5l3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
    title: '쌍대비교 평가',
    desc: '17점 척도의 쌍대비교 그리드로 정밀한 평가와 실시간 일관성(CR) 검증을 수행합니다.',
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
        <circle cx="10" cy="10" r="4" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="18" cy="10" r="4" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="14" cy="18" r="4" stroke="currentColor" strokeWidth="1.5" />
        <path d="M14 22v3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
    title: '다수 평가자 집계',
    desc: '여러 평가자를 초대하고, 가중 기하평균으로 의견을 과학적으로 집계합니다.',
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
        <path d="M4 22L10 14L16 18L24 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="24" cy="6" r="2" fill="currentColor" />
        <path d="M4 24h20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
    title: '결과 분석 & 내보내기',
    desc: '종합중요도, 민감도 분석, 자원 배분, Excel/PDF 내보내기를 제공합니다.',
  },
];

const STAT_FEATURES = [
  { icon: '📊', title: '기술통계', desc: '평균, 표준편차, 왜도, 첨도 등' },
  { icon: '📏', title: '독립표본 T검정', desc: '두 집단 간 평균 차이 검정' },
  { icon: '🔁', title: '대응표본 T검정', desc: '사전-사후 비교 등 대응 검정' },
  { icon: '📈', title: '일원분산분석', desc: '3개 이상 집단 간 평균 비교' },
  { icon: '📋', title: '카이제곱 검정', desc: '범주형 변수 간 독립성 검정' },
  { icon: '🔗', title: '상관분석', desc: 'Pearson 상관계수 행렬' },
  { icon: '📉', title: '단순선형회귀', desc: '독립-종속 변수 회귀 분석' },
  { icon: '✅', title: '크론바흐 알파', desc: '리커트 문항 신뢰도 분석' },
  { icon: '🗂', title: '교차분석', desc: '빈도표, 비율, 기대빈도, 잔차' },
  { icon: '📇', title: 'Spearman 순위상관', desc: '비정규 데이터 순위 상관분석' },
];

const STEPS = [
  { num: '01', title: '프로젝트 생성', desc: '의사결정 주제를 설정하고 프로젝트를 시작합니다.' },
  { num: '02', title: '모델 구축', desc: '브레인스토밍으로 기준과 대안을 계층 구조로 구성합니다.' },
  { num: '03', title: '평가 진행', desc: '평가자를 초대하고 쌍대비교 또는 직접입력 평가를 수행합니다.' },
  { num: '04', title: '결과 도출', desc: '종합순위를 확인하고 민감도 분석으로 의사결정을 검증합니다.' },
];

const STATS = [
  { value: 'AHP', label: 'Analytic Hierarchy Process' },
  { value: '1~9', label: '점 쌍대비교 척도' },
  { value: 'CR', label: '일관성비율 자동 검증' },
  { value: 'N명', label: '다수 평가자 동시 지원' },
];

export default function HomePage() {
  const navigate = useNavigate();
  const { isLoggedIn } = useAuth();

  return (
    <PublicLayout>
      {/* ─── Hero ─── */}
      <section className={styles.hero}>
        <div className={styles.heroBgGradient} />
        <div className={styles.heroOrb1} />
        <div className={styles.heroOrb2} />
        <div className={styles.heroOrb3} />
        <div className={styles.heroOrb4} />
        <div className={styles.heroGrid} />
        <div className={styles.heroHierarchy}>
          <div className={styles.hierNode1} />
          <div className={styles.hierNode2} />
          <div className={styles.hierNode3} />
          <div className={styles.hierNode4} />
          <div className={styles.hierNode5} />
        </div>
        <div className={styles.heroContent}>
          <p className={styles.heroBadge}>
            <span className={styles.badgeDot} />
            Decision Analysis Platform
          </p>
          <h1 className={styles.heroTitle}>
            The Best Decision.<br />
            <span className={styles.heroAccent}>AHP Basic.</span>
          </h1>
          <p className={styles.heroDesc}>
            체계적 의사결정 분석을 위한 올인원 AHP 플랫폼.<br />
            다기준 의사결정 문제를 계층적으로 분석하고,<br className={styles.brMobile} />
            최적의 대안을 과학적으로 도출하세요.
          </p>
          <div className={styles.heroCta}>
            {isLoggedIn ? (
              <button className={styles.ctaPrimary} onClick={() => navigate('/admin')}>
                대시보드로 이동
                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </button>
            ) : (
              <>
                <button className={styles.ctaPrimary} onClick={() => navigate('/register')}>
                  무료로 시작하기
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </button>
                <button className={styles.ctaSecondary} onClick={() => navigate('/login')}>
                  로그인
                </button>
              </>
            )}
          </div>
        </div>
        {/* Scroll indicator */}
        <div className={styles.scrollDown}>
          <div className={styles.scrollMouse}>
            <div className={styles.scrollDot} />
          </div>
        </div>
      </section>

      {/* ─── Stats Bar ─── */}
      <section className={styles.statsBar}>
        <div className={styles.statsInner}>
          {STATS.map((s, i) => (
            <div key={i} className={styles.statItem}>
              <span className={styles.statValue}>{s.value}</span>
              <span className={styles.statLabel}>{s.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Features ─── */}
      <section id="features" className={styles.features}>
        <div className={styles.sectionInner}>
          <p className={styles.sectionTag}>FEATURES</p>
          <h2 className={styles.sectionTitle}>핵심 기능</h2>
          <p className={styles.sectionSub}>AHP 분석의 전 과정을 하나의 플랫폼에서</p>
          <div className={styles.featureGrid}>
            {FEATURES.map((f, i) => (
              <div key={i} className={styles.featureCard}>
                <div className={styles.featureIcon}>{f.icon}</div>
                <h3 className={styles.featureTitle}>{f.title}</h3>
                <p className={styles.featureDesc}>{f.desc}</p>
                <div className={styles.featureNum}>{String(i + 1).padStart(2, '0')}</div>
              </div>
            ))}
          </div>
          <div className={styles.sectionMore}>
            <Link to="/features" className={styles.moreLink}>
              자세히 보기
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M5 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </Link>
          </div>
        </div>
      </section>

      {/* ─── Process ─── */}
      <section id="process" className={styles.process}>
        <div className={styles.sectionInner}>
          <p className={styles.sectionTagLight}>PROCESS</p>
          <h2 className={styles.sectionTitleLight}>4단계로 완성하는 의사결정 분석</h2>
          <div className={styles.stepGrid}>
            {STEPS.map((s, i) => (
              <div key={i} className={styles.stepCard}>
                <span className={styles.stepNum}>{s.num}</span>
                <div className={styles.stepLine} />
                <h3 className={styles.stepTitle}>{s.title}</h3>
                <p className={styles.stepDesc}>{s.desc}</p>
              </div>
            ))}
          </div>
          <div className={styles.sectionMoreLight}>
            <Link to="/guide" className={styles.moreLinkLight}>
              자세히 보기
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M5 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </Link>
            <Link to="/manual" className={styles.moreLinkLight} style={{ marginLeft: 24 }}>
              사용설명서
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M5 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </Link>
          </div>
        </div>
      </section>

      {/* ─── Statistics ─── */}
      <section id="statistics" className={styles.statsSection}>
        <div className={styles.sectionInner}>
          <p className={styles.sectionTag}>STATISTICS</p>
          <h2 className={styles.sectionTitle}>통계 분석</h2>
          <p className={styles.sectionSub}>SPSS 없이도 주요 통계분석을 바로 수행</p>
          <div className={styles.statCardGrid}>
            {STAT_FEATURES.map((s, i) => (
              <div key={i} className={styles.statCard}>
                <div className={styles.statCardIcon}>{s.icon}</div>
                <h3 className={styles.statCardTitle}>{s.title}</h3>
                <p className={styles.statCardDesc}>{s.desc}</p>
              </div>
            ))}
          </div>
          <div className={styles.sectionMore}>
            <Link to="/features" className={styles.moreLink}>
              자세히 보기 →
            </Link>
          </div>
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section id="start" className={styles.ctaSection}>
        <div className={styles.ctaGlow} />
        <div className={styles.ctaContent}>
          <h2 className={styles.ctaTitle}>지금 시작하세요</h2>
          <p className={styles.ctaDesc}>
            복잡한 의사결정, AHP Basic과 함께라면 명확해집니다.
          </p>
          {isLoggedIn ? (
            <button className={styles.ctaPrimary} onClick={() => navigate('/admin')}>
              대시보드로 이동
              <svg width="16" height="16" viewBox="0 0 16 16"><path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
          ) : (
            <button className={styles.ctaPrimary} onClick={() => navigate('/register')}>
              무료로 시작하기
              <svg width="16" height="16" viewBox="0 0 16 16"><path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
          )}
        </div>
      </section>
    </PublicLayout>
  );
}
