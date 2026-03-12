import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';

export function useSuperAdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.rpc('sa_list_users');
    if (error) {
      setUsers([]);
    } else {
      setUsers(data || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const updateRole = useCallback(async (userId, role) => {
    const { error } = await supabase.rpc('sa_update_user_role', {
      p_user_id: userId,
      p_role: role,
    });
    if (error) throw error;
    await fetchUsers();
  }, [fetchUsers]);

  return { users, loading, updateRole, refresh: fetchUsers };
}

export function useSuperAdminProjects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.rpc('sa_list_projects');
    if (error) {
      setProjects([]);
    } else {
      setProjects(data || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const deleteProject = useCallback(async (projectId) => {
    const { error } = await supabase.rpc('sa_delete_project', {
      p_project_id: projectId,
    });
    if (error) throw error;
    await fetchProjects();
  }, [fetchProjects]);

  return { projects, loading, deleteProject, refresh: fetchProjects };
}

export function useSuperAdminSmsStats() {
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.rpc('sa_sms_stats');
    if (error) {
      setStats([]);
    } else {
      setStats(data || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return { stats, loading, refresh: fetchStats };
}
