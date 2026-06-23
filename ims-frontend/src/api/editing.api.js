import axios from './axios';
export const getEditingProjects = async (params) => {
    const response = await axios.get('/media/editing/projects', { params });
    return response.data;
};
export const getEditingStats = async () => {
    const response = await axios.get('/media/editing/projects/stats');
    return response.data;
};
export const getEditingProject = async (id) => {
    const response = await axios.get(`/media/editing/projects/${id}`);
    return response.data;
};
export const createEditingProject = async (data) => {
    const response = await axios.post('/media/editing/projects', data);
    return response.data;
};
export const updateEditingProject = async (id, data) => {
    const response = await axios.patch(`/media/editing/projects/${id}`, data);
    return response.data;
};
export const getEditingTasks = async (params) => {
    const response = await axios.get('/media/editing/tasks', { params });
    return response.data;
};
export const getEditingTask = async (id) => {
    const response = await axios.get(`/media/editing/tasks/${id}`);
    return response.data;
};
export const createEditingTask = async (data) => {
    const response = await axios.post('/media/editing/tasks', data);
    return response.data;
};
export const updateEditingTask = async (id, data) => {
    const response = await axios.patch(`/media/editing/tasks/${id}`, data);
    return response.data;
};
export const createEditingComment = async (taskId, body) => {
    const response = await axios.post(`/media/editing/tasks/${taskId}/comments`, { body });
    return response.data;
};
