import { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useCart } from '../../contexts/CartContext';
import styles from './PublicNav.module.css';
import '../../styles/shop.css';

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

const COLOR_SCHEMES = [
  { key: 'blue', label: '다크 블루', color: '#0046C8' },
  { key: 'indigo', label: '인디고', color: '#4338ca' },
  { key: 'teal', label: '오션 틸', color: '#0284c7' },
  { key: 'green', label: '포레스트', color: '#059669' },
  { key: 'purple', label: '로얄 퍼플', color: '#6d28d9' },
];

function applyColorScheme(key) {
  if (key === 'blue') {
    document.documentElement.removeAttribute('data-color-scheme');
  } else {
    document.documentElement.setAttribute('data-color-scheme', key);
  }
  localStorage.setItem('color-scheme', key);
}

export default function PublicNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isLoggedIn } = useAuth();
  const { cartCount } = useCart();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [activeScheme, setActiveScheme] = useState('blue');
  const paletteRef = useRef(null);

  useEffect(() => {
    const saved = localStorage.getItem('color-scheme');
    if (saved && COLOR_SCHEMES.some((s) => s.key === saved)) {
      setActiveScheme(saved);
      applyColorScheme(saved);
    }
  }, []);

  useEffect(() => {
    if (!paletteOpen) return;
    function handleClickOutside(e) {
      if (paletteRef.current && !paletteRef.current.contains(e.target)) {
        setPaletteOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [paletteOpen]);

  const handleSchemeChange = (key) => {
    setActiveScheme(key);
    applyColorScheme(key);
    setPaletteOpen(false);
  };

  const isActive = (path) => location.pathname === path;

  return (
    <>
      <a href="#main-content" className={styles.skipLink}>본문으로 건너뛰기</a>
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
            <div className={styles.paletteWrap} ref={paletteRef}>
              <button
                className={styles.paletteBtn}
                onClick={() => setPaletteOpen((v) => !v)}
                aria-label="컬러 테마 변경"
                aria-expanded={paletteOpen}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
                  <circle cx="13.5" cy="6.5" r="0.5" fill="currentColor" stroke="none" />
                  <circle cx="17.5" cy="10.5" r="0.5" fill="currentColor" stroke="none" />
                  <circle cx="8.5" cy="7.5" r="0.5" fill="currentColor" stroke="none" />
                  <circle cx="6.5" cy="12.5" r="0.5" fill="currentColor" stroke="none" />
                  <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z" />
                </svg>
              </button>
              {paletteOpen && (
                <div className={styles.paletteDropdown}>
                  {COLOR_SCHEMES.map((scheme) => (
                    <button
                      key={scheme.key}
                      className={`${styles.colorSwatch} ${activeScheme === scheme.key ? styles.colorSwatchActive : ''}`}
                      style={{ background: scheme.color }}
                      onClick={() => handleSchemeChange(scheme.key)}
                      aria-label={scheme.label}
                      title={scheme.label}
                    >
                      {activeScheme === scheme.key && (
                        <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" width="14" height="14">
                          <path d="M20 6L9 17l-5-5" />
                        </svg>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <Link to="/cart" className={styles.cartIconLink} aria-label="장바구니">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="22" height="22">
                <circle cx="9" cy="21" r="1" />
                <circle cx="20" cy="21" r="1" />
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
              </svg>
              {cartCount > 0 && <span className={styles.cartBadge}>{cartCount}</span>}
            </Link>
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
        <Link
          to="/cart"
          className={styles.mobileCartLink}
          onClick={() => setMobileOpen(false)}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
            <circle cx="9" cy="21" r="1" />
            <circle cx="20" cy="21" r="1" />
            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
          </svg>
          <span>장바구니</span>
          {cartCount > 0 && <span className={styles.mobileCartBadge}>{cartCount}</span>}
        </Link>
        <div className={styles.mobileDivider} />
        <div className={styles.mobileColorScheme}>
          <span className={styles.mobileColorLabel}>컬러 테마</span>
          <div className={styles.mobileColorSwatches}>
            {COLOR_SCHEMES.map((scheme) => (
              <button
                key={scheme.key}
                className={`${styles.colorSwatch} ${activeScheme === scheme.key ? styles.colorSwatchActive : ''}`}
                style={{ background: scheme.color }}
                onClick={() => handleSchemeChange(scheme.key)}
                aria-label={scheme.label}
                title={scheme.label}
              >
                {activeScheme === scheme.key && (
                  <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" width="14" height="14">
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                )}
              </button>
            ))}
          </div>
        </div>
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
