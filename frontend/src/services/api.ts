import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

const api = axios.create({
    baseURL: API_BASE_URL,
});

export const fetchMetrics = async () => {
    const response = await api.get('/dashboard/metrics');
    return response.data;
};

export const fetchRecentProfiles = async () => {
    const response = await api.get('/employees/recent');
    return response.data;
};

export const searchEmployees = async (query: string) => {
    const response = await api.get(`/employees/search?query=${query}`);
    return response.data;
};

export const fetchLLMSettings = async () => {
    const response = await api.get('/settings/llm');
    return response.data;
};

export const updateLLMSettings = async (settings: { provider: string; model_name: string }) => {
    const response = await api.post('/settings/llm', settings);
    return response.data;
};

export default api;
