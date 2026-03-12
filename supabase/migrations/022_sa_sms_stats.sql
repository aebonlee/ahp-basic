-- Super Admin: SMS 발송 통계 조회 RPC
CREATE OR REPLACE FUNCTION public.sa_sms_stats()
RETURNS TABLE(
  sender_id UUID,
  sender_email TEXT,
  sender_name TEXT,
  total_count BIGINT,
  success_count BIGINT,
  fail_count BIGINT,
  last_sent_at TIMESTAMPTZ
)
LANGUAGE plpgsql SECURITY DEFINER STABLE
SET search_path = public AS $$
BEGIN
  PERFORM assert_superadmin();
  RETURN QUERY
    SELECT
      s.sender_id,
      u.email::TEXT,
      COALESCE(p.display_name, '')::TEXT,
      COUNT(*)::BIGINT,
      COUNT(*) FILTER (WHERE s.success)::BIGINT,
      COUNT(*) FILTER (WHERE NOT s.success)::BIGINT,
      MAX(s.sent_at)
    FROM sms_logs s
    JOIN auth.users u ON u.id = s.sender_id
    LEFT JOIN user_profiles p ON p.id = s.sender_id
    GROUP BY s.sender_id, u.email, p.display_name
    ORDER BY COUNT(*) DESC;
END;
$$;
