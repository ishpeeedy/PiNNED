import axios from 'axios';
import type { InternalAxiosRequestConfig } from 'axios';
import type { Board, CreateBoardData, Tile, CreateTileData } from '@/types';

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

export const boardAPI = {
    // Get all boards for current user
    getBoards: async () => {
        const response = await api.get<Board[]>('/api/boards');
        return response.data;
    },

    // Get single board by ID
    getBoard: async (id: string) => {
        const response = await api.get<Board>(`/api/boards/${id}`);
        return response.data;
    },

    // Create new board
    createBoard: async (data: CreateBoardData) => {
        const response = await api.post<Board>('/api/boards', data);
        return response.data;
    },

    // Update board
    updateBoard: async (id: string, data: Partial<CreateBoardData>) => {
        const response = await api.patch<Board>(`/api/boards/${id}`, data);
        return response.data;
    },

    // Delete board
    deleteBoard: async (id: string) => {
        const response = await api.delete(`/api/boards/${id}`);
        return response.data;
    },
};

export const tileAPI = {
    // Get all tiles for a board
    getTiles: async (boardId: string) => {
        const response = await api.get<Tile[]>(`/api/boards/${boardId}/tiles`);
        return response.data;
    },

    // Get single tile
    getTile: async (boardId: string, tileId: string) => {
        const response = await api.get<Tile>(
            `/api/boards/${boardId}/tiles/${tileId}`
        );
        return response.data;
    },

    // Create new tile
    createTile: async (boardId: string, data: CreateTileData) => {
        const response = await api.post<Tile>(
            `/api/boards/${boardId}/tiles`,
            data
        );
        return response.data;
    },

    // Update tile
    updateTile: async (
        boardId: string,
        tileId: string,
        data: Partial<CreateTileData>
    ) => {
        const response = await api.patch<Tile>(
            `/api/boards/${boardId}/tiles/${tileId}`,
            data
        );
        return response.data;
    },

    // Delete tile
    deleteTile: async (boardId: string, tileId: string) => {
        const response = await api.delete(
            `/api/boards/${boardId}/tiles/${tileId}`
        );
        return response.data;
    },
};

export const metadataAPI = {
    fetchMetadata: async (url: string) => {
        const response = await api.get('/api/metadata', {
            params: { url },
        });
        return response.data;
    },
};
