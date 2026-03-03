import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";

export function AdminJobsModerationPage() {
  const { data } = useQuery({ queryKey: ["mod-jobs"], queryFn: async () => (await api.get("/admin/api/v1/jobs/moderation")).data });
  return (
    <div className="space-y-3">
      <h1 className="text-2xl font-bold">Jobs Moderation</h1>
      {(data || []).map((j: any) => (
        <div key={j.id} className="rounded border bg-white p-3">{j.title} | {j.status}</div>
      ))}
    </div>
  );
}
