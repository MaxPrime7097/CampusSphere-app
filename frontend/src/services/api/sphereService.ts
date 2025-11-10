import { api, endpoints } from './config';
import type { UserProfile } from './userService';

export interface Sphere {
    id: string;
    name: string;
    description: string;
    type: string;
    coverImage?: string;
    creatorId: string;
    memberCount: number;
    requireApproval: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface SphereMember {
    user: UserProfile;
    role: 'Creator' | 'Admin' | 'Member';
    joinedAt: string;
}

export interface JoinRequest {
    userId: string;
    user: UserProfile;
    sphereId: string;
    status: 'pending' | 'approved' | 'rejected';
    requestedAt: string;
}

export const sphereService = {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async getAllSpheres(filters?: Record<string, any>): Promise<Sphere[]> {
        const response = await api.get(endpoints.spheres.list, { params: filters });
        return response.data;
    },

    async createSphere(data: Partial<Sphere>): Promise<Sphere> {
        const response = await api.post(endpoints.spheres.create, data);
        return response.data;
    },

    async getSphere(id: string): Promise<Sphere> {
        const response = await api.get(endpoints.spheres.details(id));
        return response.data;
    },

    async updateSphere(id: string, data: Partial<Sphere>): Promise<Sphere> {
        const response = await api.put(endpoints.spheres.details(id), data);
        return response.data;
    },

    async deleteSphere(id: string): Promise<void> {
        await api.delete(endpoints.spheres.details(id));
    },

    async joinSphere(id: string): Promise<any> {
        const response = await api.post(endpoints.spheres.join(id));
        return response.data;
    },

    async leaveSphere(id: string): Promise<any> {
        const response = await api.post(endpoints.spheres.leave(id));
        return response.data;
    },

    async getMembers(id: string): Promise<SphereMember[]> {
        const response = await api.get(endpoints.spheres.members(id));
        return response.data;
    },

    async addMember(sphereId: string, userId: string, role: string): Promise<void> {
        await api.post(endpoints.spheres.members(sphereId), { userId, role });
    },

    async removeMember(sphereId: string, userId: string): Promise<void> {
        await api.delete(`${endpoints.spheres.members(sphereId)}/${userId}`);
    },

    async updateMemberRole(sphereId: string, userId: string, role: string): Promise<void> {
        await api.put(`${endpoints.spheres.members(sphereId)}/${userId}`, { role });
    },

    async getPendingRequests(sphereId: string): Promise<JoinRequest[]> {
        const response = await api.get(`${endpoints.spheres.details(sphereId)}/requests`);
        return response.data;
    },

    async approveJoinRequest(sphereId: string, userId: string): Promise<void> {
        await api.post(`${endpoints.spheres.details(sphereId)}/requests/${userId}/approve`);
    },

    async rejectJoinRequest(sphereId: string, userId: string): Promise<void> {
        await api.post(`${endpoints.spheres.details(sphereId)}/requests/${userId}/reject`);
    }
};