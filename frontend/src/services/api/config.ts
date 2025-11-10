import axios from 'axios';

// Configuration de l'URL de base de l'API
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Instance axios avec la configuration de base
export const api = axios.create({
    baseURL: `${API_URL}/api`,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Intercepteur pour ajouter le token JWT aux requêtes
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Intercepteur pour gérer les erreurs
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        if (error.response?.status === 401) {
            // Token expiré ou invalide
            const refreshToken = localStorage.getItem('refreshToken');
            if (refreshToken) {
                try {
                    const response = await axios.post(`${API_URL}/api/auth/refresh/`, {
                        refresh: refreshToken,
                    });
                    const { access } = response.data;
                    localStorage.setItem('token', access);
                    
                    // Réessayer la requête originale avec le nouveau token
                    error.config.headers.Authorization = `Bearer ${access}`;
                    return axios(error.config);
                } catch (refreshError) {
                    // Échec du refresh, déconnecter l'utilisateur
                    localStorage.removeItem('token');
                    localStorage.removeItem('refreshToken');
                    window.location.href = '/login';
                }
            }
        }
        return Promise.reject(error);
    }
);

// Endpoints API
export const endpoints = {
    auth: {
        login: '/users/auth/login/',
        register: '/users/auth/register/',
        refresh: '/auth/refresh/',
        me: '/users/auth/me/',
    },
    users: {
        profile: (id: string) => `/users/${id}/`,
        update: (id: string) => `/users/${id}/`,
        connections: (id: string) => `/users/${id}/connections/`,
        removeConnection: (userId: string, connectionId: string) => 
            `/users/${userId}/connections/${connectionId}/`,
        search: '/users/search/',
    },
    spheres: {
        list: '/spheres/',
        create: '/spheres/',
        details: (id: string) => `/spheres/${id}/`,
        join: (id: string) => `/spheres/${id}/join/`,
        leave: (id: string) => `/spheres/${id}/leave/`,
        members: (id: string) => `/spheres/${id}/members/`,
    },
    posts: {
        list: '/posts/',
        create: '/posts/',
        details: (id: string) => `/posts/${id}/`,
        like: (id: string) => `/posts/${id}/like/`,
        comment: (id: string) => `/posts/${id}/comment/`,
        comments: (id: string) => `/posts/${id}/comments/`,
    },
    resources: {
        list: '/resources/',
        create: '/resources/',
        details: (id: string) => `/resources/${id}/`,
        download: (id: string) => `/resources/${id}/download/`,
        save: (id: string) => `/resources/${id}/save/`,
    },
    tasks: {
        list: '/tasks/',
        create: '/tasks/',
        details: (id: string) => `/tasks/${id}/`,
        complete: (id: string) => `/tasks/${id}/complete/`,
    },
    messages: {
        conversations: '/conversations/',
        messages: (conversationId: string) => `/conversations/${conversationId}/messages/`,
    },
    notifications: {
        list: '/notifications/',
        markRead: (id: string) => `/notifications/${id}/read/`,
    },
    search: {
        global: '/search/',
        suggestions: '/search/suggestions/',
    },
    filters: {
        options: '/filters/',
    },
};