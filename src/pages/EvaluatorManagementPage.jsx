import { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useProject } from '../hooks/useProjects';
import { useEvaluators } from '../hooks/useEvaluators';
import { useCriteria } from '../hooks/useCriteria';
import { useAlternatives } from '../hooks/useAlternatives';
import { useProjects } from '../contexts/ProjectContext';
import { useToast } from '../contexts/ToastContext';
import { useConfirm } from '../hooks/useConfirm';
import { useSubscription } from '../hooks/useSubscription';
import { useProjectPlan } from '../hooks/useProjectPlan';
import { isMultiPlan } from '../lib/subscriptionPlans';
import { PROJECT_STATUS, EVAL_METHOD } from '../lib/constants';
import { buildPageSequence } from '../lib/pairwiseUtils';
import ProjectLayout from '../components/layout/ProjectLayout';
import ParticipantForm from '../components/admin/ParticipantForm';
import Button from '../components/common/Button';
import ConfirmDialog from '../components/common/ConfirmDialog';
import LoadingSpinner from '../components/common/LoadingSpinner';
import EmptyState from '../components/common/EmptyState';
import PlanRequiredModal from '../components/common/PlanRequiredModal';
import { formatPhone } from '../lib/evaluatorUtils';
import SmsModal from '../components/admin/SmsModal';
import common from '../styles/common.module.css';
import styles from './EvaluatorManagementPage.module.css';

