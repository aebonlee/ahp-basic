import { useState } from 'react';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import ConfirmDialog from '../components/common/ConfirmDialog';
import { useConfirm } from '../hooks/useConfirm';
import { useToast } from '../contexts/ToastContext';
import { useSuperAdminUsers, useSuperAdminProjects } from '../hooks/useSuperAdmin';
import { PROJECT_STATUS_LABELS, PROJECT_STATUS_COLORS } from '../lib/constants';
import styles from './SuperAdminPage.module.css';

function formatDate(dateStr) {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  return d.toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' });
}

function UsersTab({ toast }) {
  const { users, loading, updateRole } = useSuperAdminUsers();

  const handleRoleChange = async (userId, newRole) => {
    try {
      await updateRole(userId, newRole);
    } catch (err) {
      toast.error('역할 변경 실패: ' + err.message);
    }
  };

  if (loading) return <div className={styles.loading}>사용자 목록 로딩 중...</div>;
  if (!users.length) return <div className={styles.empty}>등록된 사용자가 없습니다.</div>;

  return (
    <>
      <div className={styles.stats}>
        <div className={styles.stat}>
          <strong>{users.length}</strong>전체 회원
        </div>
        <div className={styles.stat}>
          <strong>{users.filter(u => u.role === 'admin').length}</strong>관리자
        </div>
      </div>
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>이메일</th>
              <th>이름</th>
              <th>역할</th>
              <th>가입일</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id}>
                <td>{u.email}</td>
                <td>{u.display_name || '-'}</td>
                <td>
                  <select
                    className={styles.roleSelect}
                    value={u.role}
                    onChange={e => handleRoleChange(u.id, e.target.value)}
                  >
                    <option value="user">user</option>
                    <option value="admin">admin</option>
                  </select>
                </td>
                <td>{formatDate(u.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

function ProjectsTab({ toast, confirm }) {
  const { projects, loading, deleteProject } = useSuperAdminProjects();

  const handleDelete = async (project) => {
    const ok = await confirm({
      title: '프로젝트 삭제',
      message: `"${project.name}" 프로젝트를 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.`,
      variant: 'danger',
      confirmLabel: '삭제',
    });
    if (!ok) return;
    try {
      await deleteProject(project.id);
    } catch (err) {
      toast.error('삭제 실패: ' + err.message);
    }
  };

  if (loading) return <div className={styles.loading}>프로젝트 목록 로딩 중...</div>;
  if (!projects.length) return <div className={styles.empty}>등록된 프로젝트가 없습니다.</div>;

  return (
    <>
      <div className={styles.stats}>
        <div className={styles.stat}>
          <strong>{projects.length}</strong>전체 프로젝트
        </div>
      </div>
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>프로젝트명</th>
              <th>소유자</th>
              <th>상태</th>
              <th>생성일</th>
              <th>관리</th>
            </tr>
          </thead>
          <tbody>
            {projects.map(p => (
              <tr key={p.id}>
                <td>{p.name}</td>
                <td>{p.owner_email || '-'}</td>
                <td>
                  <span
                    className={styles.statusBadge}
                    style={{
                      background: `${PROJECT_STATUS_COLORS[p.status] || 'var(--color-text-muted)'}22`,
                      color: PROJECT_STATUS_COLORS[p.status] || 'var(--color-text-muted)',
                    }}
                  >
                    {PROJECT_STATUS_LABELS[p.status] || p.status}
                  </span>
                </td>
                <td>{formatDate(p.created_at)}</td>
                <td>
                  <button className={styles.deleteBtn} onClick={() => handleDelete(p)}>
                    삭제
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

export default function SuperAdminPage() {
  const [activeTab, setActiveTab] = useState('users');
  const toast = useToast();
  const { confirm, confirmDialogProps } = useConfirm();

  return (
    <div>
      <Navbar />
      <div className={styles.page}>
        <h1 className={styles.title}>Super Admin</h1>

        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${activeTab === 'users' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('users')}
          >
            회원 관리
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'projects' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('projects')}
          >
            프로젝트 관리
          </button>
        </div>

        {activeTab === 'users' && <UsersTab toast={toast} />}
        {activeTab === 'projects' && <ProjectsTab toast={toast} confirm={confirm} />}
      </div>
      <Footer />
      <ConfirmDialog {...confirmDialogProps} />
    </div>
  );
}
