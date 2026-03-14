import { useState } from 'react';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import ConfirmDialog from '../components/common/ConfirmDialog';
import { useConfirm } from '../hooks/useConfirm';
import { useToast } from '../contexts/ToastContext';
import { useSuperAdminUsers, useSuperAdminProjects, useSuperAdminSmsStats, useSuperAdminVisitorStats } from '../hooks/useSuperAdmin';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { PROJECT_STATUS_LABELS, PROJECT_STATUS_COLORS } from '../lib/constants';
import styles from './SuperAdminPage.module.css';

function formatDate(dateStr) {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  return d.toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' });
}

const DOMAIN_FILTERS = [
  { value: 'all', label: '전체' },
  { value: 'ahp-basic.dreamitbiz.com', label: 'AHP Basic' },
  { value: 'other', label: '기타 사이트' },
];

function UsersTab({ toast }) {
  const { users, loading, updateRole } = useSuperAdminUsers();
  const [domainFilter, setDomainFilter] = useState('ahp-basic.dreamitbiz.com');

  const filteredUsers = users.filter(u => {
    if (domainFilter === 'all') return true;
    if (domainFilter === 'other') return u.signup_domain && u.signup_domain !== 'ahp-basic.dreamitbiz.com';
    return u.signup_domain === domainFilter;
  });

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
          <strong>{filteredUsers.length}</strong>
          {domainFilter === 'all' ? '전체 회원' : '필터 회원'}
          {domainFilter !== 'all' && (
            <span className={styles.statSub}> / {users.length}명 중</span>
          )}
        </div>
        <div className={styles.stat}>
          <strong>{filteredUsers.filter(u => u.role === 'admin').length}</strong>관리자
        </div>
      </div>
      <div className={styles.filterBar}>
        {DOMAIN_FILTERS.map(f => (
          <button
            key={f.value}
            className={`${styles.filterBtn} ${domainFilter === f.value ? styles.filterBtnActive : ''}`}
            onClick={() => setDomainFilter(f.value)}
          >
            {f.label}
          </button>
        ))}
      </div>
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>이메일</th>
              <th>이름</th>
              <th>가입 사이트</th>
              <th>역할</th>
              <th>가입일</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map(u => (
              <tr key={u.id}>
                <td>{u.email}</td>
                <td>{u.display_name || '-'}</td>
                <td>
                  <span className={styles.domainBadge} data-site={u.signup_domain === 'ahp-basic.dreamitbiz.com' ? 'ahp' : 'other'}>
                    {u.signup_domain || '-'}
                  </span>
                </td>
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

function SmsTab() {
  const { stats, loading } = useSuperAdminSmsStats();

  if (loading) return <div className={styles.loading}>SMS 통계 로딩 중...</div>;
  if (!stats.length) return <div className={styles.empty}>SMS 발송 이력이 없습니다.</div>;

  const totalCount = stats.reduce((s, r) => s + r.total_count, 0);
  const totalSuccess = stats.reduce((s, r) => s + r.success_count, 0);
  const totalFail = stats.reduce((s, r) => s + r.fail_count, 0);

  return (
    <>
      <div className={styles.stats}>
        <div className={styles.stat}>
          <strong>{totalCount}</strong>총 발송
        </div>
        <div className={styles.stat}>
          <strong className={styles.successText}>{totalSuccess}</strong>성공
        </div>
        <div className={styles.stat}>
          <strong className={styles.failText}>{totalFail}</strong>실패
        </div>
      </div>
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>이메일</th>
              <th>이름</th>
              <th>발송 건수</th>
              <th>성공</th>
              <th>실패</th>
              <th>마지막 발송일</th>
            </tr>
          </thead>
          <tbody>
            {stats.map(r => (
              <tr key={r.sender_id}>
                <td>{r.sender_email}</td>
                <td>{r.sender_name || '-'}</td>
                <td>{r.total_count}</td>
                <td><span className={styles.successText}>{r.success_count}</span></td>
                <td><span className={styles.failText}>{r.fail_count}</span></td>
                <td>{formatDate(r.last_sent_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

function VisitorStats() {
  const { stats, loading, error, refresh } = useSuperAdminVisitorStats(30);

  if (loading) return <div className={styles.loading}>방문자 통계 로딩 중...</div>;
  if (error) return <div className={styles.empty}>통계 조회 실패: {error}</div>;
  if (!stats) return null;

  const daily7 = (stats.daily || []).slice(-7);

  return (
    <section className={styles.visitorSection}>
      <div className={styles.visitorHeader}>
        <h2 className={styles.visitorTitle}>방문자 통계</h2>
        <button className={styles.refreshBtn} onClick={refresh}>새로고침</button>
      </div>

      <div className={styles.visitorCards}>
        <div className={styles.visitorCard}>
          <span className={styles.visitorCardValue}>{stats.today_views}</span>
          <span className={styles.visitorCardLabel}>오늘 방문</span>
        </div>
        <div className={styles.visitorCard}>
          <span className={styles.visitorCardValue}>{stats.today_unique}</span>
          <span className={styles.visitorCardLabel}>오늘 유니크</span>
        </div>
        <div className={styles.visitorCard}>
          <span className={styles.visitorCardValue}>{stats.total_views}</span>
          <span className={styles.visitorCardLabel}>총 방문</span>
        </div>
        <div className={styles.visitorCard}>
          <span className={styles.visitorCardValue}>{stats.total_unique}</span>
          <span className={styles.visitorCardLabel}>총 유니크</span>
        </div>
      </div>

      <div className={styles.visitorChart}>
        <h3 className={styles.visitorSubTitle}>최근 7일 일별 방문</h3>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={daily7}>
            <XAxis
              dataKey="date"
              tickFormatter={(v) => v?.slice(5)}
              fontSize={12}
            />
            <YAxis fontSize={12} allowDecimals={false} />
            <Tooltip
              labelFormatter={(v) => v}
              formatter={(value, name) =>
                [value, name === 'views' ? '조회수' : '유니크']
              }
            />
            <Bar dataKey="views" fill="var(--color-primary, #3b82f6)" name="views" radius={[4, 4, 0, 0]} />
            <Bar dataKey="unique_visitors" fill="var(--color-success, #16a34a)" name="unique" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {stats.by_page?.length > 0 && (
        <div className={styles.tableWrap}>
          <h3 className={styles.visitorSubTitle} style={{ padding: '12px 14px 0' }}>페이지별 방문 수</h3>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>페이지</th>
                <th>조회수</th>
                <th>유니크</th>
              </tr>
            </thead>
            <tbody>
              {stats.by_page.slice(0, 10).map((p) => (
                <tr key={p.path}>
                  <td>{p.path}</td>
                  <td>{p.views}</td>
                  <td>{p.unique_visitors}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
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
          <button
            className={`${styles.tab} ${activeTab === 'sms' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('sms')}
          >
            SMS 관리
          </button>
        </div>

        {activeTab === 'users' && <UsersTab toast={toast} />}
        {activeTab === 'projects' && <ProjectsTab toast={toast} confirm={confirm} />}
        {activeTab === 'sms' && <SmsTab />}

        <VisitorStats />
      </div>
      <Footer />
      <ConfirmDialog {...confirmDialogProps} />
    </div>
  );
}
