-- 온라인 강의 신청 테이블
create table if not exists public.lecture_applications (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  phone text not null,
  preferred_dates text[] not null default '{}',
  message text,
  created_at timestamptz not null default now()
);

-- RLS 활성화
alter table public.lecture_applications enable row level security;

-- INSERT: 누구나 (anon + authenticated) 신청 가능
create policy "Anyone can insert lecture applications"
  on public.lecture_applications
  for insert
  with check (true);

-- SELECT: admin만 조회 가능
create policy "Only admins can view lecture applications"
  on public.lecture_applications
  for select
  using (
    exists (
      select 1 from public.user_profiles
      where user_profiles.id = auth.uid()
        and user_profiles.role in ('admin', 'superadmin')
    )
  );
