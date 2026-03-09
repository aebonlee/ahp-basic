import { useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useToast } from '../../contexts/ToastContext';
import { useConfirm } from '../../hooks/useConfirm';
import Button from '../common/Button';
import ConfirmDialog from '../common/ConfirmDialog';
import styles from '../../styles/results.module.css';

export default function SignaturePanel({ projectId, evaluatorId, allComplete, allConsistent, completedCells, totalCells, hasSurveyResponses }) {
  const [signed, setSigned] = useState(false);
  const [loading, setLoading] = useState(false);
  const toast = useToast();
  const { confirm, confirmDialogProps } = useConfirm();

  const percent = totalCells > 0 ? Math.round((completedCells / totalCells) * 100) : 0;

  const handleSign = async () => {
    let msg = '평가를 완료하시겠습니까?';
    if (!allComplete) msg = `아직 미완료 항목이 있습니다 (${completedCells}/${totalCells}). 그래도 완료하시겠습니까?`;
    else if (!allConsistent) msg = '비일관성비율이 높은 항목이 있습니다. 그래도 완료하시겠습니까?';
    if (hasSurveyResponses) msg += '\n\n설문 응답을 확인하셨습니까? "설문 응답" 탭에서 본인의 응답을 확인할 수 있습니다.';

    if (!(await confirm({ title: '평가 완료', message: msg, variant: 'warning' }))) return;

    setLoading(true);
    try {
      await supabase.from('evaluation_signatures').insert({
        project_id: projectId,
        evaluator_id: evaluatorId,
        signed_at: new Date().toISOString(),
      });
      await supabase.from('evaluators')
        .update({ completed: true })
        .eq('id', evaluatorId);
      setSigned(true);
      toast.success('평가가 완료되었습니다.');
    } catch (err) {
      toast.error('완료 처리 실패: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.signaturePanel}>
      {/* Progress Section */}
      <div className={styles.sigProgress}>
        <div className={styles.sigProgressHeader}>
          <span className={styles.sigProgressLabel}>평가 진행</span>
          <span className={styles.sigProgressValue}>
            {completedCells}/{totalCells} ({percent}%)
          </span>
        </div>
        <div className={styles.sigProgressBar}>
          <div
            className={styles.sigProgressFill}
            style={{ width: `${percent}%` }}
            data-complete={percent === 100 ? '' : undefined}
          />
        </div>
        {!allConsistent && (
          <span className={styles.sigWarn}>비일관성 기준 초과 항목이 있습니다</span>
        )}
      </div>

      {/* Action Section */}
      <div className={styles.sigAction}>
        {signed ? (
          <div className={styles.sigComplete}>
            <span className={styles.sigCompleteIcon}>{'\u2714'}</span>
            평가가 완료되었습니다
          </div>
        ) : (
          <Button
            variant="success"
            loading={loading}
            onClick={handleSign}
          >
            평가 완료
          </Button>
        )}
      </div>

      <ConfirmDialog {...confirmDialogProps} />
    </div>
  );
}
