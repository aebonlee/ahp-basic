import { Link } from 'react-router-dom';
import styles from './PublicFooter.module.css';

const FOOTER_LINKS = [
  { to: '/about', label: 'AHP 소개' },
  { to: '/features', label: '주요 기능' },
  { to: '/guide', label: '이용 가이드' },
];

export default function PublicFooter() {
  return (
    <footer className={styles.footer}>
      <div className={styles.footerInner}>
        <div className={styles.footerBrand}>
          <span className={styles.footerLogo}>AHP Basic</span>
          <span className={styles.footerSub}>Decision Analysis Platform</span>
        </div>
        <nav className={styles.footerLinks}>
          {FOOTER_LINKS.map(({ to, label }) => (
            <Link key={to} to={to} className={styles.footerLink}>{label}</Link>
          ))}
        </nav>
        <p className={styles.footerCopy}>&copy; {new Date().getFullYear()} DreamIT Biz. All rights reserved.</p>
      </div>
    </footer>
  );
}
