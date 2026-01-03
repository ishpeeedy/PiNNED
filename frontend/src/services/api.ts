import axios from 'axios';
import type { InternalAxiosRequestConfig } from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export const authAPI = {
    register: async (email: string, password: string, name: string) => {
        const response = await api.post('/api/auth/register', {
            email,
            password,
            name,
        });
        return response.data;
    },
    login: async (email: string, password: string) => {
        const response = await api.post('/api/auth/login', {
            email,
            password,
        });
        return response.data;
    },
    getMe: async () => {
        const response = await api.get('/api/auth/me');
        return response.data;
    },
};
