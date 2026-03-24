import { apiClient } from './client';
import { Job, JobFilters, PaginatedResponse, ApiResponse, Category } from '../types';

export const jobsApi = {
  list: (filters: JobFilters = {}) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => {
      if (v !== undefined && v !== '' && v !== null) params.set(k, String(v));
    });
    return apiClient.get<PaginatedResponse<Job>>(`/jobs?${params.toString()}`);
  },

  detail: (slug: string) =>
    apiClient.get<ApiResponse<Job>>(`/jobs/${slug}`),

  featured: () =>
    apiClient.get<PaginatedResponse<Job>>('/jobs?isFeatured=true&limit=6'),

  categories: () =>
    apiClient.get<ApiResponse<Category[]>>('/categories'),

  featuredCategories: () =>
    apiClient.get<ApiResponse<Category[]>>('/categories/featured'),

  saveJob: (jobId: string) =>
    apiClient.post(`/seeker/saved-jobs/${jobId}`),

  unsaveJob: (jobId: string) =>
    apiClient.delete(`/seeker/saved-jobs/${jobId}`),

  savedJobs: (page = 1, limit = 20) =>
    apiClient.get<PaginatedResponse<{ id: string; job: Job; createdAt: string }>>(
      `/seeker/saved-jobs?page=${page}&limit=${limit}`,
    ),

  apply: (jobId: string, data: { resumeId?: string; coverLetter?: string }) =>
    apiClient.post(`/jobs/${jobId}/apply`, data),

  applications: (page = 1, limit = 20) =>
    apiClient.get(`/seeker/applications?page=${page}&limit=${limit}`),
};
