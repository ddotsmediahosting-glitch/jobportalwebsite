import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";

export function ApplicationsPage() {
  const { data } = useQuery({
    queryKey: ["applications"],
    queryFn: async () => (await api.get("/api/v1/applications/me")).data
  });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">My Applications</h1>
      <div className="grid gap-3">
        {(data || []).map((a: any) => (
          <article key={a.id} className="rounded border bg-white p-3">
            <p className="font-semibold">{a.job?.title}</p>
            <p className="text-sm text-slate-600">Status: {a.status}</p>
          </article>
        ))}
      </div>
    </div>
  );
}
