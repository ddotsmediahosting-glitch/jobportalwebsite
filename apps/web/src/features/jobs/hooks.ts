import { useMutation, useQuery } from "@tanstack/react-query";
import { api } from "../../lib/api";

export function useJobs(params: Record<string, string | number | undefined>) {
  return useQuery({
    queryKey: ["jobs", params],
    queryFn: async () => (await api.get("/api/v1/jobs", { params })).data
  });
}

export function useJobDetail(slug: string) {
  return useQuery({
    queryKey: ["job", slug],
    queryFn: async () => (await api.get(`/api/v1/jobs/${slug}`)).data,
    enabled: Boolean(slug)
  });
}

export function useApplyJob(jobId: string) {
  return useMutation({
    mutationFn: async (payload: { coverLetter?: string; answers?: Record<string, unknown> }) =>
      (await api.post(`/api/v1/applications/jobs/${jobId}/apply`, payload)).data
  });
}
