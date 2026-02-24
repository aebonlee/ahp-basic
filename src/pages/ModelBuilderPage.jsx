import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useProject } from '../hooks/useProjects';
import { useCriteria } from '../hooks/useCriteria';
import { useAlternatives } from '../hooks/useAlternatives';
import { useConfirm } from '../hooks/useConfirm';
import { useBrainstormingImport } from '../hooks/useBrainstormingImport';
import ProjectLayout from '../components/layout/ProjectLayout';
import CriteriaForm from '../components/model/CriteriaForm';
import AlternativeForm from '../components/model/AlternativeForm';
import EvalMethodSelect from '../components/model/EvalMethodSelect';
import ModelPreview from '../components/model/ModelPreview';
import HierarchyCanvas from '../components/model/HierarchyCanvas';
import Button from '../components/common/Button';
import ConfirmDialog from '../components/common/ConfirmDialog';
import LoadingSpinner from '../components/common/LoadingSpinner';
import styles from './ModelBuilderPage.module.css';

export default function ModelBuilderPage() {
  const { id } = useParams();
  const { currentProject, loading: projectLoading } = useProject(id);
  const { criteria, loading: criteriaLoading, addCriterion, updateCriterion, deleteCriterion, moveCriterion, getTree } = useCriteria(id);
  const { alternatives, loading: altLoading, addAlternative, updateAlternative, deleteAlternative, moveAlternative } = useAlternatives(id);

  const [selectedCriterion, setSelectedCriterion] = useState(null);
  const [selectedAlternative, setSelectedAlternative] = useState(null);
  const [showCriteriaForm, setShowCriteriaForm] = useState(false);
  const [showAltForm, setShowAltForm] = useState(false);
  const [criteriaFormMode, setCriteriaFormMode] = useState('add'); // add, edit, addChild
  const [altFormMode, setAltFormMode] = useState('add');
  const [showPreview, setShowPreview] = useState(false);
  const [orientation, setOrientation] = useState('vertical');
  const [paperMode, setPaperMode] = useState(false);
  const { confirm, confirmDialogProps } = useConfirm();
  const { importing, result: importResult, importToModel, clearResult: clearImportResult } = useBrainstormingImport(id);

  if (projectLoading || criteriaLoading || altLoading) {
    return <ProjectLayout><LoadingSpinner message="모델 데이터 로딩 중..." /></ProjectLayout>;
  }

  if (!currentProject) {
    return <ProjectLayout><p>프로젝트를 찾을 수 없습니다.</p></ProjectLayout>;
  }

  const criteriaTree = getTree();

  const handleAddCriterion = (parentId) => {
    setCriteriaFormMode(parentId ? 'addChild' : 'add');
    setSelectedCriterion(parentId ? criteria.find(c => c.id === parentId) : null);
    setShowCriteriaForm(true);
  };

  const handleEditCriterion = (criterion) => {
    setCriteriaFormMode('edit');
    setSelectedCriterion(criterion);
    setShowCriteriaForm(true);
  };

  const handleDeleteCriterion = async (id) => {
    if (!(await confirm({ title: '기준 삭제', message: '정말 삭제하시겠습니까? 하위 기준도 모두 삭제됩니다.', variant: 'danger' }))) return;
    await deleteCriterion(id);
    setSelectedCriterion(null);
  };

  const handleCriteriaFormSubmit = async (data) => {
    if (criteriaFormMode === 'edit') {
      await updateCriterion(selectedCriterion.id, data);
    } else {
      const parentId = criteriaFormMode === 'addChild' ? selectedCriterion?.id : null;
      await addCriterion({ ...data, parent_id: parentId });
    }
    setShowCriteriaForm(false);
  };

  const handleAddAlternative = (parentId) => {
    setAltFormMode(parentId ? 'addSub' : 'add');
    setSelectedAlternative(parentId ? alternatives.find(a => a.id === parentId) : null);
    setShowAltForm(true);
  };

  const handleEditAlternative = (alt) => {
    setAltFormMode('edit');
    setSelectedAlternative(alt);
    setShowAltForm(true);
  };

  const handleDeleteAlternative = async (altId) => {
    if (!(await confirm({ title: '대안 삭제', message: '정말 삭제하시겠습니까?', variant: 'danger' }))) return;
    await deleteAlternative(altId);
  };

  const handleBrainstormingImport = async () => {
    try {
      await importToModel(criteria, alternatives, addCriterion, addAlternative);
    } catch (err) {
      console.error('Brainstorming import failed:', err);
    }
  };

  const handleDropNode = async (draggedId, draggedType, targetId, targetType, position) => {
    try {
      if (draggedType === 'criteria') {
        if (targetType === 'goal' || position === 'child') {
          // Re-parent: make child of target (or root if goal)
          const newParentId = targetType === 'goal' ? null : targetId;
          await moveCriterion(draggedId, newParentId, -1);
        } else {
          // Reorder at target's parent level
          const targetCrit = criteria.find(c => c.id === targetId);
          if (!targetCrit) return;
          const parentId = targetCrit.parent_id || null;
          const siblings = criteria
            .filter(c => (c.parent_id || null) === parentId && c.id !== draggedId)
            .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
          const targetIdx = siblings.findIndex(c => c.id === targetId);
          const newIdx = position === 'before' ? targetIdx : targetIdx + 1;
          await moveCriterion(draggedId, parentId, newIdx);
        }
      } else if (draggedType === 'alternative' && targetType === 'alternative') {
        const siblings = alternatives
          .filter(a => !a.parent_id && a.id !== draggedId)
          .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
        const targetIdx = siblings.findIndex(a => a.id === targetId);
        const newIdx = position === 'before' ? targetIdx : targetIdx + 1;
        await moveAlternative(draggedId, newIdx);
      }
    } catch (err) {
      console.error('Move failed:', err);
    }
  };

  const handleRenameCriterion = async (id, newName) => {
    await updateCriterion(id, { name: newName });
  };

  const handleRenameAlternative = async (id, newName) => {
    await updateAlternative(id, { name: newName });
  };

  const handleAltFormSubmit = async (data) => {
    if (altFormMode === 'edit') {
      await updateAlternative(selectedAlternative.id, data);
    } else {
      const parentId = altFormMode === 'addSub' ? selectedAlternative?.id : null;
      await addAlternative({ ...data, parent_id: parentId });
    }
    setShowAltForm(false);
  };

  return (
    <ProjectLayout projectName={currentProject.name}>
      <div className={styles.header}>
        <h1 className={styles.title}>모델 구축</h1>
        <div className={styles.headerActions}>
          <Button size="sm" variant="secondary" onClick={() => setShowPreview(true)}>
            모델 보기
          </Button>
        </div>
      </div>

      <EvalMethodSelect project={currentProject} />

      <div className={styles.canvasToolbar}>
        <Button size="sm" onClick={() => handleAddCriterion(null)}>+ 기준 추가</Button>
        <Button size="sm" variant="secondary" onClick={() => handleAddAlternative(null)}>+ 대안 추가</Button>
        <button
          className={styles.brainstormImportBtn}
          onClick={handleBrainstormingImport}
          disabled={importing}
        >
          {importing ? '가져오는 중...' : '브레인스토밍에서 가져오기'}
        </button>
        <div className={styles.toolbarRight}>
        <button
          className={`${styles.paperBtn} ${paperMode ? styles.paperBtnActive : ''}`}
          onClick={() => setPaperMode(!paperMode)}
          title="논문 캡쳐용 흑백 모드"
        >
          논문용
        </button>
        <div className={styles.orientationToggle}>
          <button
            className={`${styles.toggleBtn} ${orientation === 'vertical' ? styles.toggleActive : ''}`}
            onClick={() => setOrientation('vertical')}
            title="세로형"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <rect x="6" y="1" width="4" height="3" rx="0.5" />
              <rect x="2" y="7" width="4" height="3" rx="0.5" />
              <rect x="10" y="7" width="4" height="3" rx="0.5" />
              <line x1="8" y1="4" x2="8" y2="5.5" stroke="currentColor" strokeWidth="1" />
              <line x1="4" y1="5.5" x2="12" y2="5.5" stroke="currentColor" strokeWidth="1" />
              <line x1="4" y1="5.5" x2="4" y2="7" stroke="currentColor" strokeWidth="1" />
              <line x1="12" y1="5.5" x2="12" y2="7" stroke="currentColor" strokeWidth="1" />
            </svg>
          </button>
          <button
            className={`${styles.toggleBtn} ${orientation === 'horizontal' ? styles.toggleActive : ''}`}
            onClick={() => setOrientation('horizontal')}
            title="가로형"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <rect x="1" y="6" width="3" height="4" rx="0.5" />
              <rect x="7" y="2" width="3" height="4" rx="0.5" />
              <rect x="7" y="10" width="3" height="4" rx="0.5" />
              <line x1="4" y1="8" x2="5.5" y2="8" stroke="currentColor" strokeWidth="1" />
              <line x1="5.5" y1="4" x2="5.5" y2="12" stroke="currentColor" strokeWidth="1" />
              <line x1="5.5" y1="4" x2="7" y2="4" stroke="currentColor" strokeWidth="1" />
              <line x1="5.5" y1="12" x2="7" y2="12" stroke="currentColor" strokeWidth="1" />
            </svg>
          </button>
        </div>
        </div>
      </div>

      {importResult && !importResult.error && (
        <div className={styles.importResultBar}>
          기준 {importResult.importedCriteria}개, 대안 {importResult.importedAlternatives}개 반영 완료
          {importResult.skipped > 0 && ` (중복 ${importResult.skipped}개 스킵)`}
          <button className={styles.dismissBtn} onClick={clearImportResult}>✕</button>
        </div>
      )}
      {importResult?.error && (
        <div className={styles.importErrorBar}>
          가져오기 오류: {importResult.error}
          <button className={styles.dismissBtn} onClick={clearImportResult}>✕</button>
        </div>
      )}

      <div className={styles.canvasContainer}>
        <HierarchyCanvas
          projectName={currentProject.name}
          criteriaTree={criteriaTree}
          alternatives={alternatives}
          orientation={orientation}
          paperMode={paperMode}
          onAddCriterion={handleAddCriterion}
          onEditCriterion={handleEditCriterion}
          onDeleteCriterion={handleDeleteCriterion}
          onAddAlternative={handleAddAlternative}
          onEditAlternative={handleEditAlternative}
          onDeleteAlternative={handleDeleteAlternative}
          onDropNode={handleDropNode}
          onRenameCriterion={handleRenameCriterion}
          onRenameAlternative={handleRenameAlternative}
        />
      </div>

      {showCriteriaForm && (
        <CriteriaForm
          mode={criteriaFormMode}
          criterion={criteriaFormMode === 'edit' ? selectedCriterion : null}
          parentName={criteriaFormMode === 'addChild' ? selectedCriterion?.name : null}
          onSubmit={handleCriteriaFormSubmit}
          onClose={() => setShowCriteriaForm(false)}
        />
      )}

      {showAltForm && (
        <AlternativeForm
          mode={altFormMode}
          alternative={altFormMode === 'edit' ? selectedAlternative : null}
          parentName={altFormMode === 'addSub' ? selectedAlternative?.name : null}
          onSubmit={handleAltFormSubmit}
          onClose={() => setShowAltForm(false)}
        />
      )}

      {showPreview && (
        <ModelPreview
          projectName={currentProject.name}
          criteriaTree={criteriaTree}
          alternatives={alternatives}
          onClose={() => setShowPreview(false)}
        />
      )}

      <ConfirmDialog {...confirmDialogProps} />
    </ProjectLayout>
  );
}
