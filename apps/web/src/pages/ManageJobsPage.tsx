import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";

export function ManageJobsPage() {
  const { data } = useQuery({
    queryKey: ["manage-jobs"],
    queryFn: async () => (await api.get("/api/v1/jobs", { params: { page: 1, limit: 20 } })).data
  });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Manage Jobs</h1>
      {(data?.items || []).map((job: any) => (
        <div key={job.id} className="rounded border bg-white p-3">
          <p className="font-semibold">{job.title}</p>
          <p className="text-sm">Status: {job.status}</p>
        </div>
      ))}
    </div>
  );
}
