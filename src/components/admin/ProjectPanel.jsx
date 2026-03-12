import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProjects } from '../../contexts/ProjectContext';
import { useToast } from '../../contexts/ToastContext';
import { useConfirm } from '../../hooks/useConfirm';
import { useSubscription } from '../../hooks/useSubscription';
import ProjectForm from './ProjectForm';
import ProjectCard from './ProjectCard';
import Button from '../common/Button';
import ConfirmDialog from '../common/ConfirmDialog';
import LoadingSpinner from '../common/LoadingSpinner';
import HelpButton from '../common/HelpButton';
import UpgradeModal from '../common/UpgradeModal';
import styles from './ProjectPanel.module.css';

export default function ProjectPanel({ projects, loading, selectedProjectId, onSelect }) {
  const navigate = useNavigate();
  const { deleteProject, cloneProject } = useProjects();
  const toast = useToast();
  const { confirm, confirmDialogProps } = useConfirm();
  const { canCreateProject, maxProjects, isSuperAdmin } = useSubscription();
  const [showForm, setShowForm] = useState(false);
  const [editProject, setEditProject] = useState(null);
  const [filter, setFilter] = useState('all');
  const [upgradeOpen, setUpgradeOpen] = useState(false);

  const filteredProjects = filter === 'all'
    ? projects
    : projects.filter(p => p.status === Number(filter));

  const handleEdit = (project) => {
    setEditProject(project);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!(await confirm({ title: '프로젝트 삭제', message: '정말 삭제하시겠습니까?', variant: 'danger' }))) return;
    try {
      await deleteProject(id);
      if (selectedProjectId === id) onSelect(null);
    } catch (err) {
      toast.error('삭제 실패: ' + err.message);
    }
  };

  const handleManage = (id) => {
    navigate(`/admin/project/${id}`);
  };

  const handleClone = async (id) => {
    try {
      const newProj = await cloneProject(id);
      toast.success(`"${newProj.name}" 복제 완료`);
      onSelect(newProj.id);
    } catch (err) {
      toast.error('복제 실패: ' + err.message);
    }
  };

  const handleNewProject = () => {
    if (!canCreateProject(projects.length)) {
      setUpgradeOpen(true);
      return;
    }
    setEditProject(null);
    setShowForm(true);
  };

  const limitDisplay = maxProjects === Infinity ? '' : ` (${projects.length}/${maxProjects})`;

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <h2 className={styles.title}>프로젝트{limitDisplay}</h2>
        <span className={styles.headerActions}>
          <Button size="sm" onClick={handleNewProject}>
            + 시작하기
          </Button>
          <HelpButton helpKey="projectStart" />
        </span>
      </div>

      <div className={styles.filters}>
        {[
          { value: 'all', label: '전체' },
          { value: '2', label: '생성중' },
          { value: '6', label: '대기중' },
          { value: '1', label: '평가중' },
          { value: '4', label: '완료' },
        ].map(f => (
          <button
            key={f.value}
            className={`${styles.filterBtn} ${filter === f.value ? styles.active : ''}`}
            onClick={() => setFilter(f.value)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {showForm && (
        <ProjectForm
          project={editProject}
          onClose={() => { setShowForm(false); setEditProject(null); }}
        />
      )}

      <div className={styles.list}>
        {loading ? (
          <LoadingSpinner size={24} />
        ) : filteredProjects.length === 0 ? (
          <p className={styles.empty}>프로젝트가 없습니다.</p>
        ) : (
          filteredProjects.map(project => (
            <ProjectCard
              key={project.id}
              project={project}
              selected={project.id === selectedProjectId}
              onSelect={() => onSelect(project.id)}
              onEdit={() => handleEdit(project)}
              onDelete={() => handleDelete(project.id)}
              onClone={() => handleClone(project.id)}
              onManage={() => handleManage(project.id)}
            />
          ))
        )}
      </div>

      <ConfirmDialog {...confirmDialogProps} />
      <UpgradeModal
        isOpen={upgradeOpen}
        onClose={() => setUpgradeOpen(false)}
        feature="project_limit"
      />
    </div>
  );
}
