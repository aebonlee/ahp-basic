-- 강의 확정일 컬럼 추가
ALTER TABLE public.lecture_applications
  ADD COLUMN IF NOT EXISTS confirmed_date text;
