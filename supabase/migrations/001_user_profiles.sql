-- ============================================
-- AHP Basic 전체 DB 스키마
-- Supabase SQL Editor에서 실행
-- ============================================

-- 1. 테이블 생성 (순서 중요: 참조 관계 순)
-- ============================================

-- user_profiles
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  display_name TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  provider TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- projects
CREATE TABLE IF NOT EXISTS public.projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  status INTEGER DEFAULT 2,
  eval_method INTEGER DEFAULT 10,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- criteria
CREATE TABLE IF NOT EXISTS public.criteria (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES public.criteria(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- alternatives
CREATE TABLE IF NOT EXISTS public.alternatives (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES public.alternatives(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- evaluators
CREATE TABLE IF NOT EXISTS public.evaluators (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  weight FLOAT DEFAULT 1.0,
  completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(project_id, email)
);

-- pairwise_comparisons
CREATE TABLE IF NOT EXISTS public.pairwise_comparisons (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  evaluator_id UUID REFERENCES public.evaluators(id) ON DELETE CASCADE,
  criterion_id UUID,
  row_id UUID NOT NULL,
  col_id UUID NOT NULL,
  value FLOAT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(project_id, evaluator_id, criterion_id, row_id, col_id)
);

-- brainstorming_items
CREATE TABLE IF NOT EXISTS public.brainstorming_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  zone TEXT NOT NULL CHECK (zone IN ('alternative', 'advantage', 'disadvantage', 'criterion')),
  text TEXT NOT NULL,
  parent_id UUID REFERENCES public.brainstorming_items(id) ON DELETE CASCADE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- evaluation_signatures
CREATE TABLE IF NOT EXISTS public.evaluation_signatures (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  evaluator_id UUID REFERENCES public.evaluators(id) ON DELETE CASCADE,
  signed_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(project_id, evaluator_id)
);

-- orders (결제)
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_number TEXT UNIQUE NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  user_email TEXT NOT NULL,
  user_name TEXT NOT NULL,
  total_amount INTEGER NOT NULL,
  payment_method TEXT DEFAULT 'card',
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'cancelled')),
  portone_payment_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 2. RLS 활성화
-- ============================================

ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.criteria ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alternatives ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evaluators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pairwise_comparisons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brainstorming_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evaluation_signatures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 2.5. RLS 순환참조 방지 헬퍼 함수
-- projects ↔ evaluators 간 상호참조를 SECURITY DEFINER로 끊음
-- ============================================

CREATE OR REPLACE FUNCTION public.is_project_owner(p_id UUID)
RETURNS BOOLEAN
LANGUAGE sql SECURITY DEFINER STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM projects WHERE id = p_id AND owner_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION public.is_project_evaluator(p_id UUID)
RETURNS BOOLEAN
LANGUAGE sql SECURITY DEFINER STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM evaluators WHERE project_id = p_id AND user_id = auth.uid()
  );
$$;

-- ============================================
-- 3. RLS 정책 (모든 테이블 생성 후)
-- ============================================

-- user_profiles 정책
CREATE POLICY "user_profiles_select" ON public.user_profiles
  FOR SELECT USING (true);

CREATE POLICY "user_profiles_update" ON public.user_profiles
  FOR UPDATE USING (auth.uid() = id);

-- projects 정책
CREATE POLICY "projects_owner_all" ON public.projects
  FOR ALL USING (auth.uid() = owner_id);

CREATE POLICY "projects_evaluator_select" ON public.projects
  FOR SELECT USING (public.is_project_evaluator(id));

-- criteria 정책
CREATE POLICY "criteria_project_owner" ON public.criteria
  FOR ALL USING (public.is_project_owner(project_id));

CREATE POLICY "criteria_evaluator_select" ON public.criteria
  FOR SELECT USING (public.is_project_evaluator(project_id));

-- alternatives 정책
CREATE POLICY "alternatives_project_owner" ON public.alternatives
  FOR ALL USING (public.is_project_owner(project_id));

CREATE POLICY "alternatives_evaluator_select" ON public.alternatives
  FOR SELECT USING (public.is_project_evaluator(project_id));

-- evaluators 정책
CREATE POLICY "evaluators_project_owner" ON public.evaluators
  FOR ALL USING (public.is_project_owner(project_id));

CREATE POLICY "evaluators_self_select" ON public.evaluators
  FOR SELECT USING (user_id = auth.uid());

-- pairwise_comparisons 정책
CREATE POLICY "comparisons_evaluator_crud" ON public.pairwise_comparisons
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.evaluators
      WHERE evaluators.id = pairwise_comparisons.evaluator_id
      AND evaluators.user_id = auth.uid()
    )
  );

CREATE POLICY "comparisons_owner_select" ON public.pairwise_comparisons
  FOR SELECT USING (public.is_project_owner(project_id));

-- brainstorming_items 정책
CREATE POLICY "brainstorming_project_owner" ON public.brainstorming_items
  FOR ALL USING (public.is_project_owner(project_id));

-- evaluation_signatures 정책
CREATE POLICY "signatures_evaluator_crud" ON public.evaluation_signatures
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.evaluators
      WHERE evaluators.id = evaluation_signatures.evaluator_id
      AND evaluators.user_id = auth.uid()
    )
  );

CREATE POLICY "signatures_owner_select" ON public.evaluation_signatures
  FOR SELECT USING (public.is_project_owner(project_id));

-- orders 정책
CREATE POLICY "orders_owner_select" ON public.orders
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "orders_insert" ON public.orders
  FOR INSERT WITH CHECK (true);

CREATE POLICY "orders_admin_select" ON public.orders
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

-- ============================================
-- 4. 트리거: 신규 사용자 자동 프로필 생성
-- ============================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, display_name, avatar_url, provider)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', ''),
    COALESCE(NEW.raw_user_meta_data->>'provider', 'email')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
