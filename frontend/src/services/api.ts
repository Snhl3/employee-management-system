import axios from 'axios';

const API_BASE_URL = (import.meta as any).env.VITE_API_BASE_URL || 'http://localhost:8000/api';

const api = axios.create({
    baseURL: API_BASE_URL,
});

// Request interceptor: attach token to every request
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        console.log(`[API Request] ${config.method?.toUpperCase()} ${config.url}`);
        return config;
    },
    (error) => {
        console.error('[API Request Error]', error);
        return Promise.reject(error);
    }
);

// Response interceptor: handle token expiration or invalid token
api.interceptors.response.use(
    (response) => {
        console.log(`[API Response] ${response.config.method?.toUpperCase()} ${response.config.url} - ${response.status}`);
        return response;
    },
    (error) => {
        console.error('[API Response Error]', error.response?.status, error.message);
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

// Helper function to handle API errors consistently
const handleApiError = (error: any, context: string) => {
    console.error(`[${context}] Error:`, error);
    let detail = error.response?.data?.detail;

    // Handle list of error objects (common in Pydantic validation errors)
    if (Array.isArray(detail)) {
        detail = detail.map(err => `${err.loc.join('.')}: ${err.msg}`).join(', ');
    } else if (typeof detail === 'object' && detail !== null) {
        detail = JSON.stringify(detail);
    }

    const message = detail || error.message || 'An unexpected error occurred';
    throw new Error(message);
};

export const login = async (credentials: any) => {
    try {
        const params = new URLSearchParams();
        params.append('username', credentials.email);
        params.append('password', credentials.password);
        const response = await api.post('/auth/login', params, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });
        return response.data;
    } catch (error) {
        handleApiError(error, 'Login');
    }
};

export const fetchMetrics = async () => {
    try {
        const response = await api.get('/dashboard/metrics');
        return response.data;
    } catch (error) {
        handleApiError(error, 'Fetch Metrics');
    }
};

export const fetchRecentProfiles = async () => {
    try {
        const response = await api.get('/employees/recent');
        return response.data;
    } catch (error) {
        handleApiError(error, 'Fetch Recent Profiles');
    }
};

export const searchEmployees = async (query: string) => {
    try {
        const response = await api.get(`/employees/search?query=${encodeURIComponent(query)}`);
        return response.data;
    } catch (error) {
        handleApiError(error, 'Search Employees');
    }
};

export const fetchLLMSettings = async () => {
    try {
        const response = await api.get('/settings/llm');
        return response.data;
    } catch (error) {
        handleApiError(error, 'Fetch LLM Settings');
    }
};

export interface LLMSettings {
    provider: string;
    model_name: string;
    api_key?: string;
    api_base?: string;
}

export const updateLLMSettings = async (settings: LLMSettings) => {
    try {
        const response = await api.post('/settings/llm', settings);
        return response.data;
    } catch (error) {
        handleApiError(error, 'Update LLM Settings');
    }
};

export const testLLMPrompt = async (prompt: string) => {
    try {
        const response = await api.post('/settings/llm/test', { prompt });
        return response.data;
    } catch (error) {
        handleApiError(error, 'Test LLM Prompt');
    }
};

// Employee Profile APIs
export const fetchMyProfile = async () => {
    try {
        const response = await api.get('/employees/me');
        return response.data;
    } catch (error) {
        handleApiError(error, 'Fetch My Profile');
    }
};

export const fetchAuthMe = async () => {
    try {
        const response = await api.get('/auth/me');
        return response.data;
    } catch (error) {
        handleApiError(error, 'Fetch Auth Me');
    }
};

export const updateMyProfile = async (profileData: any) => {
    try {
        const response = await api.put('/employees/me', profileData);
        return response.data;
    } catch (error) {
        handleApiError(error, 'Update My Profile');
    }
};

export const updateEmployee = async (empId: string, profileData: any) => {
    try {
        const response = await api.put(`/employees/${empId}`, profileData);
        return response.data;
    } catch (error) {
        handleApiError(error, 'Update Employee');
    }
};

export const createEmployee = async (profileData: any) => {
    try {
        const response = await api.post('/employees', profileData);
        return response.data;
    } catch (error) {
        handleApiError(error, 'Create Employee');
    }
};

export const fetchEmployeeById = async (empId: string) => {
    try {
        const response = await api.get(`/employees/${empId}`);
        return response.data;
    } catch (error) {
        handleApiError(error, 'Fetch Employee By Id');
    }
};

export const autofillProfile = async (partialData: any) => {
    try {
        const response = await api.post('/employees/autofill', partialData);
        return response.data;
    } catch (error) {
        handleApiError(error, 'Autofill Profile');
    }
};

export const parseResume = async (file: File) => {
    try {
        const formData = new FormData();
        formData.append('file', file);
        const response = await api.post('/employees/parse-resume', formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
        return response.data;
    } catch (error) {
        handleApiError(error, 'Parse Resume');
    }
};

export const generateProfileSummary = async () => {
    try {
        const response = await api.post('/employees/generate-summary');
        return response.data;
    } catch (error) {
        handleApiError(error, 'Generate Profile Summary');
    }
};

// User Management APIs
export const fetchUsers = async () => {
    try {
        const response = await api.get('/users/');
        return response.data;
    } catch (error) {
        handleApiError(error, 'Fetch Users');
    }
};

export const createUser = async (userData: any) => {
    try {
        const response = await api.post('/users/', userData);
        return response.data;
    } catch (error) {
        handleApiError(error, 'Create User');
    }
};

export const updateUserRole = async (userId: number, role: string) => {
    try {
        const response = await api.patch(`/users/${userId}/role`, { role });
        return response.data;
    } catch (error) {
        handleApiError(error, 'Update User Role');
    }
};

export const updateUserStatus = async (userId: number, isActive: boolean) => {
    try {
        const response = await api.patch(`/users/${userId}/status`, { is_active: isActive });
        return response.data;
    } catch (error) {
        handleApiError(error, 'Update User Status');
    }
};

export const updateUser = async (userId: number, userData: any) => {
    try {
        const response = await api.patch(`/users/${userId}`, userData);
        return response.data;
    } catch (error) {
        handleApiError(error, 'Update User');
    }
};

export const deleteUser = async (userId: number) => {
    try {
        const response = await api.delete(`/users/${userId}`);
        return response.data;
    } catch (error) {
        handleApiError(error, 'Delete User');
    }
};

export default api;
export const fetchLLMModels = async (provider: string) => {
    try {
        const response = await api.get(`/settings/llm/models?provider=${provider}`);
        return response.data;
    } catch (error) {
        return handleApiError(error, 'load models');
    }
};
