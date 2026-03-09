import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import styles from './PublicNav.module.css';

const NAV_LINKS = [
  { to: '/about', label: 'AHP 소개' },
  { to: '/features', label: '주요 기능' },
  { to: '/survey-stats', label: '설문 및 통계' },
  { to: '/management', label: '관리 기능' },
  { to: '/guide', label: '이용 가이드' },
  { to: '/learn', label: '학습 가이드' },
  { to: '/manual', label: '사용설명서' },
  { to: '/pricing', label: '사용요금' },
];

export default function PublicNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isLoggedIn } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (path) => location.pathname === path;

  return (
    <>
      <header className={styles.nav}>
        <div className={styles.navInner}>
          <Link to="/" className={styles.logo}>
            <span className={styles.logoMark}>AHP</span>
            <span className={styles.logoText}>Basic</span>
          </Link>

          <nav className={styles.navLinks}>
            {NAV_LINKS.map(({ to, label }) => (
              <Link
                key={to}
                to={to}
                className={`${styles.navLink} ${isActive(to) ? styles.active : ''}`}
                aria-current={isActive(to) ? 'page' : undefined}
              >
                {label}
              </Link>
            ))}
          </nav>

          <div className={styles.navActions}>
            {isLoggedIn ? (
              <button className={styles.navBtn} onClick={() => navigate('/admin')}>대시보드</button>
            ) : (
              <>
                <button className={styles.navBtnGhost} onClick={() => navigate('/login')}>로그인</button>
                <button className={styles.navBtn} onClick={() => navigate('/register')}>시작하기</button>
              </>
            )}
          </div>

          <button
            className={styles.hamburger}
            onClick={() => setMobileOpen((v) => !v)}
            aria-label={mobileOpen ? '메뉴 닫기' : '메뉴 열기'}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
            ) : (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 12h18M3 6h18M3 18h18" /></svg>
            )}
          </button>
        </div>
      </header>

      <div className={`${styles.mobileMenu} ${mobileOpen ? styles.open : ''}`} aria-hidden={!mobileOpen}>
        {NAV_LINKS.map(({ to, label }) => (
          <Link
            key={to}
            to={to}
            className={`${styles.mobileLink} ${isActive(to) ? styles.active : ''}`}
            onClick={() => setMobileOpen(false)}
            aria-current={isActive(to) ? 'page' : undefined}
          >
            {label}
          </Link>
        ))}
        <div className={styles.mobileDivider} />
        {isLoggedIn ? (
          <button className={styles.mobileBtnPrimary} onClick={() => { navigate('/admin'); setMobileOpen(false); }}>대시보드</button>
        ) : (
          <>
            <button className={styles.mobileBtnGhost} onClick={() => { navigate('/login'); setMobileOpen(false); }}>로그인</button>
            <button className={styles.mobileBtnPrimary} onClick={() => { navigate('/register'); setMobileOpen(false); }}>시작하기</button>
          </>
        )}
      </div>
    </>
  );
}
