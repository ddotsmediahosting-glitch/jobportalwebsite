import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import * as SecureStore from 'expo-secure-store';
import { API_URL } from '../constants';

const ACCESS_KEY = 'uaejobs_access_token';
const REFRESH_KEY = 'uaejobs_refresh_token';

export const tokenStorage = {
  getAccess:    () => SecureStore.getItemAsync(ACCESS_KEY),
  setAccess:    (t: string) => SecureStore.setItemAsync(ACCESS_KEY, t),
  getRefresh:   () => SecureStore.getItemAsync(REFRESH_KEY),
  setRefresh:   (t: string) => SecureStore.setItemAsync(REFRESH_KEY, t),
  clear:        () => Promise.all([
    SecureStore.deleteItemAsync(ACCESS_KEY),
    SecureStore.deleteItemAsync(REFRESH_KEY),
  ]),
};

export const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 15_000,
  headers: { 'Content-Type': 'application/json' },
});

// ── Request: attach Bearer token ─────────────────────────────────────────────
apiClient.interceptors.request.use(async (config) => {
  const token = await tokenStorage.getAccess();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ── Response: silent 401 refresh ─────────────────────────────────────────────
let refreshing = false;
let queue: Array<{ resolve: (t: string) => void; reject: (e: unknown) => void }> = [];

type RetryConfig = InternalAxiosRequestConfig & { _retry?: boolean };

apiClient.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as RetryConfig | undefined;
    if (error.response?.status !== 401 || original?._retry || !original) {
      return Promise.reject(error);
    }

    const refreshToken = await tokenStorage.getRefresh();
    if (!refreshToken) {
      await tokenStorage.clear();
      // Emit event so store can handle the sign-out — avoids circular import
      authEventEmitter.emit('signout');
      return Promise.reject(error);
    }

    if (refreshing) {
      return new Promise((resolve, reject) => {
        queue.push({ resolve, reject });
      }).then((token) => {
        original.headers!['Authorization'] = `Bearer ${token}`;
        return apiClient(original);
      });
    }

    original._retry = true;
    refreshing = true;

    try {
      const { data } = await axios.post(`${API_URL}/auth/refresh`, { refreshToken });
      const { accessToken, refreshToken: newRefresh } = data.data;
      await tokenStorage.setAccess(accessToken);
      await tokenStorage.setRefresh(newRefresh);
      queue.forEach((p) => p.resolve(accessToken));
      queue = [];
      original.headers!['Authorization'] = `Bearer ${accessToken}`;
      return apiClient(original);
    } catch (refreshError) {
      queue.forEach((p) => p.reject(refreshError));
      queue = [];
      await tokenStorage.clear();
      authEventEmitter.emit('signout');
      return Promise.reject(refreshError);
    } finally {
      refreshing = false;
    }
  },
);

// ── Minimal event emitter for auth events (avoids circular deps) ──────────────
type Listener = () => void;
class AuthEventEmitter {
  private listeners: Map<string, Listener[]> = new Map();
  on(event: string, fn: Listener) {
    const list = this.listeners.get(event) ?? [];
    list.push(fn);
    this.listeners.set(event, list);
  }
  off(event: string, fn: Listener) {
    const list = this.listeners.get(event) ?? [];
    this.listeners.set(event, list.filter((l) => l !== fn));
  }
  emit(event: string) {
    (this.listeners.get(event) ?? []).forEach((fn) => fn());
  }
}
export const authEventEmitter = new AuthEventEmitter();
