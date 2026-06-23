import axios from './axios';

// ─── Editing Projects ─────────────────────────────────────────────────────────

export interface EditingProject {
  id: string;
  title: string;
  description?: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'ON_HOLD';
  deadline: string;
  createdBy: { id: string; name: string };
  _count?: { tasks: number };
  createdAt: string;
  updatedAt: string;
}

export interface CreateEditingProjectData {
  title: string;
  description?: string;
  deadline: string;
}

export const getEditingProjects = async (params?: { status?: string; search?: string }): Promise<EditingProject[]> => {
  const response = await axios.get('/media/editing/projects', { params });
  return response.data;
};

export const getEditingStats = async () => {
  const response = await axios.get('/media/editing/projects/stats');
  return response.data;
};

export const getEditingProject = async (id: string): Promise<EditingProject> => {
  const response = await axios.get(`/media/editing/projects/${id}`);
  return response.data;
};

export const createEditingProject = async (data: CreateEditingProjectData): Promise<EditingProject> => {
  const response = await axios.post('/media/editing/projects', data);
  return response.data;
};

export const updateEditingProject = async (
  id: string,
  data: Partial<CreateEditingProjectData & { status?: string }>
): Promise<EditingProject> => {
  const response = await axios.patch(`/media/editing/projects/${id}`, data);
  return response.data;
};

// ─── Editing Tasks ────────────────────────────────────────────────────────────

export interface EditingTask {
  id: string;
  projectId: string;
  title: string;
  description?: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'ON_HOLD';
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  deadline?: string;
  fileUrl?: string;
  project: { id: string; title: string };
  assignee: { id: string; name: string };
  _count?: { comments: number };
  createdAt: string;
  updatedAt: string;
}

export interface CreateEditingTaskData {
  projectId: string;
  title: string;
  description?: string;
  assigneeId: string;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH';
  deadline?: string;
  fileUrl?: string;
}

export const getEditingTasks = async (params?: {
  projectId?: string;
  status?: string;
  priority?: string;
  search?: string;
}): Promise<EditingTask[]> => {
  const response = await axios.get('/media/editing/tasks', { params });
  return response.data;
};

export const getEditingTask = async (id: string): Promise<EditingTask> => {
  const response = await axios.get(`/media/editing/tasks/${id}`);
  return response.data;
};

export const createEditingTask = async (data: CreateEditingTaskData): Promise<EditingTask> => {
  const response = await axios.post('/media/editing/tasks', data);
  return response.data;
};

export const updateEditingTask = async (
  id: string,
  data: Partial<CreateEditingTaskData & { status?: string }>
): Promise<EditingTask> => {
  const response = await axios.patch(`/media/editing/tasks/${id}`, data);
  return response.data;
};

// ─── Editing Comments ─────────────────────────────────────────────────────────

export interface EditingComment {
  id: string;
  taskId: string;
  body: string;
  author: { id: string; name: string };
  createdAt: string;
  updatedAt: string;
}

export const createEditingComment = async (taskId: string, body: string): Promise<EditingComment> => {
  const response = await axios.post(`/media/editing/tasks/${taskId}/comments`, { body });
  return response.data;
};
