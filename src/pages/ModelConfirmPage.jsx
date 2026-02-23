import { useParams, useNavigate } from 'react-router-dom';
import { useProject } from '../hooks/useProjects';
import { useCriteria } from '../hooks/useCriteria';
import { useAlternatives } from '../hooks/useAlternatives';
import { useProjects } from '../contexts/ProjectContext';
import { useToast } from '../contexts/ToastContext';
import { useConfirm } from '../hooks/useConfirm';
import { PROJECT_STATUS } from '../lib/constants';
import ProjectLayout from '../components/layout/ProjectLayout';
import ModelPreview from '../components/model/ModelPreview';
import Button from '../components/common/Button';
import ConfirmDialog from '../components/common/ConfirmDialog';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { useState } from 'react';
import common from '../styles/common.module.css';
import styles from './ModelConfirmPage.module.css';

export default function ModelConfirmPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentProject, loading: projectLoading } = useProject(id);
  const { criteria, loading: criteriaLoading, getTree } = useCriteria(id);
  const { alternatives, loading: altLoading } = useAlternatives(id);
  const { updateProject } = useProjects();
  const toast = useToast();
  const { confirm, confirmDialogProps } = useConfirm();
  const [confirming, setConfirming] = useState(false);

  if (projectLoading || criteriaLoading || altLoading) return <ProjectLayout><LoadingSpinner /></ProjectLayout>;
  if (!currentProject) return <ProjectLayout><p>프로젝트를 찾을 수 없습니다.</p></ProjectLayout>;

  const criteriaTree = getTree();
  const canConfirm = criteria.length >= 2 && alternatives.length >= 2;

  const handleConfirm = async () => {
    if (!canConfirm) {
      toast.warning('기준 2개 이상, 대안 2개 이상이 필요합니다.');
      return;
    }
    if (!(await confirm({ title: '모델 확정', message: '모델을 확정하시겠습니까? 확정 후 기준/대안 수정이 제한됩니다.', variant: 'warning' }))) return;
    setConfirming(true);
    try {
      await updateProject(id, { status: PROJECT_STATUS.WAITING });
      navigate(`/admin/project/${id}/eval`);
    } catch (err) {
      toast.error('확정 실패: ' + err.message);
    } finally {
      setConfirming(false);
    }
  };

  return (
    <ProjectLayout projectName={currentProject.name}>
      <h1 className={common.pageTitle}>모델 확정</h1>

      <div className={common.card}>
        <h2 className={common.cardTitle}>모델 구조 검토</h2>
        <p className={styles.meta}>
          기준: {criteria.length}개 | 대안: {alternatives.filter(a => !a.parent_id).length}개
        </p>

        <ModelPreview
          projectName={currentProject.name}
          criteriaTree={criteriaTree}
          alternatives={alternatives}
          inline
        />

        <div className={styles.actions}>
          <Button variant="secondary" onClick={() => navigate(`/admin/project/${id}`)}>
            모델 수정
          </Button>
          <Button
            variant="success"
            loading={confirming}
            disabled={!canConfirm}
            onClick={handleConfirm}
          >
            모델 확정
          </Button>
        </div>
      </div>

      <ConfirmDialog {...confirmDialogProps} />
    </ProjectLayout>
  );
}
