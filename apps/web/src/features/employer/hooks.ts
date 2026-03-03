import { useQuery } from "@tanstack/react-query";
import { api } from "../../lib/api";

export function useEmployerDashboard() {
  return useQuery({
    queryKey: ["employer-dashboard"],
    queryFn: async () => {
      const [profile, analytics] = await Promise.all([
        api.get("/api/v1/employers/me"),
        api.get("/api/v1/employers/analytics")
      ]);
      return { profile: profile.data, analytics: analytics.data };
    }
  });
}
