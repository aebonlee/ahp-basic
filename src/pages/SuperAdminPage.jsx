import { useState, useEffect } from 'react';
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
import { supabase } from '../lib/supabaseClient';
import { sendSms } from '../lib/smsService';
import { getByteInfo } from '../lib/smsUtils';
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

const LECTURE_TYPE_LABELS = { free: '무료강의', consulting: '1:1 맞춤강의' };

const LECTURE_SMS_TEMPLATES = [
  {
    name: '일정 확정 안내',
    content: `[AHP Basic] {이름}님, 온라인 강의 일정이 확정되었습니다.\n\n- 강의: {강의유형}\n- 일시: (여기에 확정 일시 입력)\n- Zoom 링크: (여기에 링크 입력)\n\n감사합니다.`,
  },
  {
    name: '강의 리마인드',
    content: `[AHP Basic] {이름}님, 내일 예정된 온라인 강의를 안내드립니다.\n\n- 강의: {강의유형}\n- Zoom 링크: (여기에 링크 입력)\n\n시간에 맞춰 참여 부탁드립니다.`,
  },
  {
    name: '자유 입력',
    content: '',
  },
];

function LecturesTab({ toast }) {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [typeFilter, setTypeFilter] = useState('all');
  const [selected, setSelected] = useState(new Set());
  const [smsOpen, setSmsOpen] = useState(false);
  const [smsMessage, setSmsMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sendProgress, setSendProgress] = useState({ current: 0, total: 0 });
  const [sendResults, setSendResults] = useState(null);

  useEffect(() => {
    supabase
      .from('lecture_applications')
      .select('*')
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setApplications(data || []);
        setLoading(false);
      }, () => setLoading(false));
  }, []);

  if (loading) return <div className={styles.loading}>강의 신청 목록 로딩 중...</div>;
  if (!applications.length) return <div className={styles.empty}>강의 신청 내역이 없습니다.</div>;

  const filtered = applications.filter(a => {
    if (typeFilter === 'all') return true;
    return a.lecture_type === typeFilter;
  });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const safePage = Math.min(currentPage, totalPages || 1);
  const paged = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const freeCount = applications.filter(a => a.lecture_type === 'free').length;
  const consultingCount = applications.filter(a => a.lecture_type === 'consulting').length;

  const handleFilterChange = (value) => {
    setTypeFilter(value);
    setCurrentPage(1);
  };

  const handleToggle = (id) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleToggleAll = () => {
    const selectableIds = filtered.filter(a => a.phone).map(a => a.id);
    const allChecked = selectableIds.length > 0 && selectableIds.every(id => selected.has(id));
    setSelected(prev => {
      const next = new Set(prev);
      if (allChecked) {
        selectableIds.forEach(id => next.delete(id));
      } else {
        selectableIds.forEach(id => next.add(id));
      }
      return next;
    });
  };

  const selectableCount = filtered.filter(a => a.phone).length;
  const allChecked = selectableCount > 0 && filtered.filter(a => a.phone).every(a => selected.has(a.id));
  const selectedApps = applications.filter(a => selected.has(a.id) && a.phone);

  const handleOpenSms = () => {
    setSmsOpen(true);
    setSmsMessage(LECTURE_SMS_TEMPLATES[0].content);
    setSendResults(null);
  };

  const handleCloseSms = () => {
    if (sending) return;
    setSmsOpen(false);
    setSmsMessage('');
    setSendResults(null);
  };

  const handleApplyTemplate = (content) => {
    if (smsMessage.trim() && !window.confirm('기존 메시지를 덮어쓰시겠습니까?')) return;
    setSmsMessage(content);
  };

  const handleSendSms = async () => {
    if (selectedApps.length === 0 || !smsMessage.trim()) return;
    const byteInfo = getByteInfo(smsMessage);
    if (byteInfo.type === 'OVER') {
      toast.warning('메시지가 2000바이트를 초과합니다.');
      return;
    }

    setSending(true);
    setSendProgress({ current: 0, total: selectedApps.length });
    const results = [];

    for (let i = 0; i < selectedApps.length; i++) {
      const app = selectedApps[i];
      const personalMsg = smsMessage
        .replace(/\{이름\}/g, app.name || '')
        .replace(/\{강의유형\}/g, LECTURE_TYPE_LABELS[app.lecture_type] || app.lecture_type || '');

      try {
        await sendSms({ receiver: app.phone, message: personalMsg });
        results.push({ name: app.name, phone: app.phone, success: true });
      } catch (err) {
        results.push({ name: app.name, phone: app.phone, success: false, error: err.message });
      }
      setSendProgress({ current: i + 1, total: selectedApps.length });
    }

    setSendResults(results);
    setSending(false);
  };

  const byteInfo = getByteInfo(smsMessage);

  return (
    <>
      <div className={styles.stats}>
        <div className={styles.stat}>
          <strong>{applications.length}</strong>전체 신청
        </div>
        <div className={styles.stat}>
          <strong>{freeCount}</strong>무료강의
        </div>
        <div className={styles.stat}>
          <strong>{consultingCount}</strong>1:1 맞춤
        </div>
      </div>
      <div className={styles.filterBar}>
        {[{ value: 'all', label: '전체' }, { value: 'free', label: '무료강의' }, { value: 'consulting', label: '1:1 맞춤' }].map(f => (
          <button
            key={f.value}
            className={`${styles.filterBtn} ${typeFilter === f.value ? styles.filterBtnActive : ''}`}
            onClick={() => handleFilterChange(f.value)}
          >
            {f.label}
          </button>
        ))}
        <button
          className={styles.smsBtn}
          disabled={selected.size === 0}
          onClick={handleOpenSms}
        >
          문자 보내기 ({selected.size}명)
        </button>
      </div>

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th style={{ width: 40, textAlign: 'center' }}>
                <input
                  type="checkbox"
                  checked={allChecked}
                  onChange={handleToggleAll}
                />
              </th>
              <th>이름</th>
              <th>이메일</th>
              <th>전화번호</th>
              <th>강의 유형</th>
              <th>희망일</th>
              <th>문의사항</th>
              <th>신청일</th>
            </tr>
          </thead>
          <tbody>
            {paged.map(a => {
              const hasPhone = !!a.phone;
              return (
                <tr key={a.id} style={selected.has(a.id) ? { background: 'var(--color-primary-surface, rgba(0,70,200,0.04))' } : undefined}>
                  <td style={{ textAlign: 'center' }}>
                    <input
                      type="checkbox"
                      checked={selected.has(a.id)}
                      onChange={() => handleToggle(a.id)}
                      disabled={!hasPhone}
                    />
                  </td>
                  <td>{a.name}</td>
                  <td>{a.email}</td>
                  <td>{hasPhone ? a.phone : <span style={{ color: '#9ca3af' }}>(없음)</span>}</td>
                  <td>
                    <span
                      className={styles.statusBadge}
                      style={{
                        background: a.lecture_type === 'consulting' ? '#ede9fe' : '#ecfdf5',
                        color: a.lecture_type === 'consulting' ? '#5b21b6' : '#065f46',
                      }}
                    >
                      {LECTURE_TYPE_LABELS[a.lecture_type] || a.lecture_type || '-'}
                    </span>
                  </td>
                  <td>{a.preferred_date || (a.preferred_dates?.join(', ')) || '-'}</td>
                  <td>{a.message || '-'}</td>
                  <td>{formatDate(a.created_at)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <Pagination currentPage={safePage} totalPages={totalPages} onPageChange={setCurrentPage} />

      {/* SMS 패널 */}
      {smsOpen && (
        <div className={styles.smsPanel}>
          <div className={styles.smsPanelHeader}>
            <h3 className={styles.smsPanelTitle}>문자 발송 ({selectedApps.length}명)</h3>
            <button className={styles.smsPanelClose} onClick={handleCloseSms}>&times;</button>
          </div>

          {sendResults ? (
            <div className={styles.smsResults}>
              <div className={styles.smsResultsSummary}>
                <span className={styles.successText}>성공 {sendResults.filter(r => r.success).length}건</span>
                {' / '}
                <span className={styles.failText}>실패 {sendResults.filter(r => !r.success).length}건</span>
              </div>
              <ul className={styles.smsResultsList}>
                {sendResults.map((r, i) => (
                  <li key={i}>
                    <span>{r.name}</span>
                    <span>{r.phone}</span>
                    <span className={r.success ? styles.successText : styles.failText}>
                      {r.success ? '성공' : '실패'}
                    </span>
                  </li>
                ))}
              </ul>
              <button className={styles.filterBtn} onClick={handleCloseSms} style={{ marginTop: 12 }}>닫기</button>
            </div>
          ) : (
            <>
              <div className={styles.smsTemplates}>
                {LECTURE_SMS_TEMPLATES.map((tpl, i) => (
                  <button
                    key={i}
                    className={styles.filterBtn}
                    onClick={() => handleApplyTemplate(tpl.content)}
                    disabled={sending}
                  >
                    {tpl.name}
                  </button>
                ))}
              </div>
              <div className={styles.smsHint}>
                사용 가능 변수: <code>{'{이름}'}</code> <code>{'{강의유형}'}</code>
              </div>
              <textarea
                className={styles.smsTextarea}
                value={smsMessage}
                onChange={e => setSmsMessage(e.target.value)}
                placeholder="메시지를 입력하세요"
                rows={8}
                disabled={sending}
              />
              <div className={styles.smsByteBar}>
                <span>{byteInfo.bytes}/{byteInfo.max} bytes</span>
                <span className={
                  byteInfo.type === 'SMS' ? styles.successText
                    : byteInfo.type === 'LMS' ? '' : styles.failText
                }>
                  {byteInfo.type}
                </span>
              </div>
              <div className={styles.smsActions}>
                {sending && (
                  <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                    발송 중... {sendProgress.current}/{sendProgress.total}
                  </span>
                )}
                <button
                  className={styles.smsBtn}
                  onClick={handleSendSms}
                  disabled={sending || !smsMessage.trim() || byteInfo.type === 'OVER' || selectedApps.length === 0}
                >
                  {sending ? '발송 중...' : `발송 (${selectedApps.length}명)`}
                </button>
              </div>
            </>
          )}
        </div>
      )}
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
    { key: 'lectures', label: '강의 신청' },
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
        {activeTab === 'lectures' && <LecturesTab toast={toast} />}
      </div>
      <Footer />
      <ConfirmDialog {...confirmDialogProps} />
    </div>
  );
}
