import { useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useToast } from '../../contexts/ToastContext';
import { useConfirm } from '../../hooks/useConfirm';
import Button from '../common/Button';
import ConfirmDialog from '../common/ConfirmDialog';
import styles from '../../styles/results.module.css';

export default function SignaturePanel({ projectId, evaluatorId, allComplete, allConsistent, completedCells, totalCells }) {
  const [signed, setSigned] = useState(false);
  const [loading, setLoading] = useState(false);
  const toast = useToast();
  const { confirm, confirmDialogProps } = useConfirm();

  const handleSign = async () => {
    let msg = '평가를 완료하시겠습니까?';
    if (!allComplete) msg = `아직 미완료 항목이 있습니다 (${completedCells}/${totalCells}). 그래도 완료하시겠습니까?`;
    else if (!allConsistent) msg = '비일관성비율이 높은 항목이 있습니다. 그래도 완료하시겠습니까?';

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
    } catch (err) {
      toast.error('완료 처리 실패: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.signaturePanel}>
      <div className={styles.signatureInfo}>
        <span>평가 진행: {completedCells}/{totalCells}</span>
        {!allConsistent && <span className={styles.warn}>비일관성 항목이 있습니다</span>}
      </div>
      {signed ? (
        <div className={styles.signedMsg}>평가가 완료되었습니다.</div>
      ) : (
        <Button
          variant="success"
          loading={loading}
          onClick={handleSign}
        >
          평가 완료
        </Button>
      )}
      <ConfirmDialog {...confirmDialogProps} />
    </div>
  );
}
