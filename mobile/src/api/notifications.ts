import { apiClient } from './client';
import { AppNotification, PaginatedResponse } from '../types';

export const notificationsApi = {
  list: (page = 1, limit = 20) =>
    apiClient.get<PaginatedResponse<AppNotification>>(
      `/notifications?page=${page}&limit=${limit}`,
    ),

  markRead: (id: string) =>
    apiClient.patch(`/notifications/${id}/read`),

  markAllRead: () =>
    apiClient.patch('/notifications/read-all'),

  delete: (id: string) =>
    apiClient.delete(`/notifications/${id}`),
};
