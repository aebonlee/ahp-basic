import { createContext, useReducer, useEffect, useCallback } from 'react';
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

// DB role 미설정 시 폴백용 부트스트랩 이메일 (마이그레이션 후 제거 가능)
const BOOTSTRAP_ADMIN_EMAILS = ['aebon@kakao.com', 'aebon@kyonggi.ac.kr', 'ryuwebpd@gmail.com'];

const initialState = {
  user: null,
  session: null,
  profile: null,
  profileLoading: false,
  mode: USER_MODE.ADMIN,
  loading: true,
  error: null,
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
    case 'SIGN_OUT':
      return { ...initialState, loading: false };
    default:
      return state;
  }
}

export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // 프로필 로드
  const loadProfile = useCallback(async (userId) => {
    dispatch({ type: 'SET_PROFILE_LOADING' });
    try {
      const profile = await getProfile(userId);
      dispatch({ type: 'SET_PROFILE', payload: profile });
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
      (_event, session) => {
        dispatch({ type: 'SET_SESSION', payload: session });
        if (session?.user) {
          loadProfile(session.user.id);
        } else {
          dispatch({ type: 'SET_PROFILE', payload: null });
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [loadProfile]);

  // signup_domain + visited_sites 자동 설정 (onAuthStateChange 밖에서 실행)
  useEffect(() => {
    if (state.user?.id) {
      supabase.rpc('check_user_status', {
        target_user_id: state.user.id,
        current_domain: window.location.hostname,
      }).then(null, () => {});
    }
  }, [state.user?.id]);

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

  // 회원가입
  const signUp = useCallback(async (email, password, displayName) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      await authSignUp(email, password, displayName);
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
  const isAdmin = isLoggedIn && (
    state.profile?.role === 'admin' || BOOTSTRAP_ADMIN_EMAILS.includes(state.user?.email)
  );

  const value = {
    ...state,
    isLoggedIn,
    isAdmin,
    setMode,
    signIn,
    loginWithGoogle,
    loginWithKakao,
    signUp,
    signOut,
    resetPassword,
    refreshProfile,
    updateProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
