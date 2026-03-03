import { useMutation } from "@tanstack/react-query";
import { api } from "../../lib/api";
import { setAuthSession } from "../../lib/auth";

export function useLogin() {
  return useMutation({
    mutationFn: async (payload: { email: string; password: string }) => (await api.post("/api/v1/auth/login", payload)).data,
    onSuccess: (data) => {
      setAuthSession({ accessToken: data.accessToken, refreshToken: data.refreshToken, user: data.user });
    }
  });
}

export function useRegister() {
  return useMutation({
    mutationFn: async (payload: { email: string; password: string; role: "JOB_SEEKER" | "EMPLOYER"; phone?: string }) =>
      (await api.post("/api/v1/auth/register", payload)).data
  });
}
