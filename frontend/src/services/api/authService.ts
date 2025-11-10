import { api, endpoints } from './config';

export interface LoginCredentials {
    email: string;
    password: string;
}

export interface RegisterData {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    // autres champs si nécessaire
}

export interface AuthResponse {
    token: string;
    refreshToken: string;
    user: {
        id: string;
        email: string;
        firstName: string;
        lastName: string;
        // autres champs utilisateur
    };
}

export const authService = {
    async login(credentials: LoginCredentials): Promise<AuthResponse> {
        const response = await api.post(endpoints.auth.login, credentials);
        this.setTokens(response.data.token, response.data.refreshToken);
        return response.data;
    },

    async register(data: RegisterData): Promise<AuthResponse> {
        const response = await api.post(endpoints.auth.register, data);
        this.setTokens(response.data.token, response.data.refreshToken);
        return response.data;
    },

    async logout(): Promise<void> {
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
    },

    async getCurrentUser() {
        const response = await api.get(endpoints.auth.me);
        return response.data;
    },

    async refreshToken(refreshToken: string): Promise<{ token: string }> {
        const response = await api.post(endpoints.auth.refresh, { refresh: refreshToken });
        return response.data;
    },

    setTokens(token: string, refreshToken: string): void {
        localStorage.setItem('token', token);
        localStorage.setItem('refreshToken', refreshToken);
    },

    getToken(): string | null {
        return localStorage.getItem('token');
    },

    getRefreshToken(): string | null {
        return localStorage.getItem('refreshToken');
    },

    isAuthenticated(): boolean {
        return !!this.getToken();
    }
};