import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";

export function AdminEmployerVerificationPage() {
  const { data } = useQuery({
    queryKey: ["pending-employers"],
    queryFn: async () => (await api.get("/admin/api/v1/employers/pending-verification")).data
  });

  return (
    <div className="space-y-3">
      <h1 className="text-2xl font-bold">Employer Verification</h1>
      {(data || []).map((e: any) => (
        <div key={e.id} className="rounded border bg-white p-3">{e.companyName} | {e.verifiedStatus}</div>
      ))}
    </div>
  );
}
