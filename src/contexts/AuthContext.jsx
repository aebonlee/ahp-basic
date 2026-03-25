import { createContext, useReducer, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../lib/supabaseClient';
import { USER_MODE } from '../lib/constants';
import {
  signInWithEmail,
  signInWithGoogle,
  signInWithKakao,
  signUp as authSignUp,
  signOut as authSignOut,
  resetPassword as authResetPassword,
  getProfile,
  updateProfile as authUpdateProfile,
} from '../utils/auth';
import { clearAllApiKeys } from '../lib/aiService';

export const AuthContext = createContext(null);

const initialState = {
  user: null,
  session: null,
  profile: null,
  profileLoading: false,
  mode: USER_MODE.ADMIN,
  loading: true,
  error: null,
  accountBlock: null,
};

function authReducer(state, action) {
  switch (action.type) {
    case 'SET_SESSION':
      return {
        ...state,
        user: action.payload?.user || null,
        session: action.payload,
        loading: false,
        error: null,
      };
    case 'SET_PROFILE':
      return { ...state, profile: action.payload, profileLoading: false };
    case 'SET_PROFILE_LOADING':
      return { ...state, profileLoading: true };
    case 'SET_MODE':
      return { ...state, mode: action.payload };
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };
    case 'SET_ACCOUNT_BLOCK':
      return { ...state, accountBlock: action.payload };
    case 'SIGN_OUT':
      return { ...initialState, loading: false };
    default:
      return state;
  }
}

export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  const clearAccountBlock = useCallback(() => {
    dispatch({ type: 'SET_ACCOUNT_BLOCK', payload: null });
  }, []);

  // 프로필 로드
  const loadProfile = useCallback(async (userId) => {
    dispatch({ type: 'SET_PROFILE_LOADING' });
    try {
      const profile = await getProfile(userId);
      dispatch({ type: 'SET_PROFILE', payload: profile });

      // signup_domain / visited_sites / check_user_status 자동 처리
      if (profile) {
        const currentDomain = window.location.hostname;
        const updates = {};
        if (!profile.signup_domain) updates.signup_domain = currentDomain;
        const sites = Array.isArray(profile.visited_sites) ? profile.visited_sites : [];
        if (!sites.includes(currentDomain)) {
          updates.visited_sites = [...sites, currentDomain];
        }
        if (Object.keys(updates).length > 0) {
          supabase.from('user_profiles').update(updates).eq('id', userId).then(() => {});
        }

        // 계정 상태 체크
        try {
          const { data: statusData } = await supabase.rpc('check_user_status', {
            target_user_id: userId,
            current_domain: currentDomain,
          });
          if (statusData && statusData.status && statusData.status !== 'active') {
            dispatch({
              type: 'SET_ACCOUNT_BLOCK',
              payload: {
                status: statusData.status,
                reason: statusData.reason || '',
                suspended_until: statusData.suspended_until || null,
              },
            });
            await supabase.auth.signOut();
            dispatch({ type: 'SIGN_OUT' });
            return;
          }
        } catch {
          // check_user_status 함수 미존재 시 무시
        }
      }
    } catch {
      dispatch({ type: 'SET_PROFILE', payload: null });
    }
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      dispatch({ type: 'SET_SESSION', payload: session });
      if (session?.user) loadProfile(session.user.id);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        dispatch({ type: 'SET_SESSION', payload: session });
        if (session?.user) {
          loadProfile(session.user.id);
          if (event === 'SIGNED_IN') {
            supabase.from('user_profiles')
              .update({ last_sign_in_at: new Date().toISOString() })
              .eq('id', session.user.id)
              .then(() => {});
          }
        } else {
          dispatch({ type: 'SET_PROFILE', payload: null });
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [loadProfile]);

  const setMode = useCallback((mode) => {
    dispatch({ type: 'SET_MODE', payload: mode });
  }, []);

  // 이메일 로그인
  const signIn = useCallback(async (email, password) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      await signInWithEmail(email, password);
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
      throw error;
    }
  }, []);

  // Google 로그인
  const loginWithGoogle = useCallback(async () => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      await signInWithGoogle();
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
      throw error;
    }
  }, []);

  // Kakao 로그인
  const loginWithKakao = useCallback(async () => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      await signInWithKakao();
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
      throw error;
    }
  }, []);

  // 회원가입 (role: 'user' | 'evaluator')
  const signUp = useCallback(async (email, password, displayName, role) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      await authSignUp(email, password, displayName, role);
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
      throw error;
    }
  }, []);

  // 로그아웃
  const signOut = useCallback(async () => {
    clearAllApiKeys();
    try { await authSignOut(); } catch { /* 서버 오류 시에도 로컬 상태 정리 */ }
    dispatch({ type: 'SIGN_OUT' });
  }, []);

  // 비밀번호 재설정
  const resetPassword = useCallback(async (email) => {
    await authResetPassword(email);
  }, []);

  // 프로필 새로고침
  const refreshProfile = useCallback(async () => {
    if (state.user) {
      await loadProfile(state.user.id);
    }
  }, [state.user, loadProfile]);

  // 프로필 업데이트
  const updateProfile = useCallback(async (updates) => {
    if (!state.user) throw new Error('로그인이 필요합니다.');
    const updated = await authUpdateProfile(state.user.id, updates);
    dispatch({ type: 'SET_PROFILE', payload: updated });
    return updated;
  }, [state.user]);

  const isLoggedIn = !!state.user;
  const isAdmin = isLoggedIn && ['admin', 'superadmin'].includes(state.profile?.role);
  const isEvaluator = isLoggedIn && state.profile?.role === 'evaluator';

  const value = useMemo(() => ({
    ...state,
    isLoggedIn,
    isAdmin,
    isEvaluator,
    clearAccountBlock,
    setMode,
    signIn,
    loginWithGoogle,
    loginWithKakao,
    signUp,
    signOut,
    resetPassword,
    refreshProfile,
    updateProfile,
  }), [state, isLoggedIn, isAdmin, isEvaluator, clearAccountBlock, setMode, signIn, loginWithGoogle, loginWithKakao, signUp, signOut, resetPassword, refreshProfile, updateProfile]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
