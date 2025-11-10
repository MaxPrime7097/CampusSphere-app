import { api, endpoints } from './config';
import type { Sphere } from './sphereService';
import type { UserProfile } from './userService';
import type { Resource } from './contentServices';

export interface SearchResult {
    users: UserProfile[];
    spheres: Sphere[];
    resources: Resource[];
}

export interface FilterOptions {
    sphereTypes: string[];
    subjects: string[];
    resourceTypes: string[];
}

export const utilsService = {
    async search(query: string, type?: 'users' | 'spheres' | 'resources'): Promise<SearchResult> {
        const response = await api.get(endpoints.search.global, {
            params: { q: query, type }
        });
        return response.data;
    },

    async getSearchSuggestions(query: string): Promise<string[]> {
        const response = await api.get(endpoints.search.suggestions, {
            params: { q: query }
        });
        return response.data;
    },

    async getFilterOptions(): Promise<FilterOptions> {
        const response = await api.get(endpoints.filters.options);
        return response.data;
    }
};