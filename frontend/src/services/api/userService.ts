import { api, endpoints } from './config';

export interface UserProfile {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    avatar?: string;
    coverImage?: string;
    bio?: string;
    // autres champs profil
}

export interface Connection {
    id: string;
    userId: string;
    status: 'pending' | 'accepted' | 'rejected';
    createdAt: string;
}

export const userService = {
    async getProfile(userId: string): Promise<UserProfile> {
        const response = await api.get(endpoints.users.profile(userId));
        return response.data;
    },

    async updateProfile(userId: string, data: Partial<UserProfile>): Promise<UserProfile> {
        const response = await api.put(endpoints.users.update(userId), data);
        return response.data;
    },

    async getConnections(userId: string): Promise<Connection[]> {
        const response = await api.get(endpoints.users.connections(userId));
        return response.data;
    },

    async sendConnectionRequest(userId: string): Promise<Connection> {
        const response = await api.post(endpoints.users.connections(userId));
        return response.data;
    },

    async removeConnection(userId: string, connectionId: string): Promise<void> {
        await api.delete(endpoints.users.removeConnection(userId, connectionId));
    },

    async searchUsers(query: string): Promise<UserProfile[]> {
        const response = await api.get(endpoints.users.search, {
            params: { q: query }
        });
        return response.data;
    },

    async uploadAvatar(userId: string, file: File): Promise<{ avatarUrl: string }> {
        const formData = new FormData();
        formData.append('avatar', file);
        const response = await api.post(`/users/${userId}/avatar`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    },

    async uploadCover(userId: string, file: File): Promise<{ coverUrl: string }> {
        const formData = new FormData();
        formData.append('cover', file);
        const response = await api.post(`/users/${userId}/cover`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    }
};