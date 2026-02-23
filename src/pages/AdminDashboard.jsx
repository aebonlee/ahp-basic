import { useState } from 'react';
import ProjectLayout from '../components/layout/ProjectLayout';
import ProjectPanel from '../components/admin/ProjectPanel';
import ParticipantPanel from '../components/admin/ParticipantPanel';
import ModeSwitch from '../components/admin/ModeSwitch';
import { useProjectList } from '../hooks/useProjects';
import styles from './AdminDashboard.module.css';

export default function AdminDashboard() {
  const { projects, loading } = useProjectList();
  const [selectedProjectId, setSelectedProjectId] = useState(null);

  const selectedProject = projects.find(p => p.id === selectedProjectId) || null;

  return (
    <ProjectLayout>
      <div className={styles.header}>
        <h1 className={styles.title}>프로젝트 관리</h1>
        <ModeSwitch />
      </div>

      <div className={styles.dashboard}>
        <div className={styles.leftPanel}>
          <ProjectPanel
            projects={projects}
            loading={loading}
            selectedProjectId={selectedProjectId}
            onSelect={setSelectedProjectId}
          />
        </div>

        <div className={styles.rightPanel}>
          {selectedProject ? (
            <ParticipantPanel project={selectedProject} />
          ) : (
            <div className={styles.welcome}>
              <h2>AHP Basic에 오신 것을 환영합니다</h2>
              <div className={styles.steps}>
                <div className={styles.step}>
                  <span className={styles.stepNum}>1</span>
                  <div>
                    <h3>프로젝트 생성</h3>
                    <p>왼쪽에서 새 프로젝트를 생성합니다.</p>
                  </div>
                </div>
                <div className={styles.step}>
                  <span className={styles.stepNum}>2</span>
                  <div>
                    <h3>모델 구축 및 평가자 추가</h3>
                    <p>기준과 대안을 설정하고 평가자를 배정합니다.</p>
                  </div>
                </div>
                <div className={styles.step}>
                  <span className={styles.stepNum}>3</span>
                  <div>
                    <h3>평가 시작</h3>
                    <p>모델을 확정하고 평가자에게 평가를 요청합니다.</p>
                  </div>
                </div>
                <div className={styles.step}>
                  <span className={styles.stepNum}>4</span>
                  <div>
                    <h3>결과 보기</h3>
                    <p>평가 결과를 확인하고 분석합니다.</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </ProjectLayout>
  );
}
