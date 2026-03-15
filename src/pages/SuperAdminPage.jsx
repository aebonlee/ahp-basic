import { useState } from 'react';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import ConfirmDialog from '../components/common/ConfirmDialog';
import { useConfirm } from '../hooks/useConfirm';
import { useToast } from '../contexts/ToastContext';
import { useSuperAdminUsers, useSuperAdminProjects, useSuperAdminSmsStats, useSuperAdminVisitorStats } from '../hooks/useSuperAdmin';
import { useSuperAdminWithdrawals } from '../hooks/useSuperAdminWithdrawals';
import { WITHDRAWAL_STATUS_LABELS } from '../lib/constants';
import { formatPoints } from '../utils/formatters';
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

const PAGE_SIZE = 10;

function Pagination({ currentPage, totalPages, onPageChange }) {
  if (totalPages <= 1) return null;
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);
  return (
    <div className={styles.pagination}>
      <button
        className={styles.pageBtn}
        disabled={currentPage === 1}
        onClick={() => onPageChange(currentPage - 1)}
      >
        &laquo;
      </button>
      {pages.map(p => (
        <button
          key={p}
          className={`${styles.pageBtn} ${p === currentPage ? styles.pageBtnActive : ''}`}
          onClick={() => onPageChange(p)}
        >
          {p}
        </button>
      ))}
      <button
        className={styles.pageBtn}
        disabled={currentPage === totalPages}
        onClick={() => onPageChange(currentPage + 1)}
      >
        &raquo;
      </button>
    </div>
  );
}

