import { supabase } from '../lib/supabaseClient';

// 현재 사이트 origin 기반 리다이렉트 URL 생성
// OAuth용: hash fragment를 포함하면 Supabase의 #access_token과 충돌하므로
// OAuth에서는 baseUrl만 사용하고, 이메일 리다이렉트에서만 hash 포함
function getBaseUrl() {
  const origin = window.location.origin;
  const pathname = window.location.pathname;
  return `${origin}${pathname}`;
}

function getRedirectUrl(hash = '') {
  const base = getBaseUrl();
  return hash ? `${base}#${hash}` : base;
}

// Google OAuth 로그인
export async function signInWithGoogle() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: getBaseUrl(),
    },
  });
  if (error) throw error;
  return data;
}

// Kakao OAuth 로그인
export async function signInWithKakao() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'kakao',
    options: {
      redirectTo: getBaseUrl(),
    },
  });
  if (error) throw error;
  return data;
}

// 이메일/비밀번호 로그인
export async function signInWithEmail(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw error;
  return data;
}

// 회원가입 (displayName 포함)
export async function signUp(email, password, displayName) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: displayName },
      emailRedirectTo: getRedirectUrl('/login'),
    },
  });
  if (error) throw error;
  return data;
}

// 로그아웃
export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

// 비밀번호 재설정 이메일 발송
export async function resetPassword(email) {
  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: getRedirectUrl('/login'),
  });
  if (error) throw error;
  return data;
}

// 프로필 조회
export async function getProfile(userId) {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', userId)
    .single();
  if (error && error.code !== 'PGRST116') throw error;
  return data;
}

// 프로필 업데이트
export async function updateProfile(userId, updates) {
  const { data, error } = await supabase
    .from('user_profiles')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', userId)
    .select()
    .single();
  if (error) throw error;
  return data;
}
