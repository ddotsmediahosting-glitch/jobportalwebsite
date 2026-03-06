import { useAuthContext } from '../contexts/AuthContext';

export function useAuth() {
  return useAuthContext();
}

export function useIsSeeker() {
  const { user } = useAuthContext();
  return user?.role === 'SEEKER';
}

export function useIsEmployer() {
  const { user } = useAuthContext();
  return user?.role === 'EMPLOYER';
}

export function useIsAdmin() {
  const { user } = useAuthContext();
  return user?.role === 'ADMIN' || user?.role === 'SUB_ADMIN';
}
