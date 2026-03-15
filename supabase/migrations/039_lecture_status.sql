-- 강의 신청 상태 컬럼 추가: pending(접수) → confirmed(확정) → completed(완료)
ALTER TABLE public.lecture_applications
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'pending';

-- admin/superadmin만 UPDATE 가능
CREATE POLICY "Only admins can update lecture applications"
  ON public.lecture_applications
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE user_profiles.id = auth.uid()
        AND user_profiles.role IN ('admin', 'superadmin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE user_profiles.id = auth.uid()
        AND user_profiles.role IN ('admin', 'superadmin')
    )
  );
