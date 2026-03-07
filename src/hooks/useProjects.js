import { useEffect } from 'react';
import { useProjects as useProjectContext } from '../contexts/ProjectContext';

export function useProjectList() {
  const ctx = useProjectContext();
  const { fetchProjects } = ctx;

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  return ctx;
}

export function useProject(id) {
  const ctx = useProjectContext();
  const { fetchProject } = ctx;

  useEffect(() => {
    if (id) fetchProject(id);
  }, [id, fetchProject]);

  return ctx;
}
