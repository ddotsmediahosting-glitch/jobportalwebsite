import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";

export function SavedJobsPage() {
  const { data } = useQuery({ queryKey: ["export-data"], queryFn: async () => (await api.get("/api/v1/users/me/export")).data });
  const savedJobs = data?.user?.jobSeekerProfile?.preferencesJson?.savedJobs || [];

  return (
    <div className="space-y-3">
      <h1 className="text-2xl font-bold">Saved Jobs</h1>
      <pre className="rounded border bg-white p-3 text-sm">{JSON.stringify(savedJobs, null, 2)}</pre>
    </div>
  );
}
