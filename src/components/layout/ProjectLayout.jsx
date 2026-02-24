import { useState } from 'react';
import Navbar from './Navbar';
import Footer from './Footer';
import ProjectSidebar from './ProjectSidebar';
import ResearcherGuide from '../admin/ResearcherGuide';
import EvaluatorGuideSidebar from '../admin/EvaluatorGuideSidebar';
import styles from './ProjectLayout.module.css';

export default function ProjectLayout({ children, projectName }) {
  const [leftOpen, setLeftOpen] = useState(true);
  const [rightOpen, setRightOpen] = useState(true);

  return (
    <div className={styles.layout}>
      <Navbar />
      <div className={styles.body}>
        {/* ─── Left Sidebar ─── */}
        <div className={`${styles.sidebarWrap} ${leftOpen ? '' : styles.collapsed}`}>
          <ProjectSidebar projectName={projectName} collapsed={!leftOpen} />
          <button
            className={styles.toggleBtn}
            onClick={() => setLeftOpen(v => !v)}
            title={leftOpen ? '사이드바 접기' : '사이드바 펼치기'}
          >
            {leftOpen ? '‹' : '›'}
          </button>
        </div>

        {/* ─── Main ─── */}
        <main className={styles.content}>
          {children}
        </main>

        {/* ─── Right Sidebar ─── */}
        <div className={`${styles.sidebarWrap} ${styles.right} ${rightOpen ? '' : styles.collapsed}`}>
          <button
            className={`${styles.toggleBtn} ${styles.toggleRight}`}
            onClick={() => setRightOpen(v => !v)}
            title={rightOpen ? '가이드 접기' : '가이드 펼치기'}
          >
            {rightOpen ? '›' : '‹'}
          </button>
          <div className={styles.rightSidebar}>
            {rightOpen ? (
              <>
                <ResearcherGuide />
                <div className={styles.guideDivider} />
                <EvaluatorGuideSidebar />
              </>
            ) : (
              <div className={styles.collapsedGuide}>
                <span className={styles.collapsedIcon}>🔬</span>
                <span className={styles.collapsedVertical}>연구자</span>
                <div className={styles.collapsedDot} />
                <span className={styles.collapsedIcon}>👨‍💼</span>
                <span className={styles.collapsedVertical}>평가자</span>
              </div>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
