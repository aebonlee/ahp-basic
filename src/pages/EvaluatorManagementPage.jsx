import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useProject } from '../hooks/useProjects';
import { useEvaluators } from '../hooks/useEvaluators';
import { useProjects } from '../contexts/ProjectContext';
import { useToast } from '../contexts/ToastContext';
import { useConfirm } from '../hooks/useConfirm';
import { PROJECT_STATUS } from '../lib/constants';
import ProjectLayout from '../components/layout/ProjectLayout';
import ParticipantForm from '../components/admin/ParticipantForm';
import Button from '../components/common/Button';
import ConfirmDialog from '../components/common/ConfirmDialog';
import LoadingSpinner from '../components/common/LoadingSpinner';
import common from '../styles/common.module.css';
import styles from './EvaluatorManagementPage.module.css';

export default function EvaluatorManagementPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentProject, loading: projLoading } = useProject(id);
  const { evaluators, loading: evalLoading, addEvaluator, deleteEvaluator } = useEvaluators(id);
  const { updateProject } = useProjects();
  const toast = useToast();
  const { confirm, confirmDialogProps } = useConfirm();
  const [showForm, setShowForm] = useState(false);
  const [starting, setStarting] = useState(false);

  if (projLoading || evalLoading) return <ProjectLayout><LoadingSpinner /></ProjectLayout>;
  if (!currentProject) return <ProjectLayout><p>프로젝트를 찾을 수 없습니다.</p></ProjectLayout>;

  const inviteUrl = `${window.location.origin}${window.location.pathname}#/eval/invite/${id}`;

  const handleCopyLink = (evalId) => {
    const url = `${inviteUrl}?eval=${evalId}`;
    navigator.clipboard.writeText(url);
    toast.success('초대 링크가 복사되었습니다.');
  };

  const handleStartEvaluation = async () => {
    if (evaluators.length === 0) {
      toast.warning('평가자를 1명 이상 추가해주세요.');
      return;
    }
    if (!(await confirm({ title: '평가 시작', message: '평가를 시작하시겠습니까?', variant: 'warning' }))) return;
    setStarting(true);
    try {
      await updateProject(id, { status: PROJECT_STATUS.EVALUATING });
      toast.success('평가가 시작되었습니다.');
    } catch (err) {
      toast.error('시작 실패: ' + err.message);
    } finally {
      setStarting(false);
    }
  };

  const handleDeleteEvaluator = async (evalId) => {
    if (!(await confirm({ title: '평가자 삭제', message: '삭제하시겠습니까?', variant: 'danger' }))) return;
    deleteEvaluator(evalId);
  };

  return (
    <ProjectLayout projectName={currentProject.name}>
      <h1 className={common.pageTitle}>평가자 관리</h1>

      <div className={common.cardSpaced}>
        <div className={styles.listHeader}>
          <h2 className={common.cardTitle}>평가자 목록 ({evaluators.length}명)</h2>
          <Button size="sm" onClick={() => setShowForm(true)}>+ 평가자 추가</Button>
        </div>

        {showForm && (
          <ParticipantForm
            onSave={async (data) => {
              await addEvaluator(data);
              setShowForm(false);
            }}
            onClose={() => setShowForm(false)}
          />
        )}

        {evaluators.length === 0 ? (
          <p className={common.emptyText}>평가자를 추가해주세요.</p>
        ) : (
          <table className={common.dataTable}>
            <thead>
              <tr>
                <th>이름</th>
                <th>이메일</th>
                <th>상태</th>
                <th>관리</th>
              </tr>
            </thead>
            <tbody>
              {evaluators.map(ev => (
                <tr key={ev.id}>
                  <td>{ev.name}</td>
                  <td>{ev.email}</td>
                  <td>{ev.completed ? '완료' : '미완료'}</td>
                  <td>
                    <button className={common.linkAction} onClick={() => handleCopyLink(ev.id)}>
                      링크 복사
                    </button>
                    <button className={common.linkActionDanger} onClick={() => handleDeleteEvaluator(ev.id)}>
                      삭제
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className={common.actionRow}>
        <Button variant="success" loading={starting} onClick={handleStartEvaluation}>
          평가 시작
        </Button>
      </div>

      <ConfirmDialog {...confirmDialogProps} />
    </ProjectLayout>
  );
}
