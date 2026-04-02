import { apiClient } from './client';
import { AuthResponse, AuthUser, ApiResponse } from '../types';

export const authApi = {
  login: (email: string, password: string) =>
    apiClient.post<AuthResponse>('/auth/login', { email, password }),

  register: (data: {
    email: string;
    password: string;
    role: 'SEEKER' | 'EMPLOYER';
    firstName?: string;
    lastName?: string;
    companyName?: string;
  }) => apiClient.post<AuthResponse>('/auth/register', data),

  logout: (refreshToken: string) =>
    apiClient.post('/auth/logout', { refreshToken }),

  me: () =>
    apiClient.get<ApiResponse<AuthUser>>('/auth/me'),

  forgotPassword: (email: string) =>
    apiClient.post('/auth/forgot-password', { email }),

  resetPassword: (token: string, password: string) =>
    apiClient.post('/auth/reset-password', { token, password }),

  verifyEmail: (email: string, otp: string) =>
    apiClient.post('/auth/verify-email', { email, otp }),

  resendVerification: (email: string) =>
    apiClient.post('/auth/resend-verification', { email }),

  changePassword: (currentPassword: string, newPassword: string) =>
    apiClient.post('/auth/change-password', { currentPassword, newPassword }),

  /** Register Expo push token with backend (new endpoint — see backend note) */
  registerPushToken: (token: string, platform: 'ios' | 'android') =>
    apiClient.post('/notifications/push-token', { token, platform }),

  unregisterPushToken: (token: string) =>
    apiClient.delete('/notifications/push-token', { data: { token } }),
};
