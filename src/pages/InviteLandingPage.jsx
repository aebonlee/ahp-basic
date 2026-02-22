import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../hooks/useAuth';
import LoadingSpinner from '../components/common/LoadingSpinner';
import Button from '../components/common/Button';

export default function InviteLandingPage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [status, setStatus] = useState('loading');
  const [project, setProject] = useState(null);

  const checkInvite = useCallback(async () => {
    // Token is the project ID
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', token)
      .single();

    if (error || !data) {
      setStatus('invalid');
      return;
    }

    setProject(data);

    if (user) {
      // Already logged in - check if assigned
      const { data: evalData } = await supabase
        .from('evaluators')
        .select('*')
        .eq('project_id', token)
        .eq('user_id', user.id)
        .single();

      if (evalData) {
        setStatus('ready');
      } else {
        setStatus('not_assigned');
      }
    } else {
      setStatus('need_login');
    }
  }, [token, user]);

  useEffect(() => {
    checkInvite();
  }, [checkInvite]);

  if (status === 'loading') return <LoadingSpinner message="초대 확인 중..." />;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ background: '#fff', borderRadius: 12, padding: 32, maxWidth: 400, width: '100%', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', textAlign: 'center' }}>
        <h1 style={{ fontSize: '1.5rem', color: 'var(--color-primary)', marginBottom: 8 }}>AHP Basic</h1>

        {status === 'invalid' && (
          <>
            <p style={{ marginBottom: 16, color: 'var(--color-danger)' }}>유효하지 않은 초대 링크입니다.</p>
            <Button onClick={() => navigate('/login')}>로그인</Button>
          </>
        )}

        {status === 'need_login' && (
          <>
            <h2 style={{ fontSize: '1.1rem', marginBottom: 8 }}>{project?.name}</h2>
            <p style={{ marginBottom: 16, color: 'var(--color-text-light)' }}>평가에 참여하려면 로그인이 필요합니다.</p>
            <Button onClick={() => navigate('/login')}>로그인</Button>
          </>
        )}

        {status === 'not_assigned' && (
          <>
            <h2 style={{ fontSize: '1.1rem', marginBottom: 8 }}>{project?.name}</h2>
            <p style={{ marginBottom: 16, color: 'var(--color-text-light)' }}>이 프로젝트의 평가자로 배정되지 않았습니다.</p>
            <Button onClick={() => navigate('/eval')}>평가자 화면으로</Button>
          </>
        )}

        {status === 'ready' && (
          <>
            <h2 style={{ fontSize: '1.1rem', marginBottom: 8 }}>{project?.name}</h2>
            <p style={{ marginBottom: 16, color: 'var(--color-text-light)' }}>평가에 참여할 준비가 되었습니다.</p>
            <Button onClick={() => navigate(`/eval/project/${token}`)}>평가 시작</Button>
          </>
        )}
      </div>
    </div>
  );
}
