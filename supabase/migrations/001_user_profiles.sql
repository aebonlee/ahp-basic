-- user_profiles 테이블 생성
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

-- RLS 활성화
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- 누구나 프로필 조회 가능
CREATE POLICY "user_profiles_select" ON public.user_profiles
  FOR SELECT USING (true);

-- 본인만 프로필 수정 가능
CREATE POLICY "user_profiles_update" ON public.user_profiles
  FOR UPDATE USING (auth.uid() = id);

-- 신규 사용자 자동 프로필 생성 트리거
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

-- 트리거 (이미 존재하면 삭제 후 재생성)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- projects 테이블
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

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "projects_owner_all" ON public.projects
  FOR ALL USING (auth.uid() = owner_id);

CREATE POLICY "projects_evaluator_select" ON public.projects
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.evaluators
      WHERE evaluators.project_id = projects.id
      AND evaluators.user_id = auth.uid()
    )
  );

-- criteria 테이블
CREATE TABLE IF NOT EXISTS public.criteria (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES public.criteria(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.criteria ENABLE ROW LEVEL SECURITY;

CREATE POLICY "criteria_project_owner" ON public.criteria
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = criteria.project_id
      AND projects.owner_id = auth.uid()
    )
  );

CREATE POLICY "criteria_evaluator_select" ON public.criteria
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.evaluators
      WHERE evaluators.project_id = criteria.project_id
      AND evaluators.user_id = auth.uid()
    )
  );

-- alternatives 테이블
CREATE TABLE IF NOT EXISTS public.alternatives (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES public.alternatives(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.alternatives ENABLE ROW LEVEL SECURITY;

CREATE POLICY "alternatives_project_owner" ON public.alternatives
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = alternatives.project_id
      AND projects.owner_id = auth.uid()
    )
  );

CREATE POLICY "alternatives_evaluator_select" ON public.alternatives
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.evaluators
      WHERE evaluators.project_id = alternatives.project_id
      AND evaluators.user_id = auth.uid()
    )
  );

-- evaluators 테이블
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

ALTER TABLE public.evaluators ENABLE ROW LEVEL SECURITY;

CREATE POLICY "evaluators_project_owner" ON public.evaluators
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = evaluators.project_id
      AND projects.owner_id = auth.uid()
    )
  );

CREATE POLICY "evaluators_self_select" ON public.evaluators
  FOR SELECT USING (user_id = auth.uid());

-- pairwise_comparisons 테이블
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

ALTER TABLE public.pairwise_comparisons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "comparisons_evaluator_crud" ON public.pairwise_comparisons
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.evaluators
      WHERE evaluators.id = pairwise_comparisons.evaluator_id
      AND evaluators.user_id = auth.uid()
    )
  );

CREATE POLICY "comparisons_owner_select" ON public.pairwise_comparisons
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = pairwise_comparisons.project_id
      AND projects.owner_id = auth.uid()
    )
  );

-- brainstorming_items 테이블
CREATE TABLE IF NOT EXISTS public.brainstorming_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  zone TEXT NOT NULL CHECK (zone IN ('alternative', 'advantage', 'disadvantage', 'criterion')),
  text TEXT NOT NULL,
  parent_id UUID REFERENCES public.brainstorming_items(id) ON DELETE CASCADE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.brainstorming_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "brainstorming_project_owner" ON public.brainstorming_items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = brainstorming_items.project_id
      AND projects.owner_id = auth.uid()
    )
  );

-- evaluation_signatures 테이블
CREATE TABLE IF NOT EXISTS public.evaluation_signatures (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  evaluator_id UUID REFERENCES public.evaluators(id) ON DELETE CASCADE,
  signed_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(project_id, evaluator_id)
);

ALTER TABLE public.evaluation_signatures ENABLE ROW LEVEL SECURITY;

CREATE POLICY "signatures_evaluator_crud" ON public.evaluation_signatures
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.evaluators
      WHERE evaluators.id = evaluation_signatures.evaluator_id
      AND evaluators.user_id = auth.uid()
    )
  );

CREATE POLICY "signatures_owner_select" ON public.evaluation_signatures
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = evaluation_signatures.project_id
      AND projects.owner_id = auth.uid()
    )
  );

-- orders 테이블 (결제)
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

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

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
