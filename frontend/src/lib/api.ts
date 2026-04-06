import axios, { AxiosError } from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || '';

export const api = axios.create({
  baseURL: `${BASE_URL}/api/v1`,
  headers: { 'Content-Type': 'application/json' },
});

// ─── Token management ──────────────────────────────────────────────────────────

const TOKEN_KEY = 'uaejobs_access_token';
const REFRESH_KEY = 'uaejobs_refresh_token';

export const tokenStorage = {
  getAccess: () => localStorage.getItem(TOKEN_KEY),
  setAccess: (t: string) => localStorage.setItem(TOKEN_KEY, t),
  getRefresh: () => localStorage.getItem(REFRESH_KEY),
  setRefresh: (t: string) => localStorage.setItem(REFRESH_KEY, t),
  clear: () => { localStorage.removeItem(TOKEN_KEY); localStorage.removeItem(REFRESH_KEY); },
};

// ─── Request interceptor – attach bearer token ─────────────────────────────────

api.interceptors.request.use((cfg) => {
  const token = tokenStorage.getAccess();
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

// ─── Response interceptor – refresh on 401 ────────────────────────────────────

let isRefreshing = false;
let pendingQueue: { resolve: (v: string) => void; reject: (e: unknown) => void }[] = [];

api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as typeof error.config & { _retry?: boolean };

    if (error.response?.status === 401 && !original?._retry) {
      const refreshToken = tokenStorage.getRefresh();
      if (!refreshToken) {
        tokenStorage.clear();
        window.location.href = '/login';
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          pendingQueue.push({ resolve, reject });
        }).then((token) => {
          original!.headers!['Authorization'] = `Bearer ${token}`;
          return api(original!);
        });
      }

      original!._retry = true;
      isRefreshing = true;

      try {
        const { data } = await axios.post(`${BASE_URL}/api/v1/auth/refresh`, { refreshToken });
        const { accessToken, refreshToken: newRefresh } = data.data;

        tokenStorage.setAccess(accessToken);
        tokenStorage.setRefresh(newRefresh);

        pendingQueue.forEach((p) => p.resolve(accessToken));
        pendingQueue = [];

        original!.headers!['Authorization'] = `Bearer ${accessToken}`;
        return api(original!);
      } catch (refreshError) {
        pendingQueue.forEach((p) => p.reject(refreshError));
        pendingQueue = [];
        tokenStorage.clear();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

// ─── Helper to extract error message ─────────────────────────────────────────

export function getApiError(err: unknown): string {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data;
    if (data?.errors?.length) return data.errors.join(', ');
    if (data?.error) return data.error;
    if (data?.message) return data.message;
    if (err.message) return err.message;
  }
  if (err instanceof Error) return err.message;
  return 'An unexpected error occurred';
}
