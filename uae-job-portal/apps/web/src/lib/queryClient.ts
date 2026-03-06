import { QueryClient } from '@tanstack/react-query';
import { getApiError } from './api';
import toast from 'react-hot-toast';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 1000 * 60 * 2, // 2 min
      refetchOnWindowFocus: false,
    },
    mutations: {
      onError: (err) => {
        toast.error(getApiError(err));
      },
    },
  },
});
