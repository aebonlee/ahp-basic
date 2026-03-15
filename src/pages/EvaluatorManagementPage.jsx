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

const PAGE_SIZE = 10;

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
  const [currentPage, setCurrentPage] = useState(1);
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
      // 삭제 후 마지막 페이지 보정
      const remaining = evaluators.length - 1;
      const newTotalPages = Math.max(1, Math.ceil(remaining / PAGE_SIZE));
      if (currentPage > newTotalPages) setCurrentPage(newTotalPages);
    } catch (err) {
      toast.error('삭제 실패: ' + err.message);
    }
  };

  const totalPages = Math.max(1, Math.ceil(evaluators.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const pagedEvaluators = evaluators.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  return (
    <ProjectLayout projectName={currentProject.name}>
      <h1 className={common.pageTitle}>평가자 관리</h1>

      {/* 보상 포인트 & 마켓플레이스 모집 설정 */}
      <div className={common.cardSpaced} style={{ marginBottom: 'var(--spacing-md)' }}>
        <div className={styles.rewardRow}>
          <div className={styles.rewardField}>
            <label className={styles.rewardLabel} htmlFor="rewardPoints">보상 포인트</label>
            <input
              id="rewardPoints"
              type="number"
              min="0"
              className={styles.rewardInput}
              value={currentProject?.reward_points ?? 0}
              onChange={async (e) => {
                const val = parseInt(e.target.value, 10) || 0;
                try {
                  await updateProject(id, { reward_points: val });
                } catch (err) {
                  toast.error('보상 포인트 저장 실패: ' + err.message);
                }
              }}
              placeholder="0"
            />
            <span className={styles.rewardHint}>평가 완료 시 평가자에게 지급 (1P = 1원)</span>
          </div>
          <div className={styles.rewardField}>
            <label className={styles.recruitToggle}>
              <input
                type="checkbox"
                checked={currentProject?.recruit_evaluators ?? false}
                onChange={async (e) => {
                  try {
                    await updateProject(id, { recruit_evaluators: e.target.checked });
                    toast.success(e.target.checked ? '마켓플레이스 공개됨' : '마켓플레이스 비공개');
                  } catch (err) {
                    toast.error('설정 변경 실패: ' + err.message);
                  }
                }}
              />
              <span>마켓플레이스 공개 모집</span>
            </label>
            <span className={styles.rewardHint}>공개 시 평가자 대시보드에 자동 노출</span>
          </div>
        </div>

        {currentProject?.recruit_evaluators && (
          <div className={styles.recruitDescWrap}>
            <label className={styles.rewardLabel} htmlFor="recruitDesc">모집 공고</label>
            <textarea
              id="recruitDesc"
              className={styles.recruitDesc}
              rows={3}
              placeholder="모집 공고 내용을 입력하세요 (평가 내용, 소요 시간 등)"
              defaultValue={currentProject?.recruit_description ?? ''}
              onBlur={async (e) => {
                const val = e.target.value.trim();
                if (val === (currentProject?.recruit_description ?? '')) return;
                try {
                  await updateProject(id, { recruit_description: val || null });
                  toast.success('모집 공고가 저장되었습니다.');
                } catch (err) {
                  toast.error('모집 공고 저장 실패: ' + err.message);
                }
              }}
            />
            <span className={styles.rewardHint}>마켓플레이스와 메인페이지에 노출됩니다</span>
          </div>
        )}
      </div>

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
          <>
          <div className={styles.evaluatorGrid}>
            {pagedEvaluators.map(ev => {
              const done = comparisonCounts[ev.id] || 0;
              const pct = totalRequired > 0 ? Math.min(100, Math.round((done / totalRequired) * 100)) : 0;
              const isPublic = ev.registration_source === 'public';
              const completed = ev.completed || pct >= 100;

              return (
                <div key={ev.id} className={styles.evaluatorCard}>
                  <div className={styles.cardHeader}>
                    <span className={styles.cardName}>{ev.name}</span>
                    <span className={isPublic ? styles.badgePublic : styles.badgeAdmin}>
                      {isPublic ? 'QR 접속' : '직접 등록'}
                    </span>
                  </div>

                  <div className={styles.cardInfo}>
                    {!isPublic && ev.email && (
                      <div className={styles.cardInfoRow}>
                        <span className={styles.cardLabel}>이메일</span>
                        <span className={styles.cardValue}>{ev.email}</span>
                      </div>
                    )}
                    {ev.phone_number && (
                      <div className={styles.cardInfoRow}>
                        <span className={styles.cardLabel}>전화번호</span>
                        <span className={styles.cardValue}>{formatPhone(ev.phone_number)}</span>
                      </div>
                    )}
                  </div>

                  <div className={styles.cardProgress}>
                    <div className={styles.progressBar}>
                      <div className={styles.progressBarFill} style={{ width: `${pct}%` }} />
                    </div>
                    <div className={styles.progressMeta}>
                      <span className={styles.progressPct}>{pct}%</span>
                      <span className={completed ? styles.statusDone : styles.statusPending}>
                        {completed ? '완료' : '미완료'}
                      </span>
                    </div>
                  </div>

                  <div className={styles.cardActions}>
                    <button className={common.linkAction} onClick={handleCopyLink}>
                      링크 복사
                    </button>
                    <button className={common.linkActionDanger} onClick={() => handleDeleteEvaluator(ev.id)}>
                      삭제
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {totalPages > 1 && (
            <div className={styles.pagination}>
              <button
                className={styles.pageBtn}
                disabled={safePage === 1}
                onClick={() => setCurrentPage(safePage - 1)}
              >
                &laquo;
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                <button
                  key={p}
                  className={`${styles.pageBtn} ${p === safePage ? styles.pageBtnActive : ''}`}
                  onClick={() => setCurrentPage(p)}
                >
                  {p}
                </button>
              ))}
              <button
                className={styles.pageBtn}
                disabled={safePage === totalPages}
                onClick={() => setCurrentPage(safePage + 1)}
              >
                &raquo;
              </button>
            </div>
          )}
          </>
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
