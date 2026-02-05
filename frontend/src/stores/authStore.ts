import { create } from 'zustand';
import { authAPI } from '../services/api';
import type { User } from '@/types';

interface AuthState {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
    setAuth: (user: User, token: string) => void;
    logout: () => void;
    checkAuth: () => Promise<void>;
}

const storedUser = localStorage.getItem('user');
const parsedUser: User | null = storedUser ? JSON.parse(storedUser) : null;

export const useAuthStore = create<AuthState>((set) => ({
    user: parsedUser,
    token: localStorage.getItem('token'),
    isAuthenticated: !!localStorage.getItem('token'),

    setAuth: (user, token) => {
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        set({ user, token, isAuthenticated: true });
    },

    logout: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        set({ user: null, token: null, isAuthenticated: false });
    },

    checkAuth: async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            localStorage.removeItem('user');
            set({ user: null, token: null, isAuthenticated: false });
            return;
        }

        try {
            const userData = await authAPI.getMe();
            localStorage.setItem('user', JSON.stringify(userData.user));
            set({ user: userData.user, token, isAuthenticated: true });
        } catch (error) {
            // Token invalid or expired
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            set({ user: null, token: null, isAuthenticated: false });
        }
    },
}));
