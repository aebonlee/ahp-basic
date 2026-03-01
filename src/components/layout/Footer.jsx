import { Link } from 'react-router-dom';
import styles from './Footer.module.css';

const SITE_LINKS = [
  { to: '/about', label: 'AHP 소개' },
  { to: '/features', label: '주요 기능' },
  { to: '/survey-stats', label: '설문 및 통계' },
  { to: '/management', label: '관리 기능' },
  { to: '/guide', label: '이용 가이드' },
  { to: '/manual', label: '사용설명서' },
];

const FAMILY_SITES = [
  { url: 'https://www.dreamitbiz.com', label: 'DreamIT Biz 메인' },
  { url: 'https://books.dreamitbiz.com', label: 'DreamIT Biz 출판사' },
  { url: 'https://competency.dreamitbiz.com', label: '핵심역량 자가측정' },
];

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.grid}>
          {/* Brand & Company Info */}
          <div className={styles.brand}>
            <h3 className={styles.brandName}>
              <span className={styles.brandDream}>Dream</span>
              <span className={styles.brandIt}>IT</span>{' '}
              <span className={styles.brandBiz}>Biz</span>
            </h3>
            <p className={styles.brandDesc}>
              체계적 의사결정 분석을 위한 올인원 AHP 플랫폼.
              다기준 의사결정 문제를 계층적으로 분석하고, 최적의 대안을 과학적으로 도출합니다.
            </p>
            <div className={styles.companyInfo}>
              <p><strong>드림아이티비즈(DreamIT Biz)</strong></p>
              <p>대표이사: 이애본</p>
              <p>사업자등록번호: 601-45-20154</p>
              <p>통신판매신고: 제2024-수원팔달-0584호</p>
            </div>
          </div>

          {/* Quick Links */}
          <div className={styles.section}>
            <h4>바로가기</h4>
            <ul className={styles.linkList}>
              {SITE_LINKS.map(({ to, label }) => (
                <li key={to}>
                  <Link to={to}>{label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div className={styles.section}>
            <h4>Contact</h4>
            <p>경기도 수원시 팔달구 매산로 45, 419호</p>
            <p>aebon@dreamitbiz.com</p>
            <p>010-3700-0629</p>
            <p>카카오톡: aebon</p>
            <p className={styles.hours}>평일: 09:00 ~ 18:00</p>
            <div className={styles.family}>
              <select
                defaultValue=""
                onChange={(e) => {
                  if (e.target.value) window.open(e.target.value, '_blank');
                  e.target.value = '';
                }}
              >
                <option value="" disabled>Family Site</option>
                {FAMILY_SITES.map(({ url, label }) => (
                  <option key={url} value={url}>{label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className={styles.bottom}>
          <p>&copy; 2020-{year} DreamIT Biz. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