function UsersTab({ toast }) {
  const { users, loading, updateRole } = useSuperAdminUsers();
  const [domainFilter, setDomainFilter] = useState('ahp-basic.dreamitbiz.com');
  const [currentPage, setCurrentPage] = useState(1);

  const filteredUsers = users.filter(u => {
    if (domainFilter === 'all') return true;
    if (domainFilter === 'other') return u.signup_domain && u.signup_domain !== 'ahp-basic.dreamitbiz.com';
    return u.signup_domain === domainFilter;
  });

  const totalPages = Math.ceil(filteredUsers.length / PAGE_SIZE);
  const safePage = Math.min(currentPage, totalPages || 1);
  const pagedUsers = filteredUsers.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const handleFilterChange = (value) => {
    setDomainFilter(value);
    setCurrentPage(1);
  };

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
            onClick={() => handleFilterChange(f.value)}
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
            {pagedUsers.map(u => (
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
                    <option value="evaluator">evaluator</option>
                    <option value="admin">admin</option>
                  </select>
                </td>
                <td>{formatDate(u.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pagination currentPage={safePage} totalPages={totalPages} onPageChange={setCurrentPage} />
    </>
  );
}

function ProjectsTab({ toast, confirm }) {
  const { projects, loading, deleteProject } = useSuperAdminProjects();
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.ceil(projects.length / PAGE_SIZE);
  const safePage = Math.min(currentPage, totalPages || 1);
  const pagedProjects = projects.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

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
            {pagedProjects.map(p => (
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
      <Pagination currentPage={safePage} totalPages={totalPages} onPageChange={setCurrentPage} />
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

function DashboardTab() {
  const { users, loading: usersLoading } = useSuperAdminUsers();
  const { projects, loading: projectsLoading } = useSuperAdminProjects();
  const { stats: smsStats, loading: smsLoading } = useSuperAdminSmsStats();
  const { stats: visitorStats, loading: visitorLoading } = useSuperAdminVisitorStats(7);

  const loading = usersLoading || projectsLoading || smsLoading || visitorLoading;
  if (loading) return <div className={styles.loading}>대시보드 로딩 중...</div>;

  const totalSms = (smsStats || []).reduce((s, r) => s + r.total_count, 0);
  const totalSmsSuccess = (smsStats || []).reduce((s, r) => s + r.success_count, 0);
  const totalSmsFail = (smsStats || []).reduce((s, r) => s + r.fail_count, 0);
  const daily7 = (visitorStats?.daily || []).slice(-7);

  return (
    <>
      <div className={styles.dashboardCards}>
        <div className={styles.dashboardCard}>
          <span className={styles.visitorCardValue}>{users.length}</span>
          <span className={styles.visitorCardLabel}>전체 회원</span>
        </div>
        <div className={styles.dashboardCard}>
          <span className={styles.visitorCardValue}>{users.filter(u => u.role === 'admin').length}</span>
          <span className={styles.visitorCardLabel}>관리자</span>
        </div>
        <div className={styles.dashboardCard}>
          <span className={styles.visitorCardValue}>{projects.length}</span>
          <span className={styles.visitorCardLabel}>전체 프로젝트</span>
        </div>
        <div className={styles.dashboardCard}>
          <span className={styles.visitorCardValue}>{totalSms}</span>
          <span className={styles.visitorCardLabel}>SMS 총 발송</span>
        </div>
        <div className={styles.dashboardCard}>
          <span className={`${styles.visitorCardValue} ${styles.successText}`}>{totalSmsSuccess}</span>
          <span className={styles.visitorCardLabel}>SMS 성공</span>
        </div>
        <div className={styles.dashboardCard}>
          <span className={`${styles.visitorCardValue} ${styles.failText}`}>{totalSmsFail}</span>
          <span className={styles.visitorCardLabel}>SMS 실패</span>
        </div>
        <div className={styles.dashboardCard}>
          <span className={styles.visitorCardValue}>{visitorStats?.today_views ?? '-'}</span>
          <span className={styles.visitorCardLabel}>오늘 방문</span>
        </div>
        <div className={styles.dashboardCard}>
          <span className={styles.visitorCardValue}>{visitorStats?.today_unique ?? '-'}</span>
          <span className={styles.visitorCardLabel}>오늘 유니크</span>
        </div>
        <div className={styles.dashboardCard}>
          <span className={styles.visitorCardValue}>{visitorStats?.total_views ?? '-'}</span>
          <span className={styles.visitorCardLabel}>총 방문</span>
        </div>
      </div>

      {daily7.length > 0 && (
        <div className={styles.dashboardChart}>
          <h3 className={styles.visitorSubTitle}>최근 7일 방문</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={daily7}>
              <XAxis dataKey="date" tickFormatter={(v) => v?.slice(5)} fontSize={12} />
              <YAxis fontSize={12} allowDecimals={false} />
              <Tooltip
                labelFormatter={(v) => v}
                formatter={(value, name) => [value, name === 'views' ? '조회수' : '유니크']}
              />
              <Bar dataKey="views" fill="var(--color-primary, #3b82f6)" name="views" radius={[4, 4, 0, 0]} />
              <Bar dataKey="unique_visitors" fill="var(--color-success, #16a34a)" name="unique" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </>
  );
}

function VisitorsTab() {
  const { stats, loading, error, refresh } = useSuperAdminVisitorStats(30);

  if (loading) return <div className={styles.loading}>방문자 통계 로딩 중...</div>;
  if (error) return <div className={styles.empty}>통계 조회 실패: {error}</div>;
  if (!stats) return null;

  const daily7 = (stats.daily || []).slice(-7);

  return (
    <>
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
            <XAxis dataKey="date" tickFormatter={(v) => v?.slice(5)} fontSize={12} />
            <YAxis fontSize={12} allowDecimals={false} />
            <Tooltip
              labelFormatter={(v) => v}
              formatter={(value, name) => [value, name === 'views' ? '조회수' : '유니크']}
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
    </>
  );
}

function WithdrawalsTab({ toast }) {
  const { withdrawals, loading, processWithdrawal } = useSuperAdminWithdrawals();
  const [currentPage, setCurrentPage] = useState(1);
  const [processingId, setProcessingId] = useState(null);

  const totalPages = Math.ceil(withdrawals.length / PAGE_SIZE);
  const safePage = Math.min(currentPage, totalPages || 1);
  const pagedWithdrawals = withdrawals.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const pendingCount = withdrawals.filter(w => w.status === 'pending').length;
  const totalAmount = withdrawals.filter(w => w.status === 'approved').reduce((s, w) => s + w.amount, 0);

  const handleProcess = async (id, action) => {
    setProcessingId(id);
    try {
      const note = action === 'reject' ? prompt('거절 사유를 입력하세요:') : null;
      if (action === 'reject' && note === null) { setProcessingId(null); return; }
      await processWithdrawal(id, action, note);
      toast.success(action === 'approve' ? '승인 완료' : '거절 완료');
    } catch (err) {
      toast.error('처리 실패: ' + err.message);
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) return <div className={styles.loading}>출금 목록 로딩 중...</div>;
  if (!withdrawals.length) return <div className={styles.empty}>출금 요청이 없습니다.</div>;

  return (
    <>
      <div className={styles.stats}>
        <div className={styles.stat}>
          <strong>{withdrawals.length}</strong>전체 요청
        </div>
        <div className={styles.stat}>
          <strong className={styles.failText}>{pendingCount}</strong>대기 중
        </div>
        <div className={styles.stat}>
          <strong className={styles.successText}>{formatPoints(totalAmount)}</strong>승인 총액
        </div>
      </div>
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>요청자</th>
              <th>금액</th>
              <th>은행</th>
              <th>계좌</th>
              <th>예금주</th>
              <th>상태</th>
              <th>요청일</th>
              <th>관리</th>
            </tr>
          </thead>
          <tbody>
            {pagedWithdrawals.map(w => (
              <tr key={w.id}>
                <td>{w.user_email}<br/><small>{w.user_name || ''}</small></td>
                <td><strong>{formatPoints(w.amount)}</strong></td>
                <td>{w.bank_name}</td>
                <td>{w.account_number}</td>
                <td>{w.account_holder}</td>
                <td>
                  <span
                    className={styles.statusBadge}
                    style={{
                      background: w.status === 'pending' ? '#fef3c7' : w.status === 'approved' ? '#ecfdf5' : '#fef2f2',
                      color: w.status === 'pending' ? '#92400e' : w.status === 'approved' ? '#065f46' : '#991b1b',
                    }}
                  >
                    {WITHDRAWAL_STATUS_LABELS[w.status] || w.status}
                  </span>
                </td>
                <td>{formatDate(w.created_at)}</td>
                <td>
                  {w.status === 'pending' ? (
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <button
                        className={styles.filterBtn}
                        style={{ background: '#ecfdf5', color: '#065f46', borderColor: '#86efac' }}
                        disabled={processingId === w.id}
                        onClick={() => handleProcess(w.id, 'approve')}
                      >
                        승인
                      </button>
                      <button
                        className={styles.deleteBtn}
                        disabled={processingId === w.id}
                        onClick={() => handleProcess(w.id, 'reject')}
                      >
                        거절
                      </button>
                    </div>
                  ) : (
                    w.admin_note ? <small>{w.admin_note}</small> : '-'
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pagination currentPage={safePage} totalPages={totalPages} onPageChange={setCurrentPage} />
    </>
  );
}

export default function SuperAdminPage() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const toast = useToast();
  const { confirm, confirmDialogProps } = useConfirm();

  const tabs = [
    { key: 'dashboard', label: '대시보드' },
    { key: 'users', label: '회원 관리' },
    { key: 'projects', label: '프로젝트 관리' },
    { key: 'withdrawals', label: '출금 관리' },
    { key: 'sms', label: 'SMS 관리' },
    { key: 'visitors', label: '방문자 통계' },
  ];

  return (
    <div className={styles.pageWrap}>
      <Navbar />
      <div className={styles.page}>
        <h1 className={styles.title}>Super Admin</h1>

        <div className={styles.tabs}>
          {tabs.map(t => (
            <button
              key={t.key}
              className={`${styles.tab} ${activeTab === t.key ? styles.tabActive : ''}`}
              onClick={() => setActiveTab(t.key)}
            >
              {t.label}
            </button>
          ))}
        </div>

        {activeTab === 'dashboard' && <DashboardTab />}
        {activeTab === 'users' && <UsersTab toast={toast} />}
        {activeTab === 'projects' && <ProjectsTab toast={toast} confirm={confirm} />}
        {activeTab === 'withdrawals' && <WithdrawalsTab toast={toast} />}
        {activeTab === 'sms' && <SmsTab />}
        {activeTab === 'visitors' && <VisitorsTab />}
      </div>
      <Footer />
      <ConfirmDialog {...confirmDialogProps} />
    </div>
  );
}
