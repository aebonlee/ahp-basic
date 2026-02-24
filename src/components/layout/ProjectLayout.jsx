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
  const [activeTab, setActiveTab] = useState('researcher');

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
                <div className={styles.tabBar}>
                  <button
                    className={`${styles.tab} ${activeTab === 'researcher' ? styles.tabActive : ''}`}
                    onClick={() => setActiveTab('researcher')}
                  >
                    연구자 가이드
                  </button>
                  <button
                    className={`${styles.tab} ${activeTab === 'evaluator' ? styles.tabActive : ''}`}
                    onClick={() => setActiveTab('evaluator')}
                  >
                    평가자 가이드
                  </button>
                </div>
                <div className={styles.tabContent}>
                  {activeTab === 'researcher' ? <ResearcherGuide /> : <EvaluatorGuideSidebar />}
                </div>
              </>
            ) : (
              <div className={styles.collapsedGuide}>
                <button
                  className={`${styles.collapsedTab} ${activeTab === 'researcher' ? styles.collapsedTabActive : ''}`}
                  onClick={() => { setActiveTab('researcher'); setRightOpen(true); }}
                  title="연구자 가이드"
                >
                  <span className={styles.collapsedLabel}>R</span>
                </button>
                <div className={styles.collapsedDot} />
                <button
                  className={`${styles.collapsedTab} ${activeTab === 'evaluator' ? styles.collapsedTabActive : ''}`}
                  onClick={() => { setActiveTab('evaluator'); setRightOpen(true); }}
                  title="평가자 가이드"
                >
                  <span className={styles.collapsedLabel}>E</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
