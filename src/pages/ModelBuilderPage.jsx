import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useProject } from '../hooks/useProjects';
import { useCriteria } from '../hooks/useCriteria';
import { useAlternatives } from '../hooks/useAlternatives';
import { useConfirm } from '../hooks/useConfirm';
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
  const { criteria, loading: criteriaLoading, addCriterion, updateCriterion, deleteCriterion, getTree } = useCriteria(id);
  const { alternatives, loading: altLoading, addAlternative, updateAlternative, deleteAlternative } = useAlternatives(id);

  const [selectedCriterion, setSelectedCriterion] = useState(null);
  const [selectedAlternative, setSelectedAlternative] = useState(null);
  const [showCriteriaForm, setShowCriteriaForm] = useState(false);
  const [showAltForm, setShowAltForm] = useState(false);
  const [criteriaFormMode, setCriteriaFormMode] = useState('add'); // add, edit, addChild
  const [altFormMode, setAltFormMode] = useState('add');
  const [showPreview, setShowPreview] = useState(false);
  const { confirm, confirmDialogProps } = useConfirm();

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
      </div>

      <div className={styles.canvasContainer}>
        <HierarchyCanvas
          projectName={currentProject.name}
          criteriaTree={criteriaTree}
          alternatives={alternatives}
          onAddCriterion={handleAddCriterion}
          onEditCriterion={handleEditCriterion}
          onDeleteCriterion={handleDeleteCriterion}
          onAddAlternative={handleAddAlternative}
          onEditAlternative={handleEditAlternative}
          onDeleteAlternative={handleDeleteAlternative}
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
