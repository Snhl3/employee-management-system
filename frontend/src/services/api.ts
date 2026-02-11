import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

const api = axios.create({
    baseURL: API_BASE_URL,
});

// Request interceptor: attach token to every request
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Response interceptor: handle token expiration or invalid token
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && (error.response.status === 401 || error.response.status === 403)) {
            // Check if it's not the login endpoint to avoid infinite loops
            if (!error.config.url.includes('/auth/login')) {
                localStorage.removeItem('token');
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

export const login = async (credentials: any) => {
    const params = new URLSearchParams();
    params.append('username', credentials.email);
    params.append('password', credentials.password);
    const response = await api.post('/auth/login', params, {
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        }
    });
    return response.data;
};

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

// User Management APIs
export const fetchUsers = async () => {
    const response = await api.get('/users/');
    return response.data;
};

export const updateUserRole = async (userId: number, role: string) => {
    const response = await api.patch(`/users/${userId}/role`, { role });
    return response.data;
};

export const updateUserStatus = async (userId: number, isActive: boolean) => {
    const response = await api.patch(`/users/${userId}/status`, { is_active: isActive });
    return response.data;
};

export default api;
