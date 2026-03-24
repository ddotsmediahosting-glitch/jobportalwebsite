import { apiClient } from './client';
import { SeekerProfile, ApiResponse } from '../types';

export const seekerApi = {
  getProfile: () =>
    apiClient.get<ApiResponse<SeekerProfile>>('/seeker/profile'),

  updateProfile: (data: Partial<SeekerProfile>) =>
    apiClient.put<ApiResponse<SeekerProfile>>('/seeker/profile', data),

  uploadAvatar: async (uri: string) => {
    const formData = new FormData();
    formData.append('avatar', {
      uri,
      name: 'avatar.jpg',
      type: 'image/jpeg',
    } as unknown as Blob);
    return apiClient.post<ApiResponse<{ avatarUrl: string }>>(
      '/seeker/profile/avatar',
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } },
    );
  },

  uploadResume: async (uri: string, name: string) => {
    const formData = new FormData();
    formData.append('resume', {
      uri,
      name,
      type: 'application/pdf',
    } as unknown as Blob);
    return apiClient.post('/seeker/resumes', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  deleteResume: (resumeId: string) =>
    apiClient.delete(`/seeker/resumes/${resumeId}`),

  setPrimaryResume: (resumeId: string) =>
    apiClient.patch(`/seeker/resumes/${resumeId}/primary`),

  getAlerts: () =>
    apiClient.get('/seeker/alerts'),

  createAlert: (data: {
    title: string;
    keywords?: string;
    emirate?: string;
    categoryId?: string;
    workMode?: string;
  }) => apiClient.post('/seeker/alerts', data),

  deleteAlert: (alertId: string) =>
    apiClient.delete(`/seeker/alerts/${alertId}`),
};
