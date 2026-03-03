import { useQuery } from "@tanstack/react-query";
import { api } from "../../lib/api";

export function useAdminDashboard() {
  return useQuery({
    queryKey: ["admin-dashboard"],
    queryFn: async () => (await api.get("/admin/api/v1/dashboard")).data
  });
}

export function useAdminUsers() {
  return useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => (await api.get("/admin/api/v1/users")).data
  });
}

export function useAdminReports() {
  return useQuery({
    queryKey: ["admin-reports"],
    queryFn: async () => (await api.get("/admin/api/v1/reports")).data
  });
}