export default function EvaluatorManagementPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentProject, loading: projLoading } = useProject(id);
  const { evaluators, loading: evalLoading, addEvaluator, deleteEvaluator } = useEvaluators(id);
  const { criteria, loading: critLoading } = useCriteria(id);
  const { alternatives, loading: altLoading } = useAlternatives(id);
  const { updateProject } = useProjects();
  const toast = useToast();
  const { confirm, confirmDialogProps } = useConfirm();
  const [showForm, setShowForm] = useState(false);
  const [starting, setStarting] = useState(false);
  const [comparisonCounts, setComparisonCounts] = useState({});
  const [smsModalOpen, setSmsModalOpen] = useState(false);
  const [planRequiredOpen, setPlanRequiredOpen] = useState(false);
  const { canAddEvaluator, isSuperAdmin } = useSubscription();
  const projectPlan = useProjectPlan(id);
  const maxEvaluators = isSuperAdmin ? Infinity : (projectPlan?.max_evaluators ?? 1);

  const isDirectInput = currentProject?.eval_method === EVAL_METHOD.DIRECT_INPUT;

  // 전체 필요 수 계산 (직접입력: 항목 수, 쌍대비교: 쌍 수)
  const totalRequired = useMemo(() => {
    if (criteria.length === 0) return 0;
    const pages = buildPageSequence(criteria, alternatives, id);
    if (isDirectInput) {
      return pages.reduce((sum, p) => sum + p.items.length, 0);
    }
    return pages.reduce((sum, p) => sum + p.pairs.length, 0);
  }, [criteria, alternatives, id, isDirectInput]);

  // 평가자별 완료 비교 수 로드
  useEffect(() => {
    if (!id || evaluators.length === 0) return;

    const evalMethod = currentProject?.eval_method;
    const table = evalMethod === EVAL_METHOD.DIRECT_INPUT
      ? 'direct_input_values'
      : 'pairwise_comparisons';

    supabase
      .from(table)
      .select('evaluator_id')
      .eq('project_id', id)
      .then(({ data }) => {
        if (!data) return;
        const counts = {};
        for (const row of data) {
          counts[row.evaluator_id] = (counts[row.evaluator_id] || 0) + 1;
        }
        setComparisonCounts(counts);
      }, () => {});
  }, [id, evaluators, currentProject?.eval_method]);

  if (projLoading || evalLoading || critLoading || altLoading) return <ProjectLayout><LoadingSpinner /></ProjectLayout>;
  if (!currentProject) return <ProjectLayout><p>프로젝트를 찾을 수 없습니다.</p></ProjectLayout>;

  const inviteUrl = `${window.location.origin}${window.location.pathname}#/eval/invite/${id}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(inviteUrl);
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
    try {
      await deleteEvaluator(evalId);
    } catch (err) {
      toast.error('삭제 실패: ' + err.message);
    }
  };

  return (
    <ProjectLayout projectName={currentProject.name}>
      <h1 className={common.pageTitle}>평가자 관리</h1>

      <div className={common.cardSpaced}>
        <div className={styles.listHeader}>
          <h2 className={common.cardTitle}>
            평가자 목록 ({evaluators.length}{maxEvaluators === Infinity ? '' : `/${maxEvaluators}`}명)
            {projectPlan && isMultiPlan(projectPlan.plan_type) && (
              <span style={{ fontSize: '0.75rem', color: '#7c3aed', fontWeight: 400, marginLeft: 6 }}>
                (다수 이용권 적용)
              </span>
            )}
          </h2>
          <div className={styles.listHeaderActions}>
            {evaluators.length > 0 && (
              <Button size="sm" variant="secondary" onClick={() => setSmsModalOpen(true)}>SMS 발송</Button>
            )}
            <Button size="sm" onClick={() => {
              if (!canAddEvaluator(evaluators.length, projectPlan)) {
                setPlanRequiredOpen(true);
                return;
              }
              setShowForm(true);
            }}>+ 평가자 추가</Button>
          </div>
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
          <EmptyState
            title="평가자가 없습니다"
            description="평가자를 추가하여 평가를 시작하세요."
            action={{
              label: '+ 평가자 추가',
              onClick: () => {
                if (!canAddEvaluator(0, projectPlan)) {
                  setPlanRequiredOpen(true);
                  return;
                }
                setShowForm(true);
              },
            }}
          />
        ) : (
          <table className={common.dataTable}>
            <thead>
              <tr>
                <th>이름</th>
                <th>이메일</th>
                <th>전화번호</th>
                <th>구분</th>
                <th>진행률</th>
                <th>상태</th>
                <th>관리</th>
              </tr>
            </thead>
            <tbody>
              {evaluators.map(ev => {
                const done = comparisonCounts[ev.id] || 0;
                const pct = totalRequired > 0 ? Math.min(100, Math.round((done / totalRequired) * 100)) : 0;
                const isPublic = ev.registration_source === 'public';

                return (
                  <tr key={ev.id}>
                    <td>{ev.name}</td>
                    <td>{isPublic ? '-' : ev.email}</td>
                    <td>{ev.phone_number ? formatPhone(ev.phone_number) : '-'}</td>
                    <td>
                      <span className={isPublic ? styles.badgePublic : styles.badgeAdmin}>
                        {isPublic ? 'QR 접속' : '직접 등록'}
                      </span>
                    </td>
                    <td className={styles.progressCell}>
                      <div className={styles.progressBar}>
                        <div className={styles.progressBarFill} style={{ width: `${pct}%` }} />
                      </div>
                      <span className={styles.progressPct}>{pct}%</span>
                    </td>
                    <td>{(ev.completed || pct >= 100) ? '완료' : '미완료'}</td>
                    <td>
                      <button className={common.linkAction} onClick={handleCopyLink}>
                        링크 복사
                      </button>
                      <button className={common.linkActionDanger} onClick={() => handleDeleteEvaluator(ev.id)}>
                        삭제
                      </button>
                    </td>
                  </tr>
                );
              })}
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

      <SmsModal
        isOpen={smsModalOpen}
        onClose={() => setSmsModalOpen(false)}
        evaluators={evaluators}
        projectId={id}
        projectName={currentProject?.name}
        projectPlan={projectPlan}
      />

      <PlanRequiredModal
        isOpen={planRequiredOpen}
        onClose={() => setPlanRequiredOpen(false)}
        reason="evaluator"
        maxEvaluators={maxEvaluators}
      />
    </ProjectLayout>
  );
}
