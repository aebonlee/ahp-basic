import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';

function getVisitorId() {
  const key = 'ahp_visitor_id';
  let id = localStorage.getItem(key);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(key, id);
  }
  return id;
}

export function usePageView() {
  const { pathname } = useLocation();
  const prevPath = useRef(null);

  useEffect(() => {
    if (pathname === prevPath.current) return;
    prevPath.current = pathname;

    const visitorId = getVisitorId();
    const userId = supabase.auth.getUser?.()
      ?.then?.(({ data }) => data?.user?.id)
      ?? null;

    // Fire-and-forget using thenable pattern (no .catch on PostgrestFilterBuilder)
    if (userId && typeof userId.then === 'function') {
      userId.then((uid) => {
        supabase
          .rpc('record_page_view', {
            p_path: pathname,
            p_visitor_id: visitorId,
            p_user_id: uid || null,
          })
          .then(null, () => {});
      }, () => {
        supabase
          .rpc('record_page_view', {
            p_path: pathname,
            p_visitor_id: visitorId,
            p_user_id: null,
          })
          .then(null, () => {});
      });
    } else {
      supabase
        .rpc('record_page_view', {
          p_path: pathname,
          p_visitor_id: visitorId,
          p_user_id: null,
        })
        .then(null, () => {});
    }
  }, [pathname]);
}
