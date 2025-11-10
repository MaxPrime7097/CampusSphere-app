import { api, endpoints } from './config';
import type { UserProfile } from './userService';

// Types pour les posts
export interface Post {
    id: string;
    content: string;
    authorId: string;
    author: UserProfile;
    sphereId: string;
    likes: number;
    hasLiked: boolean;
    attachments?: string[];
    createdAt: string;
    updatedAt: string;
}

export interface Comment {
    id: string;
    content: string;
    authorId: string;
    author: UserProfile;
    postId: string;
    createdAt: string;
}

// Service pour les posts
export const postService = {
    async getPosts(sphereId?: string): Promise<Post[]> {
        const response = await api.get(endpoints.posts.list, {
            params: { sphere_id: sphereId }
        });
        return response.data;
    },

    async createPost(data: { content: string; sphereId: string; attachments?: File[] }): Promise<Post> {
        const formData = new FormData();
        formData.append('content', data.content);
        formData.append('sphereId', data.sphereId);
        if (data.attachments) {
            data.attachments.forEach(file => {
                formData.append('attachments', file);
            });
        }
        const response = await api.post(endpoints.posts.create, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
    },

    async likePost(id: string): Promise<void> {
        await api.post(endpoints.posts.like(id));
    },

    async getComments(postId: string): Promise<Comment[]> {
        const response = await api.get(endpoints.posts.comments(postId));
        return response.data;
    },

    async addComment(postId: string, content: string): Promise<Comment> {
        const response = await api.post(endpoints.posts.comment(postId), { content });
        return response.data;
    },

    async deletePost(id: string): Promise<void> {
        await api.delete(endpoints.posts.details(id));
    }
};

// Types pour les ressources
export interface Resource {
    id: string;
    title: string;
    description: string;
    type: string;
    url: string;
    fileSize?: number;
    uploaderId: string;
    uploader: UserProfile;
    sphereId: string;
    downloads: number;
    createdAt: string;
}

// Service pour les ressources
export const resourceService = {
    async getResources(sphereId?: string): Promise<Resource[]> {
        const response = await api.get(endpoints.resources.list, {
            params: { sphere_id: sphereId }
        });
        return response.data;
    },

    async uploadResource(data: { 
        title: string;
        description: string;
        type: string;
        sphereId: string;
        file: File;
    }): Promise<Resource> {
        const formData = new FormData();
        Object.entries(data).forEach(([key, value]) => {
            formData.append(key, value);
        });
        
        const response = await api.post(endpoints.resources.create, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
    },

    async downloadResource(id: string): Promise<Blob> {
        const response = await api.get(endpoints.resources.download(id), {
            responseType: 'blob'
        });
        return response.data;
    },

    async deleteResource(id: string): Promise<void> {
        await api.delete(endpoints.resources.details(id));
    }
};

// Types pour les tâches
export interface Task {
    id: string;
    title: string;
    description: string;
    sphereId: string;
    assignedToId?: string;
    assignedTo?: UserProfile;
    status: 'pending' | 'in_progress' | 'completed';
    priority: 'low' | 'medium' | 'high';
    dueDate?: string;
    createdAt: string;
    updatedAt: string;
}

// Service pour les tâches
export const taskService = {
    async getTasks(sphereId?: string): Promise<Task[]> {
        const response = await api.get(endpoints.tasks.list, {
            params: { sphere_id: sphereId }
        });
        return response.data;
    },

    async createTask(data: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): Promise<Task> {
        const response = await api.post(endpoints.tasks.create, data);
        return response.data;
    },

    async updateTask(id: string, data: Partial<Task>): Promise<Task> {
        const response = await api.put(endpoints.tasks.details(id), data);
        return response.data;
    },

    async completeTask(id: string): Promise<Task> {
        const response = await api.post(endpoints.tasks.complete(id));
        return response.data;
    },

    async deleteTask(id: string): Promise<void> {
        await api.delete(endpoints.tasks.details(id));
    }
};